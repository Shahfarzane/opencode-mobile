import { apiDelete, apiGet, apiPost, apiPut } from "../lib/httpClient";

export interface Model {
	id: string;
	name: string;
	contextLength?: number;
	outputLength?: number;
}

export interface Provider {
	id: string;
	name: string;
	models?: Model[];
	enabled?: boolean;
}

type RawProviderFromAPI = Omit<Provider, "models"> & {
	models?: Record<string, Model>;
};
type ProvidersResponse = RawProviderFromAPI[] | { data?: RawProviderFromAPI[] };

function transformProviderModelsToArray(raw: RawProviderFromAPI): Provider {
	const modelsRecord = raw.models ?? {};
	const modelsArray = Object.values(modelsRecord);

	return {
		id: raw.id,
		name: raw.name,
		models: modelsArray,
		enabled: raw.enabled,
	};
}

function unwrapProviders(response: unknown): Provider[] {
	let rawProviders: RawProviderFromAPI[] = [];

	if (Array.isArray(response)) {
		rawProviders = response;
	} else if (response && typeof response === "object") {
		const obj = response as Record<string, unknown>;
		if (Array.isArray(obj.data)) {
			rawProviders = obj.data as RawProviderFromAPI[];
		} else if (Array.isArray(obj.all)) {
			rawProviders = obj.all as RawProviderFromAPI[];
		} else if (Array.isArray(obj.connected)) {
			rawProviders = obj.connected as RawProviderFromAPI[];
		} else if (Array.isArray(obj.providers)) {
			rawProviders = obj.providers as RawProviderFromAPI[];
		}
	}

	const result = rawProviders.map(transformProviderModelsToArray);

	return result;
}

// Response from /config/providers (authenticated providers only)
interface ConfigProvidersResponse {
	providers?: RawProviderFromAPI[];
	default?: Record<string, string>;
}

export const providersApi = {
	/**
	 * Get all available providers (for adding new providers)
	 */
	async list(): Promise<Provider[]> {
		const response = await apiGet<ProvidersResponse>("/api/provider", {}, true);
		return unwrapProviders(response);
	},

	/**
	 * Get only authenticated/connected providers (like PWA sidebar)
	 * Uses /config/providers endpoint which returns only providers with valid auth
	 */
	async listConnected(): Promise<Provider[]> {
		try {
			const response = await apiGet<ConfigProvidersResponse>(
				"/api/config/providers",
				{},
				true,
			);

			const rawProviders = response?.providers ?? [];
			const result = rawProviders.map(transformProviderModelsToArray);

			return result;
		} catch (error) {
			console.error("[Providers] Failed to get connected providers:", error);
			return [];
		}
	},

	async setApiKey(providerId: string, apiKey: string): Promise<boolean> {
		try {
			await apiPost(
				`/api/provider/${encodeURIComponent(providerId)}/key`,
				{ key: apiKey },
				true,
			);
			return true;
		} catch {
			return false;
		}
	},

	/**
	 * Save API key for a provider (used for connecting new providers)
	 */
	async saveApiKey(
		providerId: string,
		apiKey: string,
	): Promise<{ success: boolean; error?: string }> {
		try {
			const response = await apiPut<{ error?: string }>(
				`/api/auth/${encodeURIComponent(providerId)}`,
				{ type: "api", key: apiKey },
				true,
			);
			if (response?.error) {
				return { success: false, error: response.error };
			}
			return { success: true };
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to save API key";
			return { success: false, error: message };
		}
	},

	/**
	 * Disconnect a provider (remove authentication)
	 */
	async disconnect(
		providerId: string,
	): Promise<{ success: boolean; error?: string }> {
		try {
			await apiDelete(
				`/api/provider/${encodeURIComponent(providerId)}/auth`,
				true,
			);
			return { success: true };
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to disconnect provider";
			return { success: false, error: message };
		}
	},

	/**
	 * Get available auth methods for all providers
	 */
	async getAuthMethods(): Promise<Record<string, AuthMethod[]>> {
		try {
			const response = await apiGet<Record<string, unknown>>(
				"/api/provider/auth",
				{},
				true,
			);

			// Parse and normalize the auth methods
			const result: Record<string, AuthMethod[]> = {};
			if (response && typeof response === "object") {
				for (const [providerId, value] of Object.entries(response)) {
					if (Array.isArray(value)) {
						result[providerId] = value.filter(
							(entry): entry is AuthMethod =>
								typeof entry === "object" && entry !== null,
						);
					}
				}
			}
			return result;
		} catch (error) {
			console.error("[Providers] Failed to get auth methods:", error);
			return {};
		}
	},

	/**
	 * Start OAuth flow for a provider
	 */
	async startOAuth(
		providerId: string,
		methodIndex: number,
	): Promise<OAuthStartResult> {
		try {
			const response = await apiPost<Record<string, unknown>>(
				`/api/provider/${encodeURIComponent(providerId)}/oauth/authorize`,
				{ method: methodIndex },
				true,
			);

			// Extract OAuth details from various response formats
			const data =
				(response?.data as Record<string, unknown>) ?? response ?? {};
			const url =
				(typeof data.url === "string" && data.url) ||
				(typeof data.verification_uri_complete === "string" &&
					data.verification_uri_complete) ||
				(typeof data.verification_uri === "string" && data.verification_uri) ||
				undefined;
			const instructions =
				(typeof data.instructions === "string" && data.instructions) ||
				(typeof data.message === "string" && data.message) ||
				undefined;
			const userCode =
				(typeof data.user_code === "string" && data.user_code) ||
				(typeof data.code === "string" && data.code) ||
				(typeof data.userCode === "string" && data.userCode) ||
				undefined;

			return { success: true, url, instructions, userCode };
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to start OAuth flow";
			return { success: false, error: message };
		}
	},

	/**
	 * Complete OAuth flow for a provider
	 */
	async completeOAuth(
		providerId: string,
		methodIndex: number,
		code?: string,
	): Promise<{ success: boolean; error?: string }> {
		try {
			const body: { method: number; code?: string } = { method: methodIndex };
			if (code) {
				body.code = code;
			}

			await apiPost(
				`/api/provider/${encodeURIComponent(providerId)}/oauth/callback`,
				body,
				true,
			);
			return { success: true };
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to complete OAuth flow";
			return { success: false, error: message };
		}
	},
};

// Types for auth methods
export interface AuthMethod {
	type?: string;
	name?: string;
	label?: string;
	description?: string;
	help?: string;
	method?: number;
}

export interface OAuthStartResult {
	success: boolean;
	error?: string;
	url?: string;
	instructions?: string;
	userCode?: string;
}
