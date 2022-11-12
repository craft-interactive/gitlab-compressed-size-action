import type { Config } from "jest";
import * as path from "node:path";
import * as process from "node:process";

// Ensure a consistent timezone for tests, note that we also run our
// services in the "UTC" timezone in AWS so this setting is consistent.
process.env.TZ = "UTC";
process.env.NODE_ENV = "test";

const config: Config = {
	testEnvironment: "node",
	clearMocks: true,

	testMatch: ["**/?(*.)+(unit|int).test.ts"],
	testPathIgnorePatterns: ["/node_modules/", "/build/"],

	// Configure coverage collection
	reporters: ["jest-junit", "default"],
	collectCoverage: true,
	collectCoverageFrom: ["src/**/*.ts"],
	coveragePathIgnorePatterns: ["/node_modules/", "/types/"],
	coverageProvider: "v8",
	coverageReporters: ["cobertura", "text-summary", "html"],

	modulePathIgnorePatterns: ["/build/"],
	watchPathIgnorePatterns: ["/.tmp/"],

	// Configure ts-jest so that our tests can be written in .ts files and coverage is using
	// our source code instead of the build output (which makes code coverage more precise).
	transform: {
		"^.+\\.ts?$": [
			"ts-jest",
			{
				tsconfig: path.join(process.cwd(), "tsconfig.json"),
				// ! Disable type-checking to enhance the performance of the tests.
				isolatedModules: true,
			},
		],
	},
};

export default config;
