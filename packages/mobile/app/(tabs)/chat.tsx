import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	type Agent,
	agentsApi,
	type Command,
	commandsApi,
	filesApi,
	type Provider,
	providersApi,
	type SettingsPayload,
	sessionsApi,
	settingsApi,
} from "../../src/api";
import type {
	AgentInfo,
	Message,
	MessagePart,
	ModelInfo,
	Permission,
	PermissionResponse,
	TokenBreakdown,
} from "../../src/components/chat";
import {
	AgentPicker,
	type AttachedFile,
	ChatInput,
	convertStreamingPart,
	MessageList,
	ModelPicker,
	PermissionCard,
} from "../../src/components/chat";
import { WorkingPlaceholder } from "../../src/components/chat/WorkingPlaceholder";
import {
	useContextUsageContext,
	useSessionSheetContext,
} from "../../src/contexts/tabs-context";
import {
	type MessagePart as StatusMessagePart,
	useAssistantStatus,
} from "../../src/hooks/useAssistantStatus";
import {
	type StreamEvent,
	useEventStream,
} from "../../src/hooks/useEventStream";
import {
	fetchModelsMetadata,
	getContextLength,
	type ModelMetadata,
} from "../../src/lib/modelsMetadata";
import type { MessagePart as StreamingPart } from "../../src/lib/streaming";
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { useTheme } from "../../src/theme";

const DEFAULT_CONTEXT_LIMIT = 200000;
const DEFAULT_OUTPUT_LIMIT = 8192;

function sumTokenBreakdown(breakdown: TokenBreakdown): number {
	const input = breakdown.input ?? 0;
	const output = breakdown.output ?? 0;
	const reasoning = breakdown.reasoning ?? 0;
	const cacheRead = breakdown.cache?.read ?? 0;
	const cacheWrite = breakdown.cache?.write ?? 0;
	return input + output + reasoning + cacheRead + cacheWrite;
}

function extractTokensFromMessage(message: Message): number {
	// First check if tokens are directly on the message (from msg.info.tokens)
	if (typeof message.tokens === "number") {
		return message.tokens;
	}
	if (message.tokens && typeof message.tokens === "object") {
		return sumTokenBreakdown(message.tokens);
	}

	// Fallback: check parts for tokens
	if (!message.parts || message.parts.length === 0) return 0;

	for (const part of message.parts) {
		const tokens = (part as { tokens?: number | TokenBreakdown }).tokens;
		if (typeof tokens === "number") return tokens;
		if (tokens && typeof tokens === "object") {
			return sumTokenBreakdown(tokens);
		}
	}

	return 0;
}

