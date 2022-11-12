import { createHttpMockAPI, createEnvMockAPI } from "../../mocks";
import {
	GitLabAPI,
	createLogger,
	http as _http,
	getEnv,
	HttpClient,
} from "../../services";
import { Diff, Services } from "../../types";
import { stdout } from "./index";

describe("reporters['stdout']()", () => {
	const http = createHttpMockAPI();
	const env = createEnvMockAPI();
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
				status: "added",
				change: { raw: 6251, pretty: "+6.1 KB", percent: 100 },
				size: { raw: 6251, pretty: "6.1 KB" },
				isBelowThreshold: true,
			},
			{
				id: "src/mocks/files/normalize.css.zip",
				status: "added",
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
	});

	afterEach(async () => {
		env.teardown();
		http.teardown();
	});

	it("should log the results to the process output", async () => {
		const log = jest.spyOn(console, "log");

		await stdout(results, services);

		expect(log).toHaveBeenCalledWith(results);
	});
});
