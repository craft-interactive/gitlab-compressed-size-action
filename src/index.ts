import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as process from "node:process";

import { reporters } from "./reporters";
import {
	FileStat,
	GitLabAPI,
	HttpClient,
	createDiff,
	createLogger,
	getEnv,
	getFileStats,
	parseReadableFileSize,
	http,
} from "./services";
import { ReporterId, Services } from "./types";

type DiffOptions = {
	filePatterns: string[];
	outFile: string;
	auth: string;
	reporters: ReporterId[];
	silent?: boolean;
	thresholds?: {
		each?: string;
		overall?: string;
	};
};

const diff = async ({
	filePatterns,
	outFile,
	auth,
	silent = false,
	reporters: reporterIds = ["gitlab-pr-note"],
	thresholds = {},
}: DiffOptions) => {
	const env = getEnv();
	const cwd = process.cwd();
	const logger = createLogger({ silent });
	const gitlab = new GitLabAPI({
		services: {
			logger,
			http: http.createClient({
				headers: { "Private-Token": auth },
			}) as HttpClient,
		},
	});
	const isPullRequest = Boolean(env.CI_MERGE_REQUEST_IID);
	const [current, last] = await Promise.all([
		getFileStats(
			filePatterns.map((pattern) => path.join(process.cwd(), pattern))
		),
		(async (): Promise<FileStat[]> => {
			if (!isPullRequest) {
				return [];
			}

			const job = await gitlab.getLatestPipelineJob({
				ref: "main",
				jobName: env.CI_JOB_NAME,
			});
			const artifacts = job?.id
				? await gitlab.getJobArtifacts({ jobId: job?.id })
				: [];
			const artifact = artifacts.find(
				(artifact) => artifact.name === outFile.replace("./", "")
			);

			return artifact?.contents;
		})(),
	]);

	await fs.writeFile(
		path.join(cwd, outFile),
		JSON.stringify(current, null, 2),
		"utf-8"
	);

	if (!isPullRequest) {
		logger.success(`Finished creating the last known file-size artifact.`);

		return [];
	}

	if (last) {
		logger.info(
			`Resolved last known file-size artifact, creating the change report...`
		);
	} else {
		logger.warn(
			`Unable to resolve last known file-size artifact, creating the initial change report...`
		);
	}

	const results = [
		...current.map(({ path, bytes }) => {
			return createDiff({
				id: path,
				sizes: {
					current: bytes,
					last: last?.find((s) => s.path === path)?.bytes ?? 0,
				},
				threshold: thresholds.each
					? parseReadableFileSize(thresholds.each)
					: null,
			});
		}),
		createDiff({
			id: "summary",
			sizes: {
				current: current.reduce((acc, stat) => acc + stat.bytes, 0),
				last: (last ?? []).reduce((acc, stat) => acc + stat.bytes, 0),
			},
			threshold: thresholds.overall
				? parseReadableFileSize(thresholds.overall)
				: null,
		}),
	];

	// Execute all reporters with the results
	const services: Services = {
		env,
		gitlab,
		logger,
	};

	await Promise.all(
		reporterIds.map(async (reporterId) => {
			const reporter = reporters[reporterId];

			if (!reporter) {
				logger.warn(
					`Unable to resolve reporter "${reporterId}". Available values are "${Object.keys(
						reporters
					).join(", ")}".`
				);
				return;
			}

			try {
				await reporter(results, services);
			} catch (err) {
				logger.error(
					err as Error,
					`Failed to execute reporter "${reporterId}".`
				);
			}
		})
	);

	logger.success(`Finished executing all reporters.`);
	logger.info(`Checking if all thresholds are met...`);

	// Conditionally fail the job if a threshold exceeded.
	const isThresholdMatched = results.every((result) => result.isBelowThreshold);

	if (isPullRequest && !isThresholdMatched) {
		throw new Error(
			"One or more files do not meet the specified thresholds. See reporter output above for more details."
		);
	}

	logger.success(`Threshold are met, we are good to go! :-)`);

	return results;
};

export { diff };
export * from "./types";
