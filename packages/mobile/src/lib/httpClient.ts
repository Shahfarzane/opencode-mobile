import { Platform } from "react-native";
import { getConnectionState } from "../stores/useConnectionStore";

const DEFAULT_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

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
	if (!authToken) {
		throw new ApiError("Not authenticated", 401, "NOT_AUTHENTICATED");
	}

	return {
		Authorization: `Bearer ${authToken}`,
		"Content-Type": "application/json",
		Accept: "application/json",
	};
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
		params, 
		includeDirectory = false,
		timeout = DEFAULT_TIMEOUT_MS,
		retries = MAX_RETRIES,
	} = options;
	
	const state = getConnectionState();
	const { directory, serverUrl, authToken } = state;

	console.log(`[API] Request: ${method} ${path}`);
	console.log(`[API] Server URL: ${serverUrl}`);
	console.log(`[API] Has auth token: ${Boolean(authToken)}`);
	console.log(`[API] Platform: ${Platform.OS}`);

	const queryParams = { ...params };
	if (includeDirectory && directory) {
		queryParams.directory = directory;
	}

	let url: string;
	try {
		url = buildUrl(path, queryParams);
	} catch (error) {
		console.error(`[API] URL build error:`, error);
		throw error;
	}
	
	console.log(`[API] Full URL: ${url}`);

	let headers: Record<string, string>;
	try {
		headers = getAuthHeaders();
	} catch (error) {
		console.error(`[API] Auth headers error:`, error);
		throw error;
	}

	const bodyString = body ? JSON.stringify(body) : null;
	let lastError: Error | null = null;

	for (let attempt = 0; attempt <= retries; attempt++) {
		if (attempt > 0) {
			const backoffMs = RETRY_DELAY_MS * (2 ** (attempt - 1));
			console.log(`[API] Retry ${attempt}/${retries} after ${backoffMs}ms delay`);
			await delay(backoffMs);
		}

		try {
			const response = await xhrRequest(method, url, headers, bodyString, timeout);

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
					console.warn(`[API] Retryable error for ${method} ${path}: ${response.status}`);
					continue;
				}
				
				console.error(`[API] Error for ${method} ${path}: ${response.status} - ${errorMessage}`);
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
			if (error instanceof ApiError) {
				if (error.code === "NETWORK_ERROR" || error.code === "TIMEOUT") {
					if (attempt < retries) {
						lastError = error;
						console.warn(`[API] ${error.code} for ${method} ${path}, retrying...`);
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
				console.warn(`[API] Unexpected error for ${method} ${path}:`, error);
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

export async function testServerConnectivity(
	serverUrl: string,
	timeoutMs = 10000,
): Promise<{ reachable: boolean; error?: string }> {
	const normalizedUrl = normalizeServerUrl(serverUrl);
	
	if (!isValidUrl(normalizedUrl)) {
		return { reachable: false, error: "Invalid URL format" };
	}

	const healthUrl = `${normalizedUrl}/health`;
	console.log(`[API] Testing connectivity to: ${healthUrl}`);

	try {
		const response = await xhrRequest(
			"GET",
			healthUrl,
			{ Accept: "application/json" },
			null,
			timeoutMs
		);

		if (response.status >= 200 && response.status < 300) {
			return { reachable: true };
		}

		return { 
			reachable: false, 
			error: `Server returned ${response.status}` 
		};
	} catch (error) {
		if (error instanceof ApiError) {
			return { reachable: false, error: error.message };
		}
		return { reachable: false, error: "Unknown error" };
	}
}
