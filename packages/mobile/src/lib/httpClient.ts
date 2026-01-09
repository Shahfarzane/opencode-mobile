import { getConnectionState } from "../stores/useConnectionStore";

const DEFAULT_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

// Debug logging - set to true to see API requests/responses
const DEBUG_HTTP = __DEV__;

function debugLog(message: string, data?: unknown) {
	if (DEBUG_HTTP) {
		if (data !== undefined) {
			console.log(`[HTTP] ${message}`, data);
		} else {
			console.log(`[HTTP] ${message}`);
		}
	}
}

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
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: unknown;
	rawBody?: string;
	contentType?: string;
	params?: Record<string, string | number | boolean | undefined>;
	includeDirectory?: boolean;
	timeout?: number;
	retries?: number;
}

interface XHRResponse {
	status: number;
	statusText: string;
	data: string;
	headers: Record<string, string>;
}

function isValidUrl(urlString: string): boolean {
	try {
		const url = new URL(urlString);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

function normalizeServerUrl(url: string): string {
	let normalized = url.trim();
	
	if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
		normalized = `http://${normalized}`;
	}
	
	if (normalized.endsWith("/")) {
		normalized = normalized.slice(0, -1);
	}
	
	return normalized;
}

function buildUrl(
	path: string,
	params?: Record<string, string | number | boolean | undefined>,
): string {
	const { serverUrl } = getConnectionState();
	if (!serverUrl) {
		throw new ApiError("Not connected to server", 0, "NOT_CONNECTED");
	}

	const normalizedServerUrl = normalizeServerUrl(serverUrl);
	
	if (!isValidUrl(normalizedServerUrl)) {
		throw new ApiError(`Invalid server URL: ${serverUrl}`, 0, "INVALID_URL");
	}

	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	const url = new URL(normalizedPath, normalizedServerUrl);

	if (params) {
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined) {
				url.searchParams.set(key, String(value));
			}
		}
	}

	return url.toString();
}

function getAuthHeaders(): Record<string, string> {
	const { authToken } = getConnectionState();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		Accept: "application/json",
	};

	if (authToken) {
		headers.Authorization = `Bearer ${authToken}`;
	}

	return headers;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(status: number): boolean {
	return status >= 500 && status < 600;
}

function xhrRequest(
	method: string,
	url: string,
	headers: Record<string, string>,
	body: string | null,
	timeoutMs: number,
): Promise<XHRResponse> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		let settled = false;

		const timeoutId = setTimeout(() => {
			if (!settled) {
				settled = true;
				xhr.abort();
				reject(new ApiError("Request timed out", 0, "TIMEOUT"));
			}
		}, timeoutMs);

		xhr.onreadystatechange = () => {
			if (xhr.readyState === XMLHttpRequest.DONE && !settled) {
				settled = true;
				clearTimeout(timeoutId);

				if (xhr.status === 0) {
					reject(new ApiError(
						"Network request failed. Check your connection and server URL.",
						0,
						"NETWORK_ERROR"
					));
					return;
				}

				const responseHeaders: Record<string, string> = {};
				const headerString = xhr.getAllResponseHeaders();
				if (headerString) {
					const headerPairs = headerString.trim().split("\r\n");
					for (const pair of headerPairs) {
						const idx = pair.indexOf(": ");
						if (idx > 0) {
							const key = pair.substring(0, idx).toLowerCase();
							const value = pair.substring(idx + 2);
							responseHeaders[key] = value;
						}
					}
				}

				resolve({
					status: xhr.status,
					statusText: xhr.statusText,
					data: xhr.responseText,
					headers: responseHeaders,
				});
			}
		};

		xhr.onerror = () => {
			if (!settled) {
				settled = true;
				clearTimeout(timeoutId);
				reject(new ApiError(
					"Network request failed. Check your connection and server URL.",
					0,
					"NETWORK_ERROR"
				));
			}
		};

		xhr.ontimeout = () => {
			if (!settled) {
				settled = true;
				clearTimeout(timeoutId);
				reject(new ApiError("Request timed out", 0, "TIMEOUT"));
			}
		};

		xhr.open(method, url, true);
		xhr.timeout = timeoutMs;

		for (const [key, value] of Object.entries(headers)) {
			xhr.setRequestHeader(key, value);
		}

		xhr.send(body);
	});
}

export async function apiRequest<T>(
	path: string,
	options: RequestOptions = {},
): Promise<T> {
	const { 
		method = "GET", 
		body,
		rawBody,
		contentType,
		params, 
		includeDirectory = false,
		timeout = DEFAULT_TIMEOUT_MS,
		retries = MAX_RETRIES,
	} = options;
	
	const { directory } = getConnectionState();

	const queryParams = { ...params };
	if (includeDirectory && directory) {
		queryParams.directory = directory;
	}

	const url = buildUrl(path, queryParams);
	const headers = getAuthHeaders();
	
	if (contentType) {
		headers["Content-Type"] = contentType;
	}

	debugLog(`${method} ${url}`, { includeDirectory, directory, hasAuth: !!headers.Authorization });

	const bodyString = rawBody ?? (body ? JSON.stringify(body) : null);
	let lastError: Error | null = null;

	for (let attempt = 0; attempt <= retries; attempt++) {
		if (attempt > 0) {
			const backoffMs = RETRY_DELAY_MS * (2 ** (attempt - 1));
			await delay(backoffMs);
		}

		try {
			const response = await xhrRequest(method, url, headers, bodyString, timeout);
			debugLog(`Response ${response.status}`, { url, dataLength: response.data?.length });

			if (!response.status || response.status < 200 || response.status >= 300) {
				let errorData: unknown = null;
				if (response.data) {
					try {
						errorData = JSON.parse(response.data);
					} catch {
						errorData = response.data;
					}
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
							errorMessage;
						errorCode = typeof data.code === "string" ? data.code : undefined;
					}
				}
				
				const apiError = new ApiError(errorMessage, response.status, errorCode);
				
				if (isRetryableError(response.status) && attempt < retries) {
					lastError = apiError;
					continue;
				}
				
				throw apiError;
			}

			const contentType = response.headers["content-type"] || "";
			
			if (!response.data) {
				return undefined as unknown as T;
			}
			
			if (contentType.includes("application/json")) {
				return JSON.parse(response.data) as T;
			}

			return response.data as unknown as T;

		} catch (error) {
			debugLog(`Error on ${url}`, { error: error instanceof Error ? error.message : error, attempt });
			if (error instanceof ApiError) {
				if (error.code === "NETWORK_ERROR" || error.code === "TIMEOUT") {
					if (attempt < retries) {
						lastError = error;
						continue;
					}
				}
				throw error;
			}

			const networkError = new ApiError(
				`Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
				0,
				"UNKNOWN_ERROR"
			);
			
			if (attempt < retries) {
				lastError = networkError;
				continue;
			}
			
			throw networkError;
		}
	}

	throw lastError || new ApiError("Request failed after retries", 0, "EXHAUSTED_RETRIES");
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

export async function apiPatch<T>(
	path: string,
	body?: unknown,
	includeDirectory = false,
): Promise<T> {
	return apiRequest<T>(path, { method: "PATCH", body, includeDirectory });
}