export default function ChatScreen() {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	const { directory, isConnected } = useConnectionStore();
	const { setContextUsage } = useContextUsageContext();
	const {
		sessions,
		currentSessionId,
		selectSession: contextSelectSession,
		_updateStreamingSessions,
		_setCurrentSessionId,
		_refreshSessions,
	} = useSessionSheetContext();

	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [permissions, setPermissions] = useState<Permission[]>([]);

	const [providers, setProviders] = useState<Provider[]>([]);
	const [modelsMetadata, setModelsMetadata] = useState<
		Map<string, ModelMetadata>
	>(new Map());
	const [currentProviderId, setCurrentProviderId] = useState<
		string | undefined
	>();
	const [currentModelId, setCurrentModelId] = useState<string | undefined>();

	const [agents, setAgents] = useState<Agent[]>([]);
	const [commands, setCommands] = useState<Command[]>([]);
	const [currentAgentName, setCurrentAgentName] = useState<
		string | undefined
	>();
	const [showAgentPicker, setShowAgentPicker] = useState(false);
	const [showModelPicker, setShowModelPicker] = useState(false);
	const [openChamberSettings, setOpenChamberSettings] =
		useState<SettingsPayload | null>(null);

	// Favorite models state
	const [favoriteModels, setFavoriteModels] = useState<Set<string>>(new Set());

	// Load favorite models from storage on mount
	useEffect(() => {
		const loadFavorites = async () => {
			try {
				const stored = await AsyncStorage.getItem("favoriteModels");
				if (stored) {
					const parsed = JSON.parse(stored);
					if (Array.isArray(parsed)) {
						setFavoriteModels(new Set(parsed));
					}
				}
			} catch (err) {
				console.error("Failed to load favorite models:", err);
			}
		};
		loadFavorites();
	}, []);

	// Handler to toggle a model as favorite
	const handleToggleFavorite = useCallback(
		async (providerId: string, modelId: string) => {
			const key = `${providerId}/${modelId}`;
			setFavoriteModels((prev) => {
				const newSet = new Set(prev);
				if (newSet.has(key)) {
					newSet.delete(key);
				} else {
					newSet.add(key);
				}
				// Persist to storage
				AsyncStorage.setItem(
					"favoriteModels",
					JSON.stringify(Array.from(newSet)),
				).catch((err) => console.error("Failed to save favorite models:", err));
				return newSet;
			});
		},
		[],
	);

	const activeAgent: AgentInfo | undefined = useMemo(() => {
		if (!currentAgentName) return undefined;
		const agent = agents.find((a) => a.name === currentAgentName);
		if (!agent) return undefined;
		return { name: agent.name };
	}, [agents, currentAgentName]);

	// Derive modelInfo from current selection
	const modelInfo: ModelInfo | undefined = useMemo(() => {
		if (!currentProviderId || !currentModelId) {
			return undefined;
		}

		const provider = providers.find((p) => p.id === currentProviderId);
		const model = provider?.models?.find((m) => m.id === currentModelId);

		if (!provider || !model) {
			return undefined;
		}

		const displayName = model.name || model.id;
		return {
			modelId: model.id,
			modelName:
				displayName.length > 40
					? `${displayName.substring(0, 37)}...`
					: displayName,
			providerId: provider.id,
			providerName: provider.name,
		};
	}, [providers, currentProviderId, currentModelId]);

	const partsMapRef = useRef<Map<string, MessagePart>>(new Map());
	const currentAssistantMessageIdRef = useRef<string | null>(null);
	const lastEventTimeRef = useRef<number>(0);
	const lastUserMessageContentRef = useRef<string>("");

	// Get the current streaming message's parts for status display
	const streamingMessageParts = useMemo(() => {
		const streamingMsg = messages.find((m) => m.isStreaming);
		if (!streamingMsg?.parts) return [];
		// Convert MessagePart[] to StatusMessagePart[]
		return streamingMsg.parts.map((p) => ({
			type: p.type,
			state: p.state,
			toolName: p.toolName,
			text: p.text || p.content,
		})) as StatusMessagePart[];
	}, [messages]);

	// Get assistant status for streaming indicator
	const assistantStatus = useAssistantStatus(streamingMessageParts, isLoading);

	const handleStreamEvent = useCallback(
		(event: StreamEvent) => {
			const props = event.properties;
			if (!props) return;

			const eventSessionId = props.sessionID || props.info?.sessionID;
			if (eventSessionId && sessionId && eventSessionId !== sessionId) {
				return;
			}

			lastEventTimeRef.current = Date.now();

			if (event.type === "session.error" || event.type === "message.error") {
				console.error("[Chat] Stream error:", props);
				setIsLoading(false);
				currentAssistantMessageIdRef.current = null;
				return;
			}

			if (event.type === "permission.updated") {
				const permission: Permission = {
					id: props.id || `perm-${Date.now()}`,
					type: props.type || "unknown",
					pattern: props.pattern,
					sessionID: eventSessionId || sessionId || "",
					messageID: props.messageID || "",
					callID: props.callID,
					title: props.title || "",
					metadata: props.metadata || {},
					time: { created: props.time?.created || Date.now() },
				};
				setPermissions((prev) => [...prev, permission]);
				return;
			}

			// Handle session.updated events to refresh session title
			if (event.type === "session.updated") {
				const sessionInfo = (props.info || props) as {
					id?: string;
					title?: string;
				};
				const updatedSessionId = sessionInfo?.id || props.sessionID;
				// Refresh sessions list to get updated title
				if (_refreshSessions && updatedSessionId === sessionId) {
					_refreshSessions();
				}
				return;
			}

			if (event.type === "message.part.updated" && props.part) {
				// Extract server's message ID from event
				const serverMessageId = props.info?.id || props.messageID;

				// Only process parts for assistant messages - ignore user message events
				// Check both explicit role AND if role is not explicitly "assistant" when it should be
				if (props.info?.role === "user") {
					return;
				}

				// Ensure we have an active assistant message being tracked
				if (!currentAssistantMessageIdRef.current) {
					return;
				}

				// Skip events for non-assistant messages based on server message ID pattern
				// Also skip if we can detect this is a user message by other means
				if (serverMessageId && typeof serverMessageId === "string") {
					const looksLikeServerMessageId =
						serverMessageId.startsWith("msg_") ||
						(serverMessageId.length > 20 &&
							/^[0-9A-Z]+$/i.test(serverMessageId.slice(0, 10)));
					// Skip if role is explicitly not assistant, or if it looks like a server message and role is undefined
					if (props.info?.role !== "assistant" && looksLikeServerMessageId) {
						return;
					}
				}

				const streamPart = props.part as StreamingPart;
				const partId = streamPart.id || `part-${Date.now()}-${Math.random()}`;
				const converted = convertStreamingPart(streamPart);
				converted.id = partId;

				// Skip text parts that echo the user's message (server sometimes includes user input in response)
				if (converted.type === "text") {
					const partText = (converted.content || converted.text || "").trim();
					if (partText && partText === lastUserMessageContentRef.current) {
						return;
					}
				}

				partsMapRef.current.set(partId, converted);

				const partsArray = Array.from(partsMapRef.current.values());
				let textContent = "";
				for (const p of partsArray) {
					if (p.type === "text") {
						textContent = `${textContent}${p.content || p.text || ""}`;
					}
				}

				const assistantId = currentAssistantMessageIdRef.current;
				if (assistantId) {
					setMessages((prev) =>
						prev.map((msg) =>
							msg.id === assistantId
								? { ...msg, parts: partsArray, content: textContent }
								: msg,
						),
					);
				}
			}

			if (event.type === "message.updated") {
				const info = props.info;
				const serverParts = props.parts;
				const serverMessageId = info?.id || props.messageID;

				// Only process assistant messages - ignore user message events
				if (info?.role === "user") {
					return;
				}

				// Ensure we have an active assistant message being tracked
				if (!currentAssistantMessageIdRef.current) {
					return;
				}

				// Skip events for non-assistant messages based on server message ID pattern
				// Also skip if we can detect this is a user message by other means
				if (serverMessageId && typeof serverMessageId === "string") {
					const looksLikeServerMessageId =
						serverMessageId.startsWith("msg_") ||
						(serverMessageId.length > 20 &&
							/^[0-9A-Z]+$/i.test(serverMessageId.slice(0, 10)));
					// Skip if role is explicitly not assistant, or if it looks like a server message and role is undefined
					if (info?.role !== "assistant" && looksLikeServerMessageId) {
						return;
					}
				}

				if (serverParts && Array.isArray(serverParts)) {
					for (const sp of serverParts) {
						const streamPart = sp as StreamingPart;
						const partId =
							streamPart.id || `part-${Date.now()}-${Math.random()}`;
						const converted = convertStreamingPart(streamPart);
						converted.id = partId;

						// Skip text parts that echo the user's message (server sometimes includes user input in response)
						if (converted.type === "text") {
							const partText = (
								converted.content ||
								converted.text ||
								""
							).trim();
							if (partText && partText === lastUserMessageContentRef.current) {
								continue;
							}
						}

						partsMapRef.current.set(partId, converted);
					}
				}

				const partsArray = Array.from(partsMapRef.current.values());
				let textContent = "";
				for (const p of partsArray) {
					if (p.type === "text") {
						textContent = `${textContent}${p.content || p.text || ""}`;
					}
				}

				const isComplete =
					info?.finish === "stop" ||
					info?.finish === "cancelled" ||
					info?.finish === "error" ||
					(info?.time?.completed && typeof info.time.completed === "number");

				// Extract tokens from info if available
				const messageTokens = (info as { tokens?: number | TokenBreakdown })
					?.tokens;

				const assistantId = currentAssistantMessageIdRef.current;
				if (assistantId) {
					setMessages((prev) =>
						prev.map((msg) =>
							msg.id === assistantId
								? {
										...msg,
										parts: partsArray,
										content: textContent,
										isStreaming: !isComplete,
										...(messageTokens !== undefined && {
											tokens: messageTokens,
										}),
									}
								: msg,
						),
					);

					if (isComplete) {
						setIsLoading(false);
						currentAssistantMessageIdRef.current = null;
						partsMapRef.current.clear();
						// Refresh sessions to get updated title after message completion
						if (_refreshSessions) {
							// Debounce the refresh slightly to avoid rapid calls
							setTimeout(() => _refreshSessions(), 500);
						}
					}
				}
			}
		},
		[sessionId, _refreshSessions],
	);

	useEventStream(sessionId, handleStreamEvent);

	// Sync streaming state with layout context
	// biome-ignore lint/correctness/useExhaustiveDependencies: _updateStreamingSessions is intentionally excluded - it's recreated each render but we only want to run when isLoading/sessionId change
	useEffect(() => {
		if (_updateStreamingSessions) {
			_updateStreamingSessions(
				isLoading && sessionId ? new Set([sessionId]) : new Set(),
			);
		}
	}, [isLoading, sessionId]);

	// Sync with context's currentSessionId - defined after loadSessionMessages
	const prevContextSessionIdRef = useRef<string | null>(null);

	// Refs for stable access to providers/agents in loadSessionMessages
	// This prevents infinite loops when provider/agent arrays get new references
	const providersRef = useRef<Provider[]>(providers);
	const agentsRef = useRef<Agent[]>(agents);
	const isLoadingSessionRef = useRef(false);

	useEffect(() => {
		providersRef.current = providers;
	}, [providers]);

	useEffect(() => {
		agentsRef.current = agents;
	}, [agents]);

	// Fetch OpenChamber settings (includes defaultAgent and defaultModel)
	useEffect(() => {
		if (!isConnected) return;

		const fetchSettings = async () => {
			try {
				const result = await settingsApi.load();
				setOpenChamberSettings(result.settings);
			} catch (err) {
				console.error("[Chat] Failed to fetch settings:", err);
			}
		};

		fetchSettings();
	}, [isConnected]);

	// Fetch connected providers (only authenticated ones with models)
	useEffect(() => {
		if (!isConnected) return;

		const fetchProviders = async () => {
			try {
				// Use listConnected to get only authenticated providers
				const data = await providersApi.listConnected();
				// Mark connected providers as enabled for ModelPicker
				const enabledProviders = data.map((p) => ({ ...p, enabled: true }));
				setProviders(enabledProviders);
			} catch (err) {
				console.error("Failed to fetch providers:", err);
			}
		};

		fetchProviders();
	}, [isConnected]);

	// Fetch model metadata from models.dev for context window info
	useEffect(() => {
		const loadMetadata = async () => {
			try {
				const metadata = await fetchModelsMetadata();
				setModelsMetadata(metadata);
			} catch (err) {
				console.error("Failed to fetch model metadata:", err);
			}
		};
		loadMetadata();
	}, []);

	// Enrich providers with context length from models.dev metadata
	const enrichedProviders = useMemo(() => {
		if (modelsMetadata.size === 0) return providers;

		return providers.map((provider) => ({
			...provider,
			models: provider.models?.map((model) => {
				const contextLength = getContextLength(
					modelsMetadata,
					provider.id,
					model.id,
				);
				return contextLength ? { ...model, contextLength } : model;
			}),
		}));
	}, [providers, modelsMetadata]);

	// Fetch commands (for autocomplete)
	useEffect(() => {
		if (!isConnected) return;

		const fetchCommands = async () => {
			try {
				const data = await commandsApi.list();
				// Filter out hidden commands
				setCommands(data.filter((cmd) => !cmd.hidden));
			} catch (err) {
				console.error("Failed to fetch commands:", err);
			}
		};

		fetchCommands();
	}, [isConnected]);

	// Fetch agents (depends on settings for default agent selection)
	useEffect(() => {
		if (!isConnected) return;

		const fetchAgents = async () => {
			try {
				const data = await agentsApi.list();
				setAgents(data);

				// Set default agent if not already set
				// Priority (like desktop): settings.defaultAgent → build → first primary → first agent
				if (!currentAgentName && data.length > 0) {
					const primaryAgents = data.filter(
						(a) => a.mode === "primary" || a.mode === "all",
					);
					const buildAgent = primaryAgents.find((a) => a.name === "build");
					const fallbackAgent = buildAgent || primaryAgents[0] || data[0];

					let resolvedAgent: Agent | undefined;

					// 1. Check settings for default agent (like desktop)
					if (openChamberSettings?.defaultAgent) {
						const settingsAgent = data.find(
							(a) => a.name === openChamberSettings.defaultAgent,
						);
						if (settingsAgent) {
							resolvedAgent = settingsAgent;
						}
					}

					// 2. Fall back to default logic
					if (!resolvedAgent) {
						resolvedAgent = fallbackAgent;
					}

					if (resolvedAgent) {
						setCurrentAgentName(resolvedAgent.name);
					}
				}
			} catch (err) {
				console.error("Failed to fetch agents:", err);
			}
		};

		fetchAgents();
	}, [isConnected, currentAgentName, openChamberSettings]);

	// Update model based on settings and agent's preferred model (like desktop does)
	// Priority: settings.defaultModel → agent's preferred model → fallback
	const hasAppliedDefaultModelRef = useRef(false);
	useEffect(() => {
		// Only apply default model once (for initial default)
		if (hasAppliedDefaultModelRef.current) return;
		if (providers.length === 0) return;
		if (openChamberSettings === null) return;
		if (agents.length === 0) return;
		if (!currentAgentName) return;

		// Helper to validate model exists in providers
		const validateModel = (providerId: string, modelId: string): boolean => {
			const provider = providers.find((p) => p.id === providerId);
			if (!provider) return false;
			return provider.models?.some((m) => m.id === modelId) ?? false;
		};

		// Helper to parse "provider/model" format
		const parseModelString = (
			modelString: string,
		): { providerId: string; modelId: string } | null => {
			if (!modelString || typeof modelString !== "string") return null;
			const parts = modelString.split("/");
			if (parts.length >= 2) {
				const providerId = parts[0];
				const modelId = parts.slice(1).join("/");
				return { providerId, modelId };
			}
			return null;
		};

		let resolvedProviderId: string | undefined;
		let resolvedModelId: string | undefined;

		// 1. Check settings for default model
		if (openChamberSettings?.defaultModel) {
			const parsed = parseModelString(openChamberSettings.defaultModel);
			if (parsed && validateModel(parsed.providerId, parsed.modelId)) {
				resolvedProviderId = parsed.providerId;
				resolvedModelId = parsed.modelId;
			}
		}

		// 2. Fall back to agent's preferred model
		if (!resolvedProviderId && currentAgentName) {
			const agent = agents.find((a) => a.name === currentAgentName);
			if (agent?.model?.providerID && agent?.model?.modelID) {
				if (validateModel(agent.model.providerID, agent.model.modelID)) {
					resolvedProviderId = agent.model.providerID;
					resolvedModelId = agent.model.modelID;
				}
			}
		}

		// 3. Fall back to opencode/big-pickle
		if (!resolvedProviderId) {
			if (validateModel("opencode", "big-pickle")) {
				resolvedProviderId = "opencode";
				resolvedModelId = "big-pickle";
			}
		}

		// 4. Last resort: find Anthropic provider and use first model
		if (!resolvedProviderId) {
			const anthropicProvider = providers.find((p) => p.id === "anthropic");
			const firstModel = anthropicProvider?.models?.[0];
			if (anthropicProvider && firstModel) {
				resolvedProviderId = anthropicProvider.id;
				resolvedModelId = firstModel.id;
			}
		}

		// Apply the resolved model
		if (resolvedProviderId && resolvedModelId) {
			hasAppliedDefaultModelRef.current = true;
			setCurrentProviderId(resolvedProviderId);
			setCurrentModelId(resolvedModelId);
		}
	}, [currentAgentName, agents, providers, openChamberSettings]);

	useEffect(() => {
		const assistantMessages = messages.filter((m) => m.role === "assistant");
		if (assistantMessages.length === 0) {
			setContextUsage(null);
			return;
		}

		const lastMessage = assistantMessages[assistantMessages.length - 1];
		const tokens = extractTokensFromMessage(lastMessage);

		if (tokens > 0) {
			const contextLimit = DEFAULT_CONTEXT_LIMIT;
			const outputLimit = DEFAULT_OUTPUT_LIMIT;
			const thresholdLimit = contextLimit - Math.min(outputLimit, 32000);
			const percentage = (tokens / thresholdLimit) * 100;

			setContextUsage({
				totalTokens: tokens,
				percentage: Math.min(percentage, 100),
				contextLimit,
				outputLimit,
			});
		}
	}, [messages, setContextUsage]);

	useEffect(() => {
		if (!isLoading) return;

		const STUCK_TIMEOUT_MS = 60000;
		const checkInterval = setInterval(() => {
			const timeSinceLastEvent = Date.now() - lastEventTimeRef.current;
			if (
				lastEventTimeRef.current > 0 &&
				timeSinceLastEvent > STUCK_TIMEOUT_MS
			) {
				console.warn("[Chat] Stream appears stuck, resetting loading state");
				setIsLoading(false);
				currentAssistantMessageIdRef.current = null;

				setMessages((prev) =>
					prev.map((msg) =>
						msg.isStreaming
							? {
									...msg,
									isStreaming: false,
									content:
										msg.content || "[Response incomplete - connection lost]",
								}
							: msg,
					),
				);
			}
		}, 10000);

		return () => clearInterval(checkInterval);
	}, [isLoading]);

	const loadSessionMessages = useCallback(
		async (id: string) => {
			if (!isConnected) return;

			// Prevent multiple simultaneous loads
			if (isLoadingSessionRef.current) return;
			isLoadingSessionRef.current = true;

			try {
				const data = await sessionsApi.getMessages(id);
				const loadedMessages: Message[] = [];

				// Track the last assistant message's model/agent info for restoration
				let lastProviderID: string | undefined;
				let lastModelID: string | undefined;
				let lastAgentName: string | undefined;

				for (const msg of data) {
					if (msg.info) {
						const parts: MessagePart[] = [];
						let content = "";

						if (Array.isArray(msg.parts)) {
							for (const part of msg.parts) {
								const converted = convertStreamingPart(part as StreamingPart);
								parts.push(converted);

								if (part.type === "text") {
									content = `${content}${part.text || part.content || ""}`;
								}
							}
						}

						// Extract model/agent info from assistant messages
						let messageModelName: string | undefined;
						let messageAgentName: string | undefined;
						let messageProviderId: string | undefined;

						if (msg.info.role === "assistant") {
							if (msg.info.providerID) lastProviderID = msg.info.providerID;
							if (msg.info.modelID) lastModelID = msg.info.modelID;
							if (msg.info.mode) lastAgentName = msg.info.mode;

							// Set providerId for logo display
							messageProviderId = msg.info.providerID;

							// Derive model display name from provider/model IDs
							if (msg.info.providerID && msg.info.modelID) {
								const provider = providersRef.current.find(
									(p) => p.id === msg.info.providerID,
								);
								const model = provider?.models?.find(
									(m) => m.id === msg.info.modelID,
								);
								if (model) {
									const displayName = model.name || model.id;
									messageModelName =
										displayName.length > 40
											? `${displayName.substring(0, 37)}...`
											: displayName;
								}
							}

							// Set agent name from mode
							if (msg.info.mode) {
								messageAgentName = msg.info.mode;
							}
						}

						loadedMessages.push({
							id: msg.info.id || `msg-${Date.now()}`,
							role: msg.info.role === "user" ? "user" : "assistant",
							content,
							parts: parts.length > 0 ? parts : undefined,
							createdAt: msg.info.createdAt || Date.now(),
							modelName: messageModelName,
							providerId: messageProviderId,
							agentName: messageAgentName,
							tokens: msg.info.tokens,
						});
					}
				}

				setMessages(loadedMessages);

				// Restore model/agent selection from the session's last used values
				if (lastProviderID && lastModelID) {
					const provider = providersRef.current.find(
						(p) => p.id === lastProviderID,
					);
					const model = provider?.models?.find((m) => m.id === lastModelID);
					if (provider && model) {
						setCurrentProviderId(lastProviderID);
						setCurrentModelId(lastModelID);
					}
				}

				if (lastAgentName) {
					const agent = agentsRef.current.find((a) => a.name === lastAgentName);
					if (agent) {
						setCurrentAgentName(lastAgentName);
					}
				}
			} catch (error) {
				console.error("Failed to load session messages:", error);
			} finally {
				isLoadingSessionRef.current = false;
			}
		},
		[isConnected], // Removed providers, agents - using refs for stable access
	);

	// Sync with context's currentSessionId
	useEffect(() => {
		if (currentSessionId !== prevContextSessionIdRef.current) {
			prevContextSessionIdRef.current = currentSessionId;
			setSessionId(currentSessionId);
			if (currentSessionId) {
				// Don't reload if we're streaming - would overwrite the assistant placeholder
				if (!isLoading) {
					loadSessionMessages(currentSessionId);
				}
			} else {
				setMessages([]);
			}
		}
	}, [currentSessionId, loadSessionMessages, isLoading]);

	// Update context when local sessionId changes (e.g., after creating a new session)
	const prevLocalSessionIdRef = useRef<string | null>(null);
	useEffect(() => {
		if (_setCurrentSessionId && sessionId !== prevLocalSessionIdRef.current) {
			prevLocalSessionIdRef.current = sessionId;
			if (sessionId && sessionId !== currentSessionId) {
				_setCurrentSessionId(sessionId);
			}
		}
	}, [sessionId, currentSessionId, _setCurrentSessionId]);

	const createSession = useCallback(async (): Promise<string> => {
		const data = await sessionsApi.create();
		if (_refreshSessions) {
			_refreshSessions();
		}
		return data.id;
	}, [_refreshSessions]);

	const handleFileSearch = useCallback(
		async (query: string) => {
			if (!directory || !query.trim()) return [];

			try {
				const results = await filesApi.search(directory, query, 15);
				return results.map((r) => ({
					name: r.path.split("/").pop() || r.path,
					path: r.path,
					extension: r.path.split(".").pop(),
				}));
			} catch {
				return [];
			}
		},
		[directory],
	);

	const handleSend = useCallback(
		async (content: string, attachedFiles?: AttachedFile[]) => {
			if (!isConnected || isLoading) return;

			setIsLoading(true);

			// Build display content showing attachments
			let displayContent = content;
			if (attachedFiles && attachedFiles.length > 0) {
				const fileNames = attachedFiles.map((f) => f.name).join(", ");
				displayContent = `[Attached: ${fileNames}]\n${content}`;
			}

			const userMessage: Message = {
				id: `user-${Date.now()}`,
				role: "user",
				content: displayContent,
				createdAt: Date.now(),
			};

			setMessages((prev) => [...prev, userMessage]);

			try {
				let currentSessionId = sessionId;
				if (!currentSessionId) {
					currentSessionId = await createSession();
					setSessionId(currentSessionId);
				}

				const assistantMessageId = `assistant-${Date.now()}`;
				currentAssistantMessageIdRef.current = assistantMessageId;
				partsMapRef.current.clear();
				lastUserMessageContentRef.current = content.trim();

				const assistantMessage: Message = {
					id: assistantMessageId,
					role: "assistant",
					content: "",
					parts: [],
					isStreaming: true,
					createdAt: Date.now(),
					modelName: modelInfo?.modelName,
					providerId: currentProviderId,
					agentName: activeAgent?.name,
				};

				setMessages((prev) => [...prev, assistantMessage]);

				// Convert AttachedFile[] to MessageAttachment[]
				const attachments = attachedFiles?.map((file) => ({
					name: file.name,
					type: file.type,
					base64: file.base64,
					uri: file.uri,
				}));

				await sessionsApi.sendMessage(
					currentSessionId,
					content,
					currentProviderId,
					currentModelId,
					currentAgentName,
					attachments,
				);
			} catch (error) {
				console.error("Failed to send message:", error);
				const errorMessage: Message = {
					id: `error-${Date.now()}`,
					role: "assistant",
					content: `Error: ${error instanceof Error ? error.message : "Failed to send message"}`,
					createdAt: Date.now(),
				};
				setMessages((prev) => [...prev, errorMessage]);
				setIsLoading(false);
				currentAssistantMessageIdRef.current = null;
				partsMapRef.current.clear();
			}
		},
		[
			isConnected,
			sessionId,
			isLoading,
			createSession,
			currentProviderId,
			currentModelId,
			currentAgentName,
			activeAgent,
			modelInfo,
		],
	);

	const handleAgentChange = useCallback((agentName: string) => {
		setCurrentAgentName(agentName);
	}, []);

	const HEADER_HEIGHT = 52;
	const keyboardOffset = HEADER_HEIGHT + insets.top;

	const handlePermissionResponse = useCallback(
		async (permissionId: string, response: PermissionResponse) => {
			if (!sessionId) return;

			await sessionsApi.respondToPermission(sessionId, permissionId, response);
			setPermissions((prev) => prev.filter((p) => p.id !== permissionId));
		},
		[sessionId],
	);

	const activePermissions = permissions.filter(
		(p) => p.sessionID === sessionId,
	);

	const handleRevert = useCallback(
		async (messageId: string) => {
			if (!sessionId) return;
			try {
				await sessionsApi.revert(sessionId, messageId);
				// Reload messages after revert
				await loadSessionMessages(sessionId);
			} catch (error) {
				console.error("Failed to revert:", error);
			}
		},
		[sessionId, loadSessionMessages],
	);

	const handleFork = useCallback(
		async (messageId: string) => {
			if (!sessionId) return;
			try {
				const newSession = await sessionsApi.fork(sessionId, messageId);
				// Refresh sessions list and switch to the new session
				if (_refreshSessions) {
					await _refreshSessions();
				}
				if (contextSelectSession) {
					contextSelectSession(newSession);
				}
			} catch (error) {
				console.error("Failed to fork session:", error);
			}
		},
		[sessionId, _refreshSessions, contextSelectSession],
	);

	const handleSelectSession = useCallback(
		(targetSessionId: string) => {
			// Find the session in the list and select it
			const session = sessions.find((s) => s.id === targetSessionId);
			if (session && contextSelectSession) {
				contextSelectSession(session);
			} else if (_setCurrentSessionId) {
				// Fallback to setting the ID directly
				_setCurrentSessionId(targetSessionId);
			}
		},
		[sessions, contextSelectSession, _setCurrentSessionId],
	);

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.container}
				keyboardVerticalOffset={keyboardOffset}
			>
				<View style={styles.messageContainer}>
					<MessageList
						messages={messages}
						isLoading={isLoading}
						onRevert={handleRevert}
						onFork={handleFork}
						onSelectSession={handleSelectSession}
					/>
				</View>

				{/* Streaming status indicator */}
				{(assistantStatus.isActive || isLoading) && (
					<WorkingPlaceholder
						isStreaming={isLoading}
						statusText={assistantStatus.statusText || "Working..."}
						activityType={assistantStatus.activityType}
					/>
				)}

				{activePermissions.length > 0 && (
					<View
						style={[
							styles.permissionsContainer,
							{ backgroundColor: colors.background },
						]}
					>
						{activePermissions.map((permission) => (
							<PermissionCard
								key={permission.id}
								permission={permission}
								onResponse={(response) =>
									handlePermissionResponse(permission.id, response)
								}
							/>
						))}
					</View>
				)}

				<View
					style={[
						styles.inputContainer,
						{
							backgroundColor: colors.background,
							paddingBottom: Math.max(insets.bottom, 12),
						},
					]}
				>
					<ChatInput
						onSend={handleSend}
						isLoading={isLoading}
						placeholder={
							isConnected
								? "# for agents; @ for files; / for commands"
								: "Connect to server first"
						}
						agents={agents.map((a) => ({
							name: a.name,
							description: a.description,
						}))}
						commands={commands.map((c) => ({
							name: c.name,
							description: c.description,
						}))}
						onFileSearch={handleFileSearch}
						modelInfo={modelInfo}
						activeAgent={activeAgent}
						onModelPress={() => {
							Keyboard.dismiss();
							setShowModelPicker(true);
						}}
						onAgentPress={() => {
							Keyboard.dismiss();
							setShowAgentPicker(true);
						}}
					/>
				</View>
			</KeyboardAvoidingView>

			{showAgentPicker && (
				<AgentPicker
					agents={agents}
					currentAgentName={currentAgentName}
					onAgentChange={handleAgentChange}
					visible={showAgentPicker}
					onClose={() => setShowAgentPicker(false)}
				/>
			)}

			{showModelPicker && (
				<ModelPicker
					providers={enrichedProviders}
					currentProviderId={currentProviderId}
					currentModelId={currentModelId}
					onModelChange={(providerId, modelId) => {
						setCurrentProviderId(providerId);
						setCurrentModelId(modelId);
					}}
					visible={showModelPicker}
					onClose={() => setShowModelPicker(false)}
					favoriteModels={favoriteModels}
					onToggleFavorite={handleToggleFavorite}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	messageContainer: {
		flex: 1,
	},
	permissionsContainer: {
		paddingHorizontal: 16,
		paddingTop: 8,
	},
	inputContainer: {
		paddingHorizontal: 6, // px-1.5 - matches PWA mobile
		paddingTop: 0,
		paddingBottom: 8, // pb-2 - matches PWA mobile
	},
});
