import { Env, getEnv } from "../env";
import type { HttpClient } from "../http";
import type { Logger } from "../logger";
import { zip } from "../zip";
import type { MergeRequestNote, Pipeline, PipelineJob } from "./types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Dependencies = {
	logger: Logger;
	http: HttpClient;
};

class GitLabAPI {
	private readonly services: Dependencies;
	private readonly env: Env;

	constructor({ services }: { services: Dependencies }) {
		this.services = services;
		this.env = getEnv();
	}

	async getLatestPipelineJob({
		ref,
		jobName,
	}: {
		ref: string;
		jobName: string;
	}) {
		this.services.logger.info(
			`Resolving pipeline job found for name "${jobName}" on ref "${ref}"...`
		);

		const isJobPending = (job: PipelineJob) =>
			["created", "pending", "running", "waiting_for_resource"].includes(
				job.status
			);
		const pipelines = await this.getPipelinesForRef({ ref });

		// After receiving the first chunk of successful pipelines, we synchronously iterate over each pipeline and check if we can find the given job in it.
		// If a job was found matching the required name, we will return it if it succeded, if it is still pending we will wait until it has been finished.
		return await pipelines.reduce<Promise<null | PipelineJob>>(
			async (previous, pipeline) => {
				return previous.then(async (match) => {
					if (match) {
						return match;
					}

					const jobs = await this.getPipelineJobs({ pipelineId: pipeline.id });
					let job: PipelineJob | null | undefined = jobs.find(
						(job) => job?.name === jobName
					);

					while (job && isJobPending(job)) {
						this.services.logger.info(
							`Pipeline job "${job.id}" is still in status "${job?.status}", waiting for completion...`
						);

						await delay(1000);

						job = await this.getPipelineJob({ jobId: job.id });
					}

					if (job) {
						this.services.logger.info(
							`Resolved pipeline job "${job.id}" for name "${jobName}"  on ref "${ref}"`
						);
					} else {
						this.services.logger.warn(
							`No pipeline job found for name "${jobName}" on ref "${ref}". Checking the next pipeline...`
						);
					}

					return job ?? null;
				});
			},
			Promise.resolve(null)
		);
	}

	async getPipelinesForRef({ ref }: { ref: string }) {
		const { env } = this;
		const res = await this.services.http<Pipeline[]>(
			`${env.CI_API_V4_URL}/projects/${env.CI_PROJECT_ID}/pipelines?ref=${ref}`,
			{
				method: "GET",
				headers: {
					Accept: "application/json",
				},
			}
		);

		if (res.statusCode !== 200) {
			this.services.logger.warn(
				`Failed to retrieve the pipelines for ref "${ref}".`,
				{ statusCode: res.statusCode, body: res.body }
			);
			return [];
		}

		return res.body ?? [];
	}

	async getPipelineJobs({ pipelineId }: { pipelineId: number }) {
		const { env } = this;
		const res = await this.services.http<PipelineJob[]>(
			`${env.CI_API_V4_URL}/projects/${env.CI_PROJECT_ID}/pipelines/${pipelineId}/jobs?include_retried=true`,
			{
				method: "GET",
				headers: {
					Accept: "application/json",
				},
			}
		);

		if (res.statusCode !== 200) {
			this.services.logger.warn(
				`Failed to retrieve the pipelines jobs for id "${pipelineId}".`,
				{ statusCode: res.statusCode, body: res.body }
			);
			return [];
		}

		return res.body ?? [];
	}

	async getPipelineJob({ jobId }: { jobId: number }) {
		const { env } = this;
		const res = await this.services.http<PipelineJob>(
			`${env.CI_API_V4_URL}/projects/${env.CI_PROJECT_ID}/jobs/${jobId}`,
			{
				method: "GET",
				headers: {
					Accept: "application/json",
				},
			}
		);

		if (res.statusCode !== 200) {
			this.services.logger.warn(
				`Failed to retrieve the pipelines job for id "${jobId}".`,
				{ statusCode: res.statusCode, body: res.body }
			);
			return null;
		}

		return res.body;
	}

	async getJobArtifacts({ jobId }: { jobId: number }) {
		const { env } = this;
		const res = await this.services.http<Buffer>(
			`${env.CI_API_V4_URL}/projects/${env.CI_PROJECT_ID}/jobs/${jobId}/artifacts`,
			{
				method: "GET",
			}
		);

		if (res.statusCode !== 200) {
			const { body, statusCode } = res;

			this.services.logger.warn(
				`Failed to retrieve the job artifacts for id "${jobId}".`,
				{
					statusCode,
					body: body instanceof Buffer ? body.toString("utf8") : body,
				}
			);
			return [];
		}

		return await zip.extract(res.body);
	}

	async getPullRequestComments({
		mergeRequestIid,
	}: {
		mergeRequestIid: number;
	}) {
		const { env } = this;
		const res = await this.services.http<MergeRequestNote[]>(
			`${env.CI_API_V4_URL}/projects/${env.CI_PROJECT_ID}/merge_requests/${mergeRequestIid}/notes`,
			{
				method: "GET",
				headers: {
					Accept: "application/json",
				},
			}
		);

		if (res.statusCode !== 200) {
			this.services.logger.warn(
				`Failed to retreive the pull request comments for merge request id "${mergeRequestIid}".`,
				{ statusCode: res.statusCode, body: res.body }
			);
			return [];
		}

		return res.body;
	}

	async createPullRequestComment({
		mergeRequestIid,
		comment,
	}: {
		mergeRequestIid: number;
		comment: string;
	}) {
		const { env } = this;
		const res = await this.services.http(
			`${env.CI_API_V4_URL}/projects/${env.CI_PROJECT_ID}/merge_requests/${mergeRequestIid}/notes`,
			{
				method: "POST",
				headers: {
					Accept: "application/json",
				},
				body: JSON.stringify({
					body: comment,
				}),
			}
		);

		if (res.statusCode !== 201) {
			this.services.logger.error(
				new Error(`Failed to create pull-request comment`),
				`Failed to create pull-request comment for merge request id "${mergeRequestIid}".`,
				{ statusCode: res.statusCode, body: res.body }
			);
		}
	}

	async modifyPullRequestComment({
		mergeRequestIid,
		commentId,
		comment,
	}: {
		mergeRequestIid: number;
		commentId: number;
		comment: string;
	}) {
		const { env } = this;

		const res = await this.services.http(
			`${env.CI_API_V4_URL}/projects/${env.CI_PROJECT_ID}/merge_requests/${mergeRequestIid}/notes/${commentId}`,
			{
				method: "PUT",
				headers: {
					Accept: "application/json",
				},
				body: JSON.stringify({
					body: comment,
				}),
			}
		);

		if (res.statusCode !== 200) {
			this.services.logger.error(
				new Error(`Failed to update pull-request comment`),
				`Failed to update pull-request comment for merge request id "${mergeRequestIid}" and comment "${commentId}".`,
				{ statusCode: res.statusCode, body: res.body }
			);
		}
	}
}

export { GitLabAPI };
