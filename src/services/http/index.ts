import got, { Method } from "got";

type HttpClientMethod = Method;
type HttpClientOptions = {
	method: HttpClientMethod;
	headers?: Record<string, string>;
	body?: string;
};
type HttpClient = <Data = any>(
	path: string,
	options: HttpClientOptions
) => Promise<{ statusCode: number; body: Data }>;

const createClient = ({ headers }: { headers?: Record<string, string> }) => {
	const client = got.extend({
		headers: {
			"Content-Type": "application/json",
			...headers,
		},
		retry: 0,
		resolveBodyOnly: false,
		throwHttpErrors: false,
	});

	return async <Data = any>(path: string, options: HttpClientOptions) => {
		const isJsonResponse =
			(options.headers ?? {})["Accept"] === "application/json";

		return client<Data>(path, {
			...options,
			// @ts-expect-error
			responseType: isJsonResponse ? "json" : "buffer",
		});
	};
};

const http = { createClient };

export { http, HttpClient, HttpClientMethod, HttpClientOptions };
