import type BottomSheet from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import {
	type Agent,
	agentsApi,
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
} from "../../src/components/chat";
import {
	AgentPicker,
	type AttachedFile,
	ChatInput,
	convertStreamingPart,
	MessageList,
	PermissionCard,
	TimelineSheet,
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
import type { MessagePart as StreamingPart } from "../../src/lib/streaming";
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { typography, useTheme } from "../../src/theme";

const DEFAULT_CONTEXT_LIMIT = 200000;
const DEFAULT_OUTPUT_LIMIT = 8192;

type TokenBreakdown = {
	input?: number;
	output?: number;
	reasoning?: number;
	cache?: { read?: number; write?: number };
};

function extractTokensFromParts(parts?: MessagePart[]): number {
	if (!parts || parts.length === 0) return 0;

	for (const part of parts) {
		const tokens = (part as { tokens?: number | TokenBreakdown }).tokens;
		if (typeof tokens === "number") return tokens;
		if (tokens && typeof tokens === "object") {
			const input = tokens.input ?? 0;
			const output = tokens.output ?? 0;
			const reasoning = tokens.reasoning ?? 0;
			const cacheRead = tokens.cache?.read ?? 0;
			const cacheWrite = tokens.cache?.write ?? 0;
			return input + output + reasoning + cacheRead + cacheWrite;
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
		openSessionSheet,
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
	const [currentProviderId, setCurrentProviderId] = useState<
		string | undefined
	>();
	const [currentModelId, setCurrentModelId] = useState<string | undefined>();

	const [agents, setAgents] = useState<Agent[]>([]);
	const [currentAgentName, setCurrentAgentName] = useState<
		string | undefined
	>();
	const [showAgentPicker, setShowAgentPicker] = useState(false);
	const [openChamberSettings, setOpenChamberSettings] =
		useState<SettingsPayload | null>(null);

	const timelineSheetRef = useRef<BottomSheet>(null);

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
				if (props.info?.role === "user") {
					return;
				}

				// Ensure we have an active assistant message being tracked
				if (!currentAssistantMessageIdRef.current) {
					return;
				}

				// Skip events for non-assistant messages based on server message ID pattern
				if (serverMessageId && typeof serverMessageId === "string") {
					const looksLikeServerMessageId =
						serverMessageId.startsWith("msg_") ||
						(serverMessageId.length > 20 &&
							/^[0-9A-Z]+$/i.test(serverMessageId.slice(0, 10)));
					if (looksLikeServerMessageId && props.info?.role === undefined) {
						return;
					}
				}

				const streamPart = props.part as StreamingPart;
				const partId = streamPart.id || `part-${Date.now()}-${Math.random()}`;
				const converted = convertStreamingPart(streamPart);
				converted.id = partId;

				partsMapRef.current.set(partId, converted);

				const partsArray = Array.from(partsMapRef.current.values());
				let textContent = "";
				for (const p of partsArray) {
					if (p.type === "text") {
						textContent += p.content || p.text || "";
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
				if (serverMessageId && typeof serverMessageId === "string") {
					const looksLikeServerMessageId =
						serverMessageId.startsWith("msg_") ||
						(serverMessageId.length > 20 &&
							/^[0-9A-Z]+$/i.test(serverMessageId.slice(0, 10)));
					if (looksLikeServerMessageId && info?.role === undefined) {
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
						partsMapRef.current.set(partId, converted);
					}
				}

				const partsArray = Array.from(partsMapRef.current.values());
				let textContent = "";
				for (const p of partsArray) {
					if (p.type === "text") {
						textContent += p.content || p.text || "";
					}
				}

				const isComplete =
					info?.finish === "stop" ||
					info?.finish === "cancelled" ||
					info?.finish === "error" ||
					(info?.time?.completed && typeof info.time.completed === "number");

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
	// Note: _updateStreamingSessions excluded from deps - it's a stable ref
	useEffect(() => {
		if (_updateStreamingSessions) {
			_updateStreamingSessions(
				isLoading && sessionId ? new Set([sessionId]) : new Set(),
			);
		}
	}, [isLoading, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

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

	// Fetch providers (model selection is handled by dedicated effect below)
	useEffect(() => {
		if (!isConnected) return;

		const fetchProviders = async () => {
			try {
				const data = await providersApi.list();
				setProviders(data);
			} catch (err) {
				console.error("Failed to fetch providers:", err);
			}
		};

		fetchProviders();
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
		const tokens = extractTokensFromParts(lastMessage.parts);

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
									content += part.text || part.content || "";
								}
							}
						}

						// Extract model/agent info from assistant messages
						let messageModelName: string | undefined;
						let messageAgentName: string | undefined;

						if (msg.info.role === "assistant") {
							if (msg.info.providerID) lastProviderID = msg.info.providerID;
							if (msg.info.modelID) lastModelID = msg.info.modelID;
							if (msg.info.mode) lastAgentName = msg.info.mode;

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
							agentName: messageAgentName,
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
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		async (content: string, _attachedFiles?: AttachedFile[]) => {
			if (!isConnected || isLoading) return;

			setIsLoading(true);

			const userMessage: Message = {
				id: `user-${Date.now()}`,
				role: "user",
				content,
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

				const assistantMessage: Message = {
					id: assistantMessageId,
					role: "assistant",
					content: "",
					parts: [],
					isStreaming: true,
					createdAt: Date.now(),
					modelName: modelInfo?.modelName,
					agentName: activeAgent?.name,
				};

				setMessages((prev) => [...prev, assistantMessage]);

				await sessionsApi.sendMessage(
					currentSessionId,
					content,
					currentProviderId,
					currentModelId,
					currentAgentName,
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

	const currentSession = sessions.find((s) => s.id === sessionId);
	const sessionLabel =
		currentSession?.title ||
		(sessionId ? `Session ${sessionId.slice(0, 8)}` : "New Session");

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

	const openTimelineSheet = useCallback(() => {
		timelineSheetRef.current?.expand();
	}, []);

	const closeTimelineSheet = useCallback(() => {
		timelineSheetRef.current?.close();
	}, []);

	const handleTimelineNavigate = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		(_messageId: string) => {
			closeTimelineSheet();
			// Navigate to message - scroll to it
			// For now, just close the sheet. Full scroll-to-message could be added later.
		},
		[closeTimelineSheet],
	);

	const handleTimelineFork = useCallback(
		async (messageId: string) => {
			closeTimelineSheet();
			await handleFork(messageId);
		},
		[closeTimelineSheet, handleFork],
	);

	const handleUndo = useCallback(async () => {
		if (!sessionId) return;
		try {
			await sessionsApi.revert(sessionId);
			await loadSessionMessages(sessionId);
		} catch (error) {
			console.error("Failed to undo:", error);
		}
	}, [sessionId, loadSessionMessages]);

	const handleRedo = useCallback(async () => {
		if (!sessionId) return;
		try {
			await sessionsApi.unrevert(sessionId);
			await loadSessionMessages(sessionId);
		} catch (error) {
			console.error("Failed to redo:", error);
		}
	}, [sessionId, loadSessionMessages]);

	// Check if undo/redo is possible based on messages
	const canUndo = messages.some((m) => m.role === "user");

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={[styles.container, { backgroundColor: colors.background }]}
			keyboardVerticalOffset={keyboardOffset}
		>
			<View style={[styles.sessionBar, { borderBottomColor: colors.border }]}>
				<Pressable onPress={openSessionSheet} style={styles.sessionBarLeft}>
					<Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
						<Path
							d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
							stroke={colors.mutedForeground}
							strokeWidth={2}
						/>
					</Svg>
					<Text
						style={[
							typography.micro,
							{ color: colors.mutedForeground, flex: 1 },
						]}
						numberOfLines={1}
					>
						{sessionLabel}
					</Text>
					<Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
						<Path
							d="M6 9l6 6 6-6"
							stroke={colors.mutedForeground}
							strokeWidth={2}
							strokeLinecap="round"
						/>
					</Svg>
				</Pressable>
				{messages.length > 0 && (
					<View style={styles.sessionBarActions}>
						{/* Undo button */}
						<Pressable
							onPress={handleUndo}
							disabled={!canUndo}
							style={({ pressed }) => [
								styles.actionIconButton,
								{ opacity: !canUndo ? 0.4 : pressed ? 0.7 : 1 },
							]}
						>
							<Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
								<Path
									d="M3 7v6h6"
									stroke={colors.mutedForeground}
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<Path
									d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"
									stroke={colors.mutedForeground}
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</Svg>
						</Pressable>
						{/* Redo button */}
						<Pressable
							onPress={handleRedo}
							style={({ pressed }) => [
								styles.actionIconButton,
								{ opacity: pressed ? 0.7 : 1 },
							]}
						>
							<Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
								<Path
									d="M21 7v6h-6"
									stroke={colors.mutedForeground}
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<Path
									d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"
									stroke={colors.mutedForeground}
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</Svg>
						</Pressable>
						{/* Timeline button */}
						<Pressable
							onPress={openTimelineSheet}
							style={({ pressed }) => [
								styles.actionIconButton,
								{ opacity: pressed ? 0.7 : 1 },
							]}
						>
							<Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
								<Path
									d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"
									stroke={colors.mutedForeground}
									strokeWidth={2}
									strokeLinecap="round"
								/>
								<Path
									d="M12 6v6l4 2"
									stroke={colors.mutedForeground}
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</Svg>
						</Pressable>
					</View>
				)}
			</View>

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
					onFileSearch={handleFileSearch}
					modelInfo={modelInfo}
					activeAgent={activeAgent}
					onModelPress={() => {
						// Model picker is now handled by ModelControls above
					}}
					onAgentPress={() => setShowAgentPicker(true)}
				/>
			</View>

			<AgentPicker
				agents={agents}
				currentAgentName={currentAgentName}
				onAgentChange={handleAgentChange}
				visible={showAgentPicker}
				onClose={() => setShowAgentPicker(false)}
			/>

			<TimelineSheet
				ref={timelineSheetRef}
				messages={messages}
				onNavigate={handleTimelineNavigate}
				onFork={handleTimelineFork}
				onClose={closeTimelineSheet}
			/>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	sessionBar: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 16,
		paddingVertical: 6,
		borderBottomWidth: 1,
	},
	sessionBarLeft: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	sessionBarActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	actionIconButton: {
		padding: 6,
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
