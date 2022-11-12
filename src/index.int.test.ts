import { createHttpMockAPI, createEnvMockAPI } from "./mocks";
import { zip } from "./services";
import { reporters } from "./reporters";
import { diff } from "./index";

jest.mock("consola");

describe("diff()", () => {
	const http = createHttpMockAPI();
	const env = createEnvMockAPI();

	beforeEach(async () => {
		Object.keys(reporters).forEach((id) => {
			jest.spyOn(reporters, id as any).mockImplementation(async () => {});
		});

		env.setup();
		http.setup();
	});

	afterEach(async () => {
		env.teardown();
		http.teardown();
	});

	it("should read the current fs.stats from disk and write them to the outFile path", async () => {
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/pipelines?ref=main",
			statusCode: 200,
			body: [],
		});

		const results = await diff({
			filePatterns: ["./src/mocks/files/*.css", "./src/mocks/files/*.zip"],
			outFile: ".tmp/.gitlab-compressed-size-action-report.json",
			auth: "my-gitlab-token",
			reporters: ["gitlab-pr-note"],
		});

		expect(results).toMatchSnapshot();
	});

	it("should retreive the previous fs.stats from the GitLab API and create a diff based on the current fs.stats from disk", async () => {
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/pipelines?ref=main",
			statusCode: 200,
			body: [{ id: 20391 }],
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/pipelines/20391/jobs?include_retried=true",
			statusCode: 200,
			body: [
				{ id: 219270, stage: "install", name: "install", status: "success" },
				{ id: 219271, stage: "build", name: "build", status: "success" },
				{
					id: 219273,
					stage: "build",
					name: "file-size-change",
					status: "success",
				},
				{ id: 219274, stage: "test", name: "test", status: "success" },
			],
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/jobs/219273/artifacts",
			statusCode: 200,
			body: await zip.create([
				{
					name: ".tmp/.gitlab-compressed-size-action-report.json",
					contents: JSON.stringify([
						{ path: "src/mocks/files/normalize.css", bytes: 6251 },
						{ path: "src/mocks/files/normalize.css.zip", bytes: 1941 },
					]),
				},
			]),
		});

		const results = await diff({
			filePatterns: ["./src/mocks/files/*.css", "./src/mocks/files/*.zip"],
			outFile: ".tmp/.gitlab-compressed-size-action-report.json",
			auth: "my-gitlab-token",
			reporters: ["gitlab-pr-note"],
		});

		expect(results).toMatchSnapshot();
	});

	it("should not fail if retrival of the previous fs.stats from the GitLab API failed", async () => {
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/pipelines?ref=main",
			statusCode: 500,
			body: "Whelp that's not good",
		});

		const results = await diff({
			filePatterns: ["./src/mocks/files/*.css", "./src/mocks/files/*.zip"],
			outFile: ".tmp/.gitlab-compressed-size-action-report.json",
			auth: "my-gitlab-token",
			reporters: ["gitlab-pr-note"],
		});

		expect(results).toMatchSnapshot();
	});

	it("should retry the retrival from the GitLab API if the last pipeline is still in 'created' state", async () => {
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/pipelines?ref=main",
			statusCode: 200,
			body: [{ id: 20391 }],
		});

		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/pipelines/20391/jobs?include_retried=true",
			statusCode: 200,
			body: [{ id: 219273 }],
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/jobs/219273",
			statusCode: 200,
			body: {
				id: 219273,
				stage: "build",
				name: "file-size-change",
				status: "created", // ! Simulate that the job is created upon the first retrival of the job.
			},
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/jobs/219273",
			statusCode: 200,
			body: {
				id: 219273,
				stage: "build",
				name: "file-size-change",
				status: "success",
			},
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/jobs/219273/artifacts",
			statusCode: 200,
			body: await zip.create([
				{
					name: ".tmp/.gitlab-compressed-size-action-report.json",
					contents: JSON.stringify([
						{ path: "src/mocks/files/normalize.css", bytes: 6251 },
						{ path: "src/mocks/files/normalize.css.zip", bytes: 1941 },
					]),
				},
			]),
		});

		const results = await diff({
			filePatterns: ["./src/mocks/files/*.css", "./src/mocks/files/*.zip"],
			outFile: ".tmp/.gitlab-compressed-size-action-report.json",
			auth: "my-gitlab-token",
			reporters: ["gitlab-pr-note"],
		});

		expect(results).toMatchSnapshot();
	});

	it("should retry the retrival from the GitLab API if the last pipeline is still in 'pending' state", async () => {
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/pipelines?ref=main",
			statusCode: 200,
			body: [{ id: 20391 }],
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/pipelines/20391/jobs?include_retried=true",
			statusCode: 200,
			body: [{ id: 219273 }],
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/jobs/219273",
			statusCode: 200,
			body: {
				id: 219273,
				stage: "build",
				name: "file-size-change",
				status: "pending", // ! Simulate that the job is pending upon the first retrival of the job.
			},
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/jobs/219273",
			statusCode: 200,
			body: {
				id: 219273,
				stage: "build",
				name: "file-size-change",
				status: "success",
			},
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/jobs/219273/artifacts",
			statusCode: 200,
			body: await zip.create([
				{
					name: ".tmp/.gitlab-compressed-size-action-report.json",
					contents: JSON.stringify([
						{ path: "src/mocks/files/normalize.css", bytes: 6251 },
						{ path: "src/mocks/files/normalize.css.zip", bytes: 1941 },
					]),
				},
			]),
		});

		const results = await diff({
			filePatterns: ["./src/mocks/files/*.css", "./src/mocks/files/*.zip"],
			outFile: ".tmp/.gitlab-compressed-size-action-report.json",
			auth: "my-gitlab-token",
			reporters: ["gitlab-pr-note"],
		});

		expect(results).toMatchSnapshot();
	});

	it("should retry the retrival from the GitLab API if the last pipeline is still in 'running' state", async () => {
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/pipelines?ref=main",
			statusCode: 200,
			body: [{ id: 20391 }],
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/pipelines/20391/jobs?include_retried=true",
			statusCode: 200,
			body: [{ id: 219273 }],
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/jobs/219273",
			statusCode: 200,
			body: {
				id: 219273,
				stage: "build",
				name: "file-size-change",
				status: "running", // ! Simulate that the job is running upon the first retrival of the job.
			},
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/jobs/219273",
			statusCode: 200,
			body: {
				id: 219273,
				stage: "build",
				name: "file-size-change",
				status: "success",
			},
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/jobs/219273/artifacts",
			statusCode: 200,
			body: await zip.create([
				{
					name: ".tmp/.gitlab-compressed-size-action-report.json",
					contents: JSON.stringify([
						{ path: "src/mocks/files/normalize.css", bytes: 6251 },
						{ path: "src/mocks/files/normalize.css.zip", bytes: 1941 },
					]),
				},
			]),
		});

		const results = await diff({
			filePatterns: ["./src/mocks/files/*.css", "./src/mocks/files/*.zip"],
			outFile: ".tmp/.gitlab-compressed-size-action-report.json",
			auth: "my-gitlab-token",
			reporters: ["gitlab-pr-note"],
		});

		expect(results).toMatchSnapshot();
	});

	it("should retry the retrival from the GitLab API if the last pipeline is still in 'waiting_for_resource' state", async () => {
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/pipelines?ref=main",
			statusCode: 200,
			body: [{ id: 20391 }],
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/pipelines/20391/jobs?include_retried=true",
			statusCode: 200,
			body: [{ id: 219273 }],
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/jobs/219273",
			statusCode: 200,
			body: {
				id: 219273,
				stage: "build",
				name: "file-size-change",
				status: "waiting_for_resource", // ! Simulate that the job is waiting_for_resource upon the first retrival of the job.
			},
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/jobs/219273",
			statusCode: 200,
			body: {
				id: 219273,
				stage: "build",
				name: "file-size-change",
				status: "success",
			},
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/jobs/219273/artifacts",
			statusCode: 200,
			body: await zip.create([
				{
					name: ".tmp/.gitlab-compressed-size-action-report.json",
					contents: JSON.stringify([
						{ path: "src/mocks/files/normalize.css", bytes: 6251 },
						{ path: "src/mocks/files/normalize.css.zip", bytes: 1941 },
					]),
				},
			]),
		});

		const results = await diff({
			filePatterns: ["./src/mocks/files/*.css", "./src/mocks/files/*.zip"],
			outFile: ".tmp/.gitlab-compressed-size-action-report.json",
			auth: "my-gitlab-token",
			reporters: ["gitlab-pr-note"],
		});

		expect(results).toMatchSnapshot();
	});

	it("should fail if an individual file failed the 'each' threshold", async () => {
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/pipelines?ref=main",
			statusCode: 200,
			body: [],
		});
		let error;

		try {
			await diff({
				filePatterns: ["./src/mocks/files/*.css", "./src/mocks/files/*.zip"],
				outFile: ".tmp/.gitlab-compressed-size-action-report.json",
				auth: "my-gitlab-token",
				reporters: ["gitlab-pr-note"],
				thresholds: {
					each: "6 KB",
				},
			});
		} catch (err) {
			error = err;
		}

		expect(error).toBeDefined();
		expect(error).toMatchObject(
			new Error(
				"One or more files do not meet the specified thresholds. See reporter output above for more details."
			)
		);
	});

	it("should fail if all files in summary failed the 'overall' threshold", async () => {
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/pipelines?ref=main",
			statusCode: 200,
			body: [],
		});
		let error;

		try {
			await diff({
				filePatterns: ["./src/mocks/files/*.css", "./src/mocks/files/*.zip"],
				outFile: ".tmp/.gitlab-compressed-size-action-report.json",
				auth: "my-gitlab-token",
				reporters: ["gitlab-pr-note"],
				thresholds: {
					overall: "7 KB",
				},
			});
		} catch (err) {
			error = err;
		}

		expect(error).toBeDefined();
		expect(error).toMatchObject(
			new Error(
				"One or more files do not meet the specified thresholds. See reporter output above for more details."
			)
		);
	});

	it("should execute the reporters and gracefully handle errors", async () => {
		jest.spyOn(reporters, "gitlab-pr-note").mockImplementation(async () => {
			throw new Error("nah");
		});
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/pipelines?ref=main",
			statusCode: 200,
			body: [],
		});
		let error;

		try {
			await diff({
				filePatterns: ["./src/mocks/files/*.css", "./src/mocks/files/*.zip"],
				outFile: ".tmp/.gitlab-compressed-size-action-report.json",
				auth: "my-gitlab-token",
				reporters: ["gitlab-pr-note"],
			});
		} catch (err) {
			error = err;
		}

		expect(reporters["gitlab-pr-note"]).toHaveBeenCalledTimes(1);
		expect(error).not.toBeDefined();
	});

	it("should gracefully handle invalid reporter IDs", async () => {
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/pipelines?ref=main",
			statusCode: 200,
			body: [],
		});
		let error;

		try {
			await diff({
				filePatterns: ["./src/mocks/files/*.css", "./src/mocks/files/*.zip"],
				outFile: ".tmp/.gitlab-compressed-size-action-report.json",
				auth: "my-gitlab-token",
				// @ts-expect-error
				reporters: ["invalid-reporter-id"],
			});
		} catch (err) {
			error = err;
		}

		expect(error).not.toBeDefined();
	});
});
