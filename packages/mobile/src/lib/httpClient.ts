import { getConnectionState } from "../stores/useConnectionStore";

export class ApiError extends Error {
	constructor(
		message: unknown,
		public status: number,
		public code?: string,
	) {
		const safeMessage = typeof message === "string" 
			? message 
			: message instanceof Error 
				? message.message 
				: String(message);
		super(safeMessage);
		this.name = "ApiError";
	}
}

interface RequestOptions {
	method?: "GET" | "POST" | "PUT" | "DELETE";
	body?: unknown;
	params?: Record<string, string | number | boolean | undefined>;
	includeDirectory?: boolean;
}

function buildUrl(
	path: string,
	params?: Record<string, string | number | boolean | undefined>,
): string {
	const { serverUrl } = getConnectionState();
	if (!serverUrl) {
		throw new ApiError("Not connected to server", 0, "NOT_CONNECTED");
	}

	const url = new URL(path, serverUrl);

	if (params) {
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined) {
				url.searchParams.set(key, String(value));
			}
		}
	}

	return url.toString();
}

function getAuthHeaders(): HeadersInit {
	const { authToken } = getConnectionState();
	if (!authToken) {
		throw new ApiError("Not authenticated", 401, "NOT_AUTHENTICATED");
	}

	return {
		Authorization: `Bearer ${authToken}`,
		"Content-Type": "application/json",
	};
}

export async function apiRequest<T>(
	path: string,
	options: RequestOptions = {},
): Promise<T> {
	const { method = "GET", body, params, includeDirectory = false } = options;
	const state = getConnectionState();
	const { directory, serverUrl, authToken } = state;

	console.log(`[API] Request: ${method} ${path}`);
	console.log(`[API] Server URL: ${serverUrl}`);
	console.log(`[API] Has auth token: ${Boolean(authToken)}`);

	const queryParams = { ...params };
	if (includeDirectory && directory) {
		queryParams.directory = directory;
	}

	const url = buildUrl(path, queryParams);
	console.log(`[API] Full URL: ${url}`);

	const headers = getAuthHeaders();

	let response: Response;
	try {
		response = await fetch(url, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		});
	} catch (networkError) {
		const errorMessage = networkError instanceof Error 
			? networkError.message 
			: "Network request failed";
		console.error(`[API] Network error for ${method} ${path}:`, networkError);
		throw new ApiError(`Network error: ${errorMessage}`, 0, "NETWORK_ERROR");
	}

	if (!response.ok) {
		let errorData: unknown = null;
		try {
			const text = await response.text();
			if (text) {
				try {
					errorData = JSON.parse(text);
				} catch {
					errorData = text;
				}
			}
		} catch {
			errorData = null;
		}
		
		let errorMessage = response.statusText || `HTTP ${response.status}`;
		let errorCode: string | undefined;
		
		if (errorData) {
			if (typeof errorData === "string") {
				errorMessage = errorData;
			} else if (typeof errorData === "object" && errorData !== null) {
				const data = errorData as Record<string, unknown>;
				errorMessage = 
					(typeof data.error === "string" && data.error) ||
					(typeof data.message === "string" && data.message) ||
					(typeof data.detail === "string" && data.detail) ||
					(data.errors && Array.isArray(data.errors) 
						? data.errors.map((e: unknown) => {
							if (typeof e === "string") return e;
							if (typeof e === "object" && e !== null && "message" in e) {
								return String((e as { message: unknown }).message);
							}
							return String(e);
						}).join(", ")
						: null) ||
					JSON.stringify(errorData);
				errorCode = typeof data.code === "string" ? data.code : undefined;
			}
		}
		
		console.error(`[API] Error for ${method} ${path}: ${response.status} - ${errorMessage}`);
		throw new ApiError(errorMessage, response.status, errorCode);
	}

	const contentType = response.headers.get("content-type");
	const text = await response.text();
	
	if (!text) {
		return undefined as unknown as T;
	}
	
	if (contentType?.includes("application/json")) {
		return JSON.parse(text) as T;
	}

	return text as unknown as T;
}

export async function apiGet<T>(
	path: string,
	params?: Record<string, string | number | boolean | undefined>,
	includeDirectory = false,
): Promise<T> {
	return apiRequest<T>(path, { method: "GET", params, includeDirectory });
}

export async function apiPost<T>(
	path: string,
	body?: unknown,
	includeDirectory = false,
): Promise<T> {
	return apiRequest<T>(path, { method: "POST", body, includeDirectory });
}

export async function apiPut<T>(
	path: string,
	body?: unknown,
	includeDirectory = false,
): Promise<T> {
	return apiRequest<T>(path, { method: "PUT", body, includeDirectory });
}

export async function apiDelete<T>(
	path: string,
	body?: unknown,
	includeDirectory = false,
): Promise<T> {
	return apiRequest<T>(path, { method: "DELETE", body, includeDirectory });
}
