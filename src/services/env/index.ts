import { cleanEnv, num, str } from "envalid";

type Env = {
	CI_API_V4_URL: string;
	CI_PROJECT_ID: number;

	CI_JOB_NAME: string;

	CI_PIPELINE_IID: number;

	CI_MERGE_REQUEST_IID: number;
};

let instance: Env;

const getEnv = () => {
	if (!instance) {
		instance = cleanEnv(process.env, {
			CI_API_V4_URL: str({}),
			CI_PROJECT_ID: num(),

			CI_JOB_NAME: str(),

			CI_PIPELINE_IID: num(),

			CI_MERGE_REQUEST_IID: num({ default: 0 }),
		});
	}

	return instance;
};

export { Env, getEnv };
