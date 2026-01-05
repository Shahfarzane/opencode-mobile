import { apiGet, apiPost } from "../lib/httpClient";

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

type ProvidersResponse = Provider[] | { data?: Provider[] };

function unwrapProviders(response: unknown): Provider[] {
	if (Array.isArray(response)) {
		return response;
	}
	if (response && typeof response === "object") {
		const obj = response as Record<string, unknown>;
		if (Array.isArray(obj.data)) {
			return obj.data as Provider[];
		}
	}
	return [];
}

export const providersApi = {
	async list(): Promise<Provider[]> {
		const response = await apiGet<ProvidersResponse>("/api/provider", {}, true);
		return unwrapProviders(response);
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
};
