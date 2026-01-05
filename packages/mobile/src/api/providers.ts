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

type RawProviderFromAPI = Omit<Provider, "models"> & {
	models?: Record<string, Model>;
};
type ProvidersResponse = RawProviderFromAPI[] | { data?: RawProviderFromAPI[] };

function transformProviderModelsToArray(raw: RawProviderFromAPI): Provider {
	const modelsRecord = raw.models ?? {};
	const modelsArray = Object.values(modelsRecord);
	
	if (__DEV__) {
		console.log(`[Providers] Transforming provider "${raw.id}":`, {
			rawModelsType: typeof raw.models,
			rawModelsIsArray: Array.isArray(raw.models),
			rawModelsKeys: raw.models ? Object.keys(raw.models).slice(0, 3) : [],
			transformedCount: modelsArray.length,
			firstModel: modelsArray[0] ? { id: modelsArray[0].id, name: modelsArray[0].name } : null,
		});
	}
	
	return {
		id: raw.id,
		name: raw.name,
		models: modelsArray,
		enabled: raw.enabled,
	};
}

function unwrapProviders(response: unknown): Provider[] {
	let rawProviders: RawProviderFromAPI[] = [];

	if (__DEV__) {
		console.log("[Providers] Raw API response:", {
			type: typeof response,
			isArray: Array.isArray(response),
			keys: response && typeof response === "object" ? Object.keys(response as object).slice(0, 5) : [],
			sample: JSON.stringify(response).slice(0, 500),
		});
	}

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

	if (__DEV__) {
		console.log("[Providers] Extracted raw providers:", {
			count: rawProviders.length,
			providerIds: rawProviders.map(p => p.id),
		});
	}

	const result = rawProviders.map(transformProviderModelsToArray);
	
	if (__DEV__) {
		console.log("[Providers] Final transformed providers:", 
			result.map(p => ({ id: p.id, modelCount: p.models?.length, firstModelName: p.models?.[0]?.name }))
		);
	}
	
	return result;
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
