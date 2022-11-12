import { http, HttpClientMethod, HttpClientOptions } from "../services";

type HttpRequestMock = {
	statusCode: number;
	body: any;
	url: string;
	method: HttpClientMethod;
};

const createHttpMockAPI = () => {
	let mocks: HttpRequestMock[] = [];

	return {
		mock: (mock: HttpRequestMock) => {
			mocks.push(mock);
		},
		setup: () => {
			// @ts-expect-error
			jest.spyOn(http, "createClient").mockImplementation(() => {
				const requestCountByMethodAndUrl: Record<string, number> = {};

				return async <Data = any>(url: string, options: HttpClientOptions) => {
					const id = `${options.method} ${url}`;
					const count = requestCountByMethodAndUrl[id] ?? 0;
					const matches = mocks.filter(
						(mock) => mock.url === url && mock.method === options.method
					);
					const match = matches[count] ?? matches[0];

					requestCountByMethodAndUrl[id]++;

					if (!match) {
						console.warn(
							`Unable to find http request mock for ${id}, did you forget to add the corresponding mock to your test suite?`
						);
					}

					return {
						statusCode: match?.statusCode ?? 200,
						body: (match?.body ?? null) as Data,
					};
				};
			});
		},
		teardown: () => {
			mocks = [];
		},
	};
};

export { createHttpMockAPI };
