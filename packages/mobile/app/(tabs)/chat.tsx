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
	sessionsApi,
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
} from "../../src/components/chat";
import {
	type StreamEvent,
	useEventStream,
} from "../../src/hooks/useEventStream";
import type { MessagePart as StreamingPart } from "../../src/lib/streaming";
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { typography, useTheme } from "../../src/theme";
import { useContextUsageContext, useSessionSheetContext } from "./_context";

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
	const [currentAgentName, setCurrentAgentName] = useState<string | undefined>();
	const [showAgentPicker, setShowAgentPicker] = useState(false);

	const activeAgent: AgentInfo | undefined = useMemo(() => {
		if (!currentAgentName) return undefined;
		const agent = agents.find((a) => a.name === currentAgentName);
		if (!agent) return undefined;
		return { name: agent.name };
	}, [agents, currentAgentName]);

	// Derive modelInfo from current selection
	const modelInfo: ModelInfo | undefined = useMemo(() => {
		if (__DEV__) {
			console.log("[Chat] Deriving modelInfo:", {
				currentProviderId,
				currentModelId,
				providersCount: providers.length,
				providerIds: providers.map(p => p.id),
			});
		}
		
		if (!currentProviderId || !currentModelId) {
			if (__DEV__) console.log("[Chat] modelInfo: undefined (no provider/model selected)");
			return undefined;
		}
		
		const provider = providers.find((p) => p.id === currentProviderId);
		const model = provider?.models?.find((m) => m.id === currentModelId);
		
		if (__DEV__) {
			console.log("[Chat] Found provider/model:", {
				providerFound: !!provider,
				providerModelsCount: provider?.models?.length,
				modelFound: !!model,
				modelId: model?.id,
				modelName: model?.name,
				modelNameType: typeof model?.name,
			});
		}
		
		if (!provider || !model) {
			if (__DEV__) console.log("[Chat] modelInfo: undefined (provider/model not found)");
			return undefined;
		}
		
		const displayName = model.name || model.id;
		const result = {
			modelId: model.id,
			modelName: displayName.length > 40 ? `${displayName.substring(0, 37)}...` : displayName,
			providerId: provider.id,
			providerName: provider.name,
		};
		
		if (__DEV__) console.log("[Chat] modelInfo result:", result);
		return result;
	}, [providers, currentProviderId, currentModelId]);

	const partsMapRef = useRef<Map<string, MessagePart>>(new Map());
	const currentAssistantMessageIdRef = useRef<string | null>(null);
	const lastEventTimeRef = useRef<number>(0);

	const handleStreamEvent = useCallback(
		(event: StreamEvent) => {
			const props = event.properties;
			if (!props) return;

			const eventSessionId = props.sessionID || props.info?.sessionID;
			if (eventSessionId && sessionId && eventSessionId !== sessionId) {
				return;
			}

			lastEventTimeRef.current = Date.now();

			if (__DEV__) {
				console.log(
					"[Chat] Event:",
					event.type,
					props.part?.type || props.info?.finish || "",
				);
			}

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

			if (event.type === "message.part.updated" && props.part) {
				// Only process parts for assistant messages - ignore user message events
				if (props.info?.role === "user") {
					return;
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

				// Only process assistant messages - ignore user message events
				// The server sends message.updated for both user and assistant messages
				if (info?.role === "user") {
					return;
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

				if (__DEV__ && isComplete) {
					console.log("[Chat] Message complete:", {
						finish: info?.finish,
						partsCount: partsArray.length,
					});
				}

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
					}
				}
			}
		},
		[sessionId],
	);

	useEventStream(sessionId, handleStreamEvent);

	// Sync streaming state with layout context
	useEffect(() => {
		if (_updateStreamingSessions) {
			const ids = new Set<string>();
			if (isLoading && sessionId) {
				ids.add(sessionId);
			}
			_updateStreamingSessions(ids);
		}
	}, [isLoading, sessionId, _updateStreamingSessions]);

	// Sync with context's currentSessionId - defined after loadSessionMessages
	const prevContextSessionIdRef = useRef<string | null>(null);

	// Fetch providers and set default model
	useEffect(() => {
		if (!isConnected) return;

		const fetchProviders = async () => {
			try {
				if (__DEV__) console.log("[Chat] Fetching providers...");
				const data = await providersApi.list();
				
				if (__DEV__) {
					console.log("[Chat] Providers fetched:", {
						count: data.length,
						providers: data.map(p => ({
							id: p.id,
							name: p.name,
							modelsCount: p.models?.length,
							firstModel: p.models?.[0],
						})),
					});
				}
				
				setProviders(data);

				// Set default provider/model if not already set
				if (!currentProviderId && data.length > 0) {
					const defaultProvider =
						data.find((p) => p.id === "anthropic") || data[0];
					if (defaultProvider) {
						console.log("[Chat] === DEFAULT MODEL SELECTION DEBUG ===");
						console.log("[Chat] Provider:", defaultProvider.id);
						console.log("[Chat] All models:", JSON.stringify(defaultProvider.models?.map(m => ({
							id: m.id,
							name: m.name,
						})), null, 2));

						setCurrentProviderId(defaultProvider.id);

						// Prefer Claude Sonnet as default, otherwise use first model
						const models = defaultProvider.models ?? [];

						// Debug: Check each model for matching
						models.forEach((m, idx) => {
							const matchesSonnet =
								m.id.includes("claude-3-5-sonnet") ||
								m.id.includes("claude-sonnet") ||
								m.name?.toLowerCase().includes("sonnet");
							console.log(`[Chat] Model ${idx}: id="${m.id}", name="${m.name}", matchesSonnet=${matchesSonnet}`);
						});

						const preferredModel = models.find((m) =>
							m.id.includes("claude-3-5-sonnet") ||
							m.id.includes("claude-sonnet") ||
							m.name?.toLowerCase().includes("sonnet")
						) || models[0];

						console.log("[Chat] Selected preferredModel:", preferredModel ? {
							id: preferredModel.id,
							name: preferredModel.name,
						} : "NONE (using first)");

						if (preferredModel) {
							setCurrentModelId(preferredModel.id);
							console.log("[Chat] Set currentModelId to:", preferredModel.id);
						}
						console.log("[Chat] === END DEBUG ===");
					}
				}
			} catch (err) {
				console.error("Failed to fetch providers:", err);
			}
		};

		fetchProviders();
	}, [isConnected, currentProviderId]);

	// Fetch agents
	useEffect(() => {
		if (!isConnected) return;

		const fetchAgents = async () => {
			try {
				const data = await agentsApi.list();
				setAgents(data);

				// Set default agent if not already set
				if (!currentAgentName && data.length > 0) {
					const defaultAgent =
						data.find((a) => a.name === "build") ||
						data.find((a) => a.mode === "primary" || a.mode === "all") ||
						data[0];
					if (defaultAgent) {
						setCurrentAgentName(defaultAgent.name);
					}
				}
			} catch (err) {
				console.error("Failed to fetch agents:", err);
			}
		};

		fetchAgents();
	}, [isConnected, currentAgentName]);

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

						loadedMessages.push({
							id: msg.info.id || `msg-${Date.now()}`,
							role: msg.info.role === "user" ? "user" : "assistant",
							content,
							parts: parts.length > 0 ? parts : undefined,
							createdAt: msg.info.createdAt || Date.now(),
						});

						// Extract model/agent info from assistant messages
						if (msg.info.role === "assistant") {
							if (msg.info.providerID) lastProviderID = msg.info.providerID;
							if (msg.info.modelID) lastModelID = msg.info.modelID;
							if (msg.info.mode) lastAgentName = msg.info.mode;
						}
					}
				}

				setMessages(loadedMessages);

				// Restore model/agent selection from the session's last used values
				if (lastProviderID && lastModelID) {
					// Verify the provider/model exists before setting
					const provider = providers.find((p) => p.id === lastProviderID);
					const model = provider?.models?.find((m) => m.id === lastModelID);
					if (provider && model) {
						if (__DEV__) {
							console.log("[Chat] Restoring session model:", {
								providerId: lastProviderID,
								modelId: lastModelID,
							});
						}
						setCurrentProviderId(lastProviderID);
						setCurrentModelId(lastModelID);
					}
				}

				if (lastAgentName) {
					// Verify the agent exists before setting
					const agent = agents.find((a) => a.name === lastAgentName);
					if (agent) {
						if (__DEV__) {
							console.log("[Chat] Restoring session agent:", lastAgentName);
						}
						setCurrentAgentName(lastAgentName);
					}
				}
			} catch (error) {
				console.error("Failed to load session messages:", error);
			}
		},
		[isConnected, providers, agents],
	);

	// Sync with context's currentSessionId
	useEffect(() => {
		if (currentSessionId !== prevContextSessionIdRef.current) {
			prevContextSessionIdRef.current = currentSessionId;
			setSessionId(currentSessionId);
			if (currentSessionId) {
				loadSessionMessages(currentSessionId);
			} else {
				setMessages([]);
			}
		}
	}, [currentSessionId, loadSessionMessages]);

	// Update context when local sessionId changes (e.g., after creating a new session)
	useEffect(() => {
		if (_setCurrentSessionId && sessionId !== currentSessionId) {
			_setCurrentSessionId(sessionId);
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
		],
	);

	// Model change handlers
	const handleProviderChange = useCallback(
		(providerId: string) => {
			setCurrentProviderId(providerId);
			// Reset model when provider changes
			const provider = providers.find((p) => p.id === providerId);
			const defaultModel = provider?.models?.[0];
			if (defaultModel) {
				setCurrentModelId(defaultModel.id);
			}
		},
		[providers],
	);

	const handleModelChange = useCallback(
		(providerId: string, modelId: string) => {
			setCurrentProviderId(providerId);
			setCurrentModelId(modelId);
		},
		[],
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

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={[styles.container, { backgroundColor: colors.background }]}
			keyboardVerticalOffset={keyboardOffset}
		>
			<Pressable
				onPress={openSessionSheet}
				style={[styles.sessionBar, { borderBottomColor: colors.border }]}
			>
				<Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
					<Path
						d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
						stroke={colors.mutedForeground}
						strokeWidth={2}
					/>
				</Svg>
				<Text
					style={[typography.micro, { color: colors.mutedForeground, flex: 1 }]}
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

			<View style={styles.messageContainer}>
				<MessageList messages={messages} isLoading={isLoading} />
			</View>

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
						borderTopColor: colors.border,
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
	messageContainer: {
		flex: 1,
	},
	permissionsContainer: {
		paddingHorizontal: 16,
		paddingTop: 8,
	},
	inputContainer: {
		borderTopWidth: 1,
		paddingHorizontal: 16,
		paddingTop: 12,
	},
});
