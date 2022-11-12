import { createHttpMockAPI, createEnvMockAPI } from "../../mocks";
import {
	GitLabAPI,
	createLogger,
	getEnv,
	http as _http,
	HttpClient,
} from "../../services";
import { Diff, Services } from "../../types";
import { gitlabPullRequestNote } from "./index";

describe("reporters['gitlab-pr-note']()", () => {
	const env = createEnvMockAPI();
	const http = createHttpMockAPI();
	let getPullRequestComments: jest.SpyInstance;
	let createPullRequestComment: jest.SpyInstance;
	let modifyPullRequestComment: jest.SpyInstance;
	let results: Diff[] = [];
	let services: Services;

	beforeEach(async () => {
		const logger = createLogger({ silent: true });

		env.setup();
		http.setup();

		services = {
			gitlab: new GitLabAPI({
				services: { logger, http: _http.createClient({}) as HttpClient },
			}),
			logger,
			env: getEnv(),
		};
		results = [
			{
				id: "src/mocks/files/normalize.css",
				status: "increased",
				change: { raw: 100, pretty: "+0.1 KB", percent: 1 },
				size: { raw: 6251, pretty: "6.1 KB" },
				isBelowThreshold: true,
			},
			{
				id: "src/mocks/files/normalize.css.zip",
				status: "unchanged",
				change: { raw: 1941, pretty: "+1.9 KB", percent: 100 },
				size: { raw: 1941, pretty: "1.9 KB" },
				isBelowThreshold: true,
			},
			{
				id: "summary",
				status: "added",
				change: { raw: 8192, pretty: "+8 KB", percent: 100 },
				size: { raw: 8192, pretty: "8 KB" },
				isBelowThreshold: true,
			},
		];
		getPullRequestComments = jest.spyOn(
			services.gitlab,
			"getPullRequestComments"
		);
		createPullRequestComment = jest.spyOn(
			services.gitlab,
			"createPullRequestComment"
		);
		modifyPullRequestComment = jest.spyOn(
			services.gitlab,
			"modifyPullRequestComment"
		);
	});

	afterEach(async () => {
		env.teardown();
		http.teardown();
	});

	it("should fetch the existing pr comments", async () => {
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/merge_requests/2501/notes",
			statusCode: 200,
			body: [],
		});
		http.mock({
			method: "POST",
			url: "https://gitlab.com/api/v4/projects/2/merge_requests/2501/notes",
			statusCode: 200,
			body: {},
		});

		await gitlabPullRequestNote(results, services);

		expect(getPullRequestComments).toHaveBeenCalledWith({
			mergeRequestIid: 2501,
		});
	});

	it("should create a new one pr note if none was previously created", async () => {
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/merge_requests/2501/notes",
			statusCode: 200,
			body: [],
		});
		http.mock({
			method: "POST",
			url: "https://gitlab.com/api/v4/projects/2/merge_requests/2501/notes",
			statusCode: 200,
			body: {},
		});

		await gitlabPullRequestNote(results, services);

		expect(createPullRequestComment).toHaveBeenCalledWith({
			comment: `### :package: file-size-change report

| Path | Size | Change  |        |
| ---- | ---- | ------- | ------ |
| src/mocks/files/normalize.css | 6.1 KB | +0.1 KB (1%) | :white_check_mark: |
| src/mocks/files/normalize.css.zip | 1.9 KB | +1.9 KB (100%) | :white_check_mark: |
| **summary** | 8 KB | +8 KB (100%) | :white_check_mark: |
`,
			mergeRequestIid: 2501,
		});
		expect(modifyPullRequestComment).not.toHaveBeenCalled();
	});

	it("should modify an existing pr comment if one was previsouly created", async () => {
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/merge_requests/2501/notes",
			statusCode: 200,
			body: [
				{
					id: 23816,
					type: "",
					attachment: null,
					author: {
						id: 1,
						name: "GitLab file-size change bot",
						username: "gitlab-file-size-change-bot",
						state: "active",
						avatar_url: "",
						web_url: "",
					},
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
					system: false,
					noteable_id: 20381,
					noteable_type: "",
					resolvable: true,
					confidential: false,
					internal: false,
					noteable_iid: 20381,
					commands_changes: [],
					body: `### :package: file-size-change report

		| Path | Size | Change  |        |
		| ---- | ---- | ------- | ------ |
		| src/mocks/files/normalize.css | 6.1 KB | +6.1 KB (100%) | :white_check_mark: |
		| **summary** | 8 KB | +8 KB (100%) | :white_check_mark: |
		`,
				},
			],
		});
		http.mock({
			method: "PUT",
			url: "https://gitlab.com/api/v4/projects/2/merge_requests/2501/notes/23816",
			statusCode: 200,
			body: {},
		});

		await gitlabPullRequestNote(results, services);

		expect(modifyPullRequestComment).toHaveBeenCalledWith({
			comment: `### :package: file-size-change report

| Path | Size | Change  |        |
| ---- | ---- | ------- | ------ |
| src/mocks/files/normalize.css | 6.1 KB | +0.1 KB (1%) | :white_check_mark: |
| src/mocks/files/normalize.css.zip | 1.9 KB | +1.9 KB (100%) | :white_check_mark: |
| **summary** | 8 KB | +8 KB (100%) | :white_check_mark: |
`,
			mergeRequestIid: 2501,
			commentId: 23816,
		});
		expect(createPullRequestComment).not.toHaveBeenCalled();
	});

	it("should mark failed thresholds with the ':boom:' emoji", async () => {
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/merge_requests/2501/notes",
			statusCode: 200,
			body: [],
		});
		http.mock({
			method: "POST",
			url: "https://gitlab.com/api/v4/projects/2/merge_requests/2501/notes",
			statusCode: 200,
			body: {},
		});

		results = [
			{
				id: "src/mocks/files/normalize.css",
				status: "increased",
				change: { raw: 100, pretty: "+0.1 KB", percent: 1 },
				size: { raw: 6251, pretty: "6.1 KB" },
				isBelowThreshold: false,
			},
			{
				id: "summary",
				status: "added",
				change: { raw: 8192, pretty: "+8 KB", percent: 100 },
				size: { raw: 8192, pretty: "8 KB" },
				isBelowThreshold: false,
			},
		];

		await gitlabPullRequestNote(results, services);

		expect(createPullRequestComment).toHaveBeenCalledWith({
			comment: `### :package: file-size-change report

| Path | Size | Change  |        |
| ---- | ---- | ------- | ------ |
| src/mocks/files/normalize.css | 6.1 KB | +0.1 KB (1%) | :boom: |
| **summary** | 8 KB | +8 KB (100%) | :boom: |
`,
			mergeRequestIid: 2501,
		});
	});

	it("should mark unchanged files with a less noisy emoji", async () => {
		http.mock({
			method: "GET",
			url: "https://gitlab.com/api/v4/projects/2/merge_requests/2501/notes",
			statusCode: 200,
			body: [],
		});
		http.mock({
			method: "POST",
			url: "https://gitlab.com/api/v4/projects/2/merge_requests/2501/notes",
			statusCode: 200,
			body: {},
		});

		results = [
			{
				id: "src/mocks/files/normalize.css",
				status: "unchanged",
				change: { raw: 0, pretty: "0 KB", percent: 0 },
				size: { raw: 6251, pretty: "6.1 KB" },
				isBelowThreshold: true,
			},
			{
				id: "summary",
				status: "unchanged",
				change: { raw: 0, pretty: "0 KB", percent: 0 },
				size: { raw: 8192, pretty: "8 KB" },
				isBelowThreshold: true,
			},
		];

		await gitlabPullRequestNote(results, services);

		expect(createPullRequestComment).toHaveBeenCalledWith({
			comment: `### :package: file-size-change report

| Path | Size | Change  |        |
| ---- | ---- | ------- | ------ |
| src/mocks/files/normalize.css | 6.1 KB | 0 KB (0%) | :small_blue_diamond: |
| **summary** | 8 KB | 0 KB (0%) | :white_check_mark: |
`,
			mergeRequestIid: 2501,
		});
	});
});
