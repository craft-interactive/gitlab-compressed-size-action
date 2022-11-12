import { getEnv, Env } from "../services";

jest.mock("../services/env");

const createEnvMockAPI = () => {
	const defaults: Env = {
		CI_API_V4_URL: "https://gitlab.com/api/v4",
		CI_JOB_NAME: "file-size-change",
		CI_PROJECT_ID: 2,
		CI_PIPELINE_IID: 50192,
		CI_MERGE_REQUEST_IID: 2501,
	};
	let mocked: Env = {
		...defaults,
	};

	return {
		mock: (overrides: Partial<Env>) => {
			mocked = {
				...defaults,
				...mocked,
				...overrides,
			};
		},
		setup: () => {
			(getEnv as jest.Mock).mockImplementation(() => mocked);
		},
		teardown: () => {
			mocked = {
				...defaults,
			};
			jest.unmock("../services/env");
		},
	};
};

export { createEnvMockAPI };
