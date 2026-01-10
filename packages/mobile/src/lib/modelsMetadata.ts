/**
 * Fetches model metadata from models.dev API
 * This provides context window sizes, output limits, and other model capabilities
 */

const MODELS_DEV_API_URL = "https://models.dev/api.json";

export interface ModelMetadataLimit {
	context?: number;
	output?: number;
}

export interface ModelMetadata {
	id: string;
	name?: string;
	limit?: ModelMetadataLimit;
}

export type ModelsMetadataMap = Map<string, ModelMetadata>;

// Cache the metadata to avoid refetching
let cachedMetadata: ModelsMetadataMap | null = null;
let fetchPromise: Promise<ModelsMetadataMap> | null = null;

function buildModelMetadataKey(providerId: string, modelId: string): string {
	return `${providerId.toLowerCase()}/${modelId.toLowerCase()}`;
}

interface ModelsDevModelEntry {
	id?: string;
	name?: string;
	limit?: {
		context?: number;
		output?: number;
	};
}

interface ModelsDevProviderEntry {
	id?: string;
	models?: Record<string, ModelsDevModelEntry>;
}

type ModelsDevResponse = Record<string, ModelsDevProviderEntry>;

function transformModelsDevResponse(data: unknown): ModelsMetadataMap {
	const metadataMap: ModelsMetadataMap = new Map();

	if (!data || typeof data !== "object") {
		return metadataMap;
	}

	const payload = data as ModelsDevResponse;

	for (const [providerKey, providerValue] of Object.entries(payload)) {
		if (!providerValue || typeof providerValue !== "object") {
			continue;
		}

		const providerId = providerValue.id || providerKey;
		const models = providerValue.models;
		if (!models || typeof models !== "object") {
			continue;
		}

		for (const [modelKey, modelValue] of Object.entries(models)) {
			if (!modelValue || typeof modelValue !== "object") {
				continue;
			}

			const modelId = modelKey || modelValue.id;
			if (!modelId) {
				continue;
			}

			const metadata: ModelMetadata = {
				id: modelValue.id || modelId,
				name: modelValue.name,
				limit: modelValue.limit,
			};

			const key = buildModelMetadataKey(providerId, modelId);
			metadataMap.set(key, metadata);
		}
	}

	return metadataMap;
}

/**
 * Fetches model metadata from models.dev
 * Returns a Map keyed by "providerId/modelId" (lowercase)
 */
export async function fetchModelsMetadata(): Promise<ModelsMetadataMap> {
	// Return cached data if available
	if (cachedMetadata) {
		return cachedMetadata;
	}

	// Return in-flight promise if already fetching
	if (fetchPromise) {
		return fetchPromise;
	}

	fetchPromise = (async () => {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 10000);

			const response = await fetch(MODELS_DEV_API_URL, {
				signal: controller.signal,
				headers: {
					Accept: "application/json",
				},
			});

			clearTimeout(timeout);

			if (!response.ok) {
				throw new Error(`Failed to fetch: ${response.status}`);
			}

			const data = await response.json();
			cachedMetadata = transformModelsDevResponse(data);
			return cachedMetadata;
		} catch (error) {
			console.warn("[ModelsMetadata] Failed to fetch from models.dev:", error);
			return new Map();
		} finally {
			fetchPromise = null;
		}
	})();

	return fetchPromise;
}

/**
 * Gets the context window size for a model
 */
export function getContextLength(
	metadata: ModelsMetadataMap,
	providerId: string,
	modelId: string
): number | undefined {
	const key = buildModelMetadataKey(providerId, modelId);
	return metadata.get(key)?.limit?.context;
}

/**
 * Clears the cached metadata (useful for refreshing)
 */
export function clearMetadataCache(): void {
	cachedMetadata = null;
}
