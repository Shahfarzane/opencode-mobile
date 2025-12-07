import { create } from "zustand";
import type { StoreApi, UseBoundStore } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import type { Provider, Agent } from "@opencode-ai/sdk";
import { opencodeClient } from "@/lib/opencode/client";
import { scopeMatches, subscribeToConfigChanges } from "@/lib/configSync";
import type { ModelMetadata } from "@/types";
import { getSafeStorage } from "./utils/safeStorage";
import type { SessionStore } from "./types/sessionTypes";

const MODELS_DEV_API_URL = "https://models.dev/api.json";
const MODELS_DEV_PROXY_URL = "/api/openchamber/models-metadata";

const normalizeProviderId = (value: string) => value?.toLowerCase?.() ?? '';

const isPrimaryMode = (mode?: string) => mode === "primary" || mode === "all" || mode === undefined || mode === null;

type ProviderModel = Provider["models"][string];
type ProviderWithModelList = Omit<Provider, "models"> & { models: ProviderModel[] };

interface ModelsDevModelEntry {
    id?: string;
    name?: string;
    tool_call?: boolean;
    reasoning?: boolean;
    temperature?: boolean;
    attachment?: boolean;
    modalities?: {
        input?: string[];
        output?: string[];
    };
    cost?: {
        input?: number;
        output?: number;
        cache_read?: number;
        cache_write?: number;
    };
    limit?: {
        context?: number;
        output?: number;
    };
    knowledge?: string;
    release_date?: string;
    last_updated?: string;
}

interface ModelsDevProviderEntry {
    id?: string;
    models?: Record<string, ModelsDevModelEntry | undefined>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === "string");

const isModelsDevModelEntry = (value: unknown): value is ModelsDevModelEntry => {
    if (!isRecord(value)) {
        return false;
    }
    const candidate = value as ModelsDevModelEntry;
    if (candidate.modalities) {
        const { input, output } = candidate.modalities;
        if (input && !isStringArray(input)) {
            return false;
        }
        if (output && !isStringArray(output)) {
            return false;
        }
    }
    return true;
};

const isModelsDevProviderEntry = (value: unknown): value is ModelsDevProviderEntry => {
    if (!isRecord(value)) {
        return false;
    }
    const candidate = value as ModelsDevProviderEntry;
    return candidate.models === undefined || isRecord(candidate.models);
};

const buildModelMetadataKey = (providerId: string, modelId: string) => {
    const normalizedProvider = normalizeProviderId(providerId);
    if (!normalizedProvider || !modelId) {
        return '';
    }
    return `${normalizedProvider}/${modelId}`;
};

const transformModelsDevResponse = (payload: unknown): Map<string, ModelMetadata> => {
    const metadataMap = new Map<string, ModelMetadata>();

    if (!isRecord(payload)) {
        return metadataMap;
    }

    for (const [providerKey, providerValue] of Object.entries(payload)) {
        if (!isModelsDevProviderEntry(providerValue)) {
            continue;
        }

        const providerId = typeof providerValue.id === 'string' && providerValue.id.length > 0 ? providerValue.id : providerKey;
        const models = providerValue.models;
        if (!models || !isRecord(models)) {
            continue;
        }

        for (const [modelKey, modelValue] of Object.entries(models)) {
            if (!isModelsDevModelEntry(modelValue)) {
                continue;
            }

            const resolvedModelId =
                typeof modelKey === 'string' && modelKey.length > 0
                    ? modelKey
                    : modelValue.id;

            if (!resolvedModelId || typeof resolvedModelId !== 'string' || resolvedModelId.length === 0) {
                continue;
            }

            const metadata: ModelMetadata = {
                id: typeof modelValue.id === 'string' && modelValue.id.length > 0 ? modelValue.id : resolvedModelId,
                providerId,
                name: typeof modelValue.name === 'string' ? modelValue.name : undefined,
                tool_call: typeof modelValue.tool_call === 'boolean' ? modelValue.tool_call : undefined,
                reasoning: typeof modelValue.reasoning === 'boolean' ? modelValue.reasoning : undefined,
                temperature: typeof modelValue.temperature === 'boolean' ? modelValue.temperature : undefined,
                attachment: typeof modelValue.attachment === 'boolean' ? modelValue.attachment : undefined,
                modalities: modelValue.modalities
                    ? {
                          input: isStringArray(modelValue.modalities.input) ? modelValue.modalities.input : undefined,
                          output: isStringArray(modelValue.modalities.output) ? modelValue.modalities.output : undefined,
                      }
                    : undefined,
                cost: modelValue.cost,
                limit: modelValue.limit,
                knowledge: typeof modelValue.knowledge === 'string' ? modelValue.knowledge : undefined,
                release_date: typeof modelValue.release_date === 'string' ? modelValue.release_date : undefined,
                last_updated: typeof modelValue.last_updated === 'string' ? modelValue.last_updated : undefined,
            };

            const key = buildModelMetadataKey(providerId, resolvedModelId);
            if (key) {
                metadataMap.set(key, metadata);
            }
        }
    }

    return metadataMap;
};

const fetchModelsDevMetadata = async (): Promise<Map<string, ModelMetadata>> => {
    if (typeof fetch !== 'function') {
        return new Map();
    }

    const sources = [MODELS_DEV_PROXY_URL, MODELS_DEV_API_URL];

    for (const source of sources) {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
        const timeout = controller ? setTimeout(() => controller.abort(), 8000) : undefined;

        try {
            const isAbsoluteUrl = /^https?:\/\//i.test(source);
            const requestInit: RequestInit = {
                signal: controller?.signal,
                headers: {
                    Accept: 'application/json',
                },
                cache: 'no-store',
            };

            if (isAbsoluteUrl) {
                requestInit.mode = 'cors';
            } else {
                requestInit.credentials = 'same-origin';
            }

            const response = await fetch(source, requestInit);

            if (!response.ok) {
                throw new Error(`Metadata request to ${source} returned status ${response.status}`);
            }

            const data = await response.json();
            return transformModelsDevResponse(data);
        } catch (error: unknown) {
            if ((error as Error)?.name === 'AbortError') {
                console.warn(`Model metadata request aborted (${source})`);
            } else {
                console.warn(`Failed to fetch model metadata from ${source}:`, error);
            }
        } finally {
            if (timeout) {
                clearTimeout(timeout);
            }
        }
    }

    return new Map();
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ConfigStore {

    providers: ProviderWithModelList[];
    agents: Agent[];
    currentProviderId: string;
    currentModelId: string;
    currentAgentName: string | undefined;
    agentModelSelections: { [agentName: string]: { providerId: string; modelId: string } };
    defaultProviders: { [key: string]: string };
    isConnected: boolean;
    isInitialized: boolean;
    modelsMetadata: Map<string, ModelMetadata>;

    loadProviders: () => Promise<void>;
    loadAgents: () => Promise<boolean>;
    setProvider: (providerId: string) => void;
    setModel: (modelId: string) => void;
    setAgent: (agentName: string | undefined) => void;
    saveAgentModelSelection: (agentName: string, providerId: string, modelId: string) => void;
    getAgentModelSelection: (agentName: string) => { providerId: string; modelId: string } | null;
    checkConnection: () => Promise<boolean>;
    initializeApp: () => Promise<void>;
    getCurrentProvider: () => ProviderWithModelList | undefined;
    getCurrentModel: () => ProviderModel | undefined;
    getCurrentAgent: () => Agent | undefined;
    getModelMetadata: (providerId: string, modelId: string) => ModelMetadata | undefined;
}

declare global {
    interface Window {
        __zustand_config_store__?: UseBoundStore<StoreApi<ConfigStore>>;
        __zustand_session_store__?: UseBoundStore<StoreApi<SessionStore>>;
    }
}

export const useConfigStore = create<ConfigStore>()(
    devtools(
        persist(
            (set, get) => ({

                providers: [],
                agents: [],
                currentProviderId: "",
                currentModelId: "",
                currentAgentName: undefined,
                agentModelSelections: {},
                defaultProviders: {},
                isConnected: false,
                isInitialized: false,
                modelsMetadata: new Map<string, ModelMetadata>(),

                loadProviders: async () => {
                    try {
                        const metadataPromise = fetchModelsDevMetadata();
                        const apiResult = await opencodeClient.getProviders();
                        const providers = Array.isArray(apiResult?.providers) ? apiResult.providers : [];
                        const defaults = apiResult?.default || {};

                        const processedProviders: ProviderWithModelList[] = providers.map((provider) => {
                            const modelRecord = provider.models ?? {};
                            const models: ProviderModel[] = Object.keys(modelRecord).map((modelId) => modelRecord[modelId]);
                            return {
                                ...provider,
                                models,
                            };
                        });

                        const defaultProviderId = defaults.provider || processedProviders[0]?.id || "";
                        const provider = processedProviders.find((p) => p.id === defaultProviderId);
                        const defaultModelId = defaults.model || provider?.models?.[0]?.id || "";

                        set({
                            providers: processedProviders,
                            defaultProviders: defaults,

                            currentProviderId: defaultProviderId,
                            currentModelId: defaultModelId,
                        });

                        const metadata = await metadataPromise;
                        if (metadata.size > 0) {
                            set({ modelsMetadata: metadata });
                        }
                    } catch (error) {
                            console.error("Failed to load providers:", error);
                            set({ providers: [], defaultProviders: {}, currentProviderId: "", currentModelId: "" });
                        }
                    },

                setProvider: (providerId: string) => {
                    const { providers } = get();
                    const provider = providers.find((p) => p.id === providerId);

                    if (provider) {

                        const firstModel = provider.models[0];
                        const newModelId = firstModel?.id || "";

                        set({
                            currentProviderId: providerId,
                            currentModelId: newModelId,
                        });
                    }
                },

                setModel: (modelId: string) => {
                    set({ currentModelId: modelId });
                },

                saveAgentModelSelection: (agentName: string, providerId: string, modelId: string) => {
                    set((state) => ({
                        agentModelSelections: {
                            ...state.agentModelSelections,
                            [agentName]: { providerId, modelId },
                        },
                    }));
                },

                getAgentModelSelection: (agentName: string) => {
                    const { agentModelSelections } = get();
                    return agentModelSelections[agentName] || null;
                },

                loadAgents: async () => {
                    const previousAgents = get().agents;
                    let lastError: unknown = null;

                    for (let attempt = 0; attempt < 3; attempt++) {
                        try {
                            const agents = await opencodeClient.listAgents();
                            const safeAgents = Array.isArray(agents) ? agents : [];
                            set({ agents: safeAgents });

                            const { providers } = get();

                            if (safeAgents.length === 0) {
                                set({ currentAgentName: undefined });
                                return true;
                            }

                            const primaryAgents = safeAgents.filter((agent) => isPrimaryMode(agent.mode));
                            const buildAgent = primaryAgents.find((agent) => agent.name === "build");
                            const defaultAgent = buildAgent || primaryAgents[0] || safeAgents[0];

                            set({ currentAgentName: defaultAgent.name });

                            if (defaultAgent?.model?.providerID && defaultAgent?.model?.modelID) {
                                const agentProvider = providers.find((p) => p.id === defaultAgent.model!.providerID);
                                if (agentProvider) {
                                    const agentModel = agentProvider.models.find((model) => model.id === defaultAgent.model!.modelID);

                                    if (agentModel) {
                                        set({
                                            currentProviderId: defaultAgent.model!.providerID,
                                            currentModelId: defaultAgent.model!.modelID,
                                        });
                                    }
                                }
                            }

                            return true;
                        } catch (error) {
                            lastError = error;
                            const waitMs = 200 * (attempt + 1);
                            await new Promise((resolve) => setTimeout(resolve, waitMs));
                        }
                    }

                    console.error("Failed to load agents:", lastError);
                    set({ agents: previousAgents });
                    return false;
                },

                setAgent: (agentName: string | undefined) => {
                    const { agents, providers } = get();

                    set({ currentAgentName: agentName });

                    if (agentName && typeof window !== "undefined") {

                        const sessionStore = window.__zustand_session_store__;
                        if (sessionStore) {
                            const sessionState = sessionStore.getState();
                            const { currentSessionId, isOpenChamberCreatedSession, initializeNewOpenChamberSession, getAgentModelForSession } = sessionState;

                            if (currentSessionId) {

                                sessionStore.setState((state) => {
                                    const newAgentContext = new Map(state.currentAgentContext);
                                    newAgentContext.set(currentSessionId, agentName);
                                    return { currentAgentContext: newAgentContext };
                                });
                            }

                            if (currentSessionId && isOpenChamberCreatedSession(currentSessionId)) {
                                const existingAgentModel = getAgentModelForSession(currentSessionId, agentName);
                                if (!existingAgentModel) {

                                    initializeNewOpenChamberSession(currentSessionId, agents);
                                }
                            }
                        }
                    }

                    if (agentName && typeof window !== "undefined") {
                        const sessionStore = window.__zustand_session_store__;
                        if (sessionStore) {
                            const { currentSessionId, getAgentModelForSession } = sessionStore.getState();

                            if (currentSessionId) {
                                const existingAgentModel = getAgentModelForSession(currentSessionId, agentName);

                                if (existingAgentModel) {

                                    return;
                                }
                            }
                        }

                        const agent = agents.find((candidate) => candidate.name === agentName);
                        if (agent?.model?.providerID && agent?.model?.modelID) {
                            const agentProvider = providers.find((provider) => provider.id === agent.model!.providerID);
                            if (agentProvider) {
                                const agentModel = agentProvider.models.find((model) => model.id === agent.model!.modelID);

                                if (agentModel) {
                                    set({
                                        currentProviderId: agent.model!.providerID,
                                        currentModelId: agent.model!.modelID,
                                    });
                                }
                            }
                        }
                    }
                },

                checkConnection: async () => {
                    const maxAttempts = 5;
                    let attempt = 0;
                    let lastError: unknown = null;

                    while (attempt < maxAttempts) {
                        try {
                            const isHealthy = await opencodeClient.checkHealth();
                            set({ isConnected: isHealthy });
                            return isHealthy;
                        } catch (error) {
                            lastError = error;
                            attempt += 1;
                            const delay = 400 * attempt;
                            await sleep(delay);
                        }
                    }

                    if (lastError) {
                        console.warn("[ConfigStore] Failed to reach OpenCode after retrying:", lastError);
                    }
                    set({ isConnected: false });
                    return false;
                },

                initializeApp: async () => {
                    try {
                        console.log("Starting app initialization...");

                        const isConnected = await get().checkConnection();
                        console.log("Connection check result:", isConnected);

                        if (!isConnected) {
                            console.log("Server not connected");
                            set({ isConnected: false });
                            return;
                        }

                        console.log("Initializing app...");
                        await opencodeClient.initApp();

                        console.log("Loading providers...");
                        await get().loadProviders();

                        console.log("Loading agents...");
                        await get().loadAgents();

                        set({ isInitialized: true, isConnected: true });
                        console.log("App initialized successfully");
                    } catch (error) {
                        console.error("Failed to initialize app:", error);
                        set({ isInitialized: false, isConnected: false });
                    }
                },

                getCurrentProvider: () => {
                    const { providers, currentProviderId } = get();
                    return providers.find((p) => p.id === currentProviderId);
                },

                getCurrentModel: () => {
                    const provider = get().getCurrentProvider();
                    const { currentModelId } = get();
                    if (!provider) {
                        return undefined;
                    }
                    return provider.models.find((model) => model.id === currentModelId);
                },

                getCurrentAgent: () => {
                    const { agents, currentAgentName } = get();
                    if (!currentAgentName) return undefined;
                    return agents.find((a) => a.name === currentAgentName);
                },
                getModelMetadata: (providerId: string, modelId: string) => {
                    const key = buildModelMetadataKey(providerId, modelId);
                    if (!key) {
                        return undefined;
                    }
                    const { modelsMetadata } = get();
                    return modelsMetadata.get(key);
                },
            }),
            {
                name: "config-store",
                storage: createJSONStorage(() => getSafeStorage()),
                partialize: () => ({

                }),
            },
        ),
        {
            name: "config-store",
        },
    ),
);

if (typeof window !== "undefined") {
    window.__zustand_config_store__ = useConfigStore;
}

let unsubscribeConfigStoreChanges: (() => void) | null = null;

if (!unsubscribeConfigStoreChanges) {
    unsubscribeConfigStoreChanges = subscribeToConfigChanges(async (event) => {
        const tasks: Promise<void>[] = [];

        if (scopeMatches(event, "agents")) {
            const { loadAgents } = useConfigStore.getState();
            tasks.push(loadAgents().then(() => {}));
        }

        if (scopeMatches(event, "providers")) {
            const { loadProviders } = useConfigStore.getState();
            tasks.push(loadProviders());
        }

        if (tasks.length > 0) {
            await Promise.all(tasks);
        }
    });
}
