import { useCallback, useEffect, useRef, useState } from "react";
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
	useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sessionsApi, filesApi, type Session } from "../../src/api";
import type { Message, MessagePart } from "../../src/components/chat";
import { ChatInput, MessageList, convertStreamingPart } from "../../src/components/chat";
import { type MessagePart as StreamingPart } from "../../src/lib/streaming";
import { useEventStream, type StreamEvent } from "../../src/hooks/useEventStream";
import { useConnectionStore } from "../../src/stores/useConnectionStore";

export default function ChatScreen() {
	const insets = useSafeAreaInsets();
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';
	const { directory, isConnected } = useConnectionStore();

	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [sessions, setSessions] = useState<Session[]>([]);
	const [showSessionPicker, setShowSessionPicker] = useState(false);
	const [isLoadingSessions, setIsLoadingSessions] = useState(false);

	const partsMapRef = useRef<Map<string, MessagePart>>(new Map());
	const currentAssistantMessageIdRef = useRef<string | null>(null);

	const colors = {
		background: isDark ? "#100F0F" : "#FFFCF0",
		foreground: isDark ? "#CECDC3" : "#100F0F",
		muted: isDark ? "#1C1B1A" : "#F2F0E5",
		mutedForeground: isDark ? "#878580" : "#6F6E69",
		border: isDark ? "#343331" : "#DAD8CE",
		primary: "#EC8B49",
		card: isDark ? "#282726" : "#F2F0E5",
	};

	const handleStreamEvent = useCallback((event: StreamEvent) => {
		const props = event.properties;
		if (!props) return;

		const eventSessionId = props.sessionID || props.info?.sessionID;
		if (eventSessionId && sessionId && eventSessionId !== sessionId) {
			return;
		}

		if (event.type === "message.part.updated" && props.part) {
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

			if (serverParts && Array.isArray(serverParts)) {
				for (const sp of serverParts) {
					const streamPart = sp as StreamingPart;
					const partId = streamPart.id || `part-${Date.now()}-${Math.random()}`;
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
				}
			}
		}
	}, [sessionId]);

	useEventStream(sessionId, handleStreamEvent);

	const fetchSessions = useCallback(async () => {
		if (!isConnected) return;

		setIsLoadingSessions(true);
		try {
			const data = await sessionsApi.list();
			setSessions(data);
		} catch (error) {
			console.error("Failed to fetch sessions:", error);
		} finally {
			setIsLoadingSessions(false);
		}
	}, [isConnected]);

	const loadSessionMessages = useCallback(
		async (id: string) => {
			if (!isConnected) return;

			try {
				const data = await sessionsApi.getMessages(id);
				const loadedMessages: Message[] = [];

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
					}
				}

				setMessages(loadedMessages);
			} catch (error) {
				console.error("Failed to load session messages:", error);
			}
		},
		[isConnected],
	);

	const selectSession = useCallback(
		async (session: Session) => {
			setSessionId(session.id);
			setShowSessionPicker(false);
			await loadSessionMessages(session.id);
		},
		[loadSessionMessages],
	);

	const startNewSession = useCallback(() => {
		setSessionId(null);
		setMessages([]);
		setShowSessionPicker(false);
	}, []);

	useEffect(() => {
		if (isConnected) {
			fetchSessions();
		}
	}, [isConnected, fetchSessions]);

	const createSession = useCallback(async (): Promise<string> => {
		const data = await sessionsApi.create();
		fetchSessions();
		return data.id;
	}, [fetchSessions]);

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
		async (content: string) => {
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
				};

				setMessages((prev) => [...prev, assistantMessage]);

				await sessionsApi.sendMessage(currentSessionId, content);
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
		[isConnected, sessionId, isLoading, createSession],
	);

	const HEADER_HEIGHT = 52;
	const keyboardOffset = HEADER_HEIGHT + insets.top;

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={{ flex: 1, backgroundColor: colors.background }}
			keyboardVerticalOffset={keyboardOffset}
		>
			<View style={{ flex: 1 }}>
				<MessageList messages={messages} isLoading={isLoading} />
			</View>

			<View
				style={{
					borderTopWidth: 1,
					borderTopColor: colors.border,
					backgroundColor: colors.background,
					paddingHorizontal: 16,
					paddingTop: 12,
					paddingBottom: Math.max(insets.bottom, 12),
				}}
			>
				<ChatInput
					onSend={handleSend}
					isLoading={isLoading}
					placeholder={
						isConnected ? "# for agents; @ for files; / for commands" : "Connect to server first"
					}
					onFileSearch={handleFileSearch}
				/>
			</View>

			<Modal
				visible={showSessionPicker}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={() => setShowSessionPicker(false)}
			>
				<View
					style={{
						flex: 1,
						backgroundColor: colors.background,
						paddingTop: insets.top,
					}}
				>
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
							borderBottomWidth: 1,
							borderBottomColor: colors.border,
							paddingHorizontal: 16,
							paddingVertical: 12,
						}}
					>
						<Text
							style={{
								fontFamily: 'IBMPlexMono-SemiBold',
								fontSize: 18,
								color: colors.foreground,
							}}
						>
							Sessions
						</Text>
						<Pressable
							onPress={() => setShowSessionPicker(false)}
							style={{
								borderRadius: 8,
								backgroundColor: colors.muted,
								paddingHorizontal: 12,
								paddingVertical: 8,
							}}
						>
							<Text
								style={{
									fontFamily: 'IBMPlexMono-Medium',
									fontSize: 14,
									color: colors.foreground,
								}}
							>
								Close
							</Text>
						</Pressable>
					</View>

					<ScrollView style={{ flex: 1, padding: 16 }}>
						<Pressable
							onPress={startNewSession}
							style={{
								marginBottom: 12,
								borderRadius: 8,
								borderWidth: 1,
								borderColor: colors.primary,
								backgroundColor: `${colors.primary}15`,
								padding: 16,
							}}
						>
							<Text
								style={{
									fontFamily: 'IBMPlexMono-SemiBold',
									fontSize: 16,
									color: colors.primary,
								}}
							>
								+ Start New Session
							</Text>
							<Text
								style={{
									fontFamily: 'IBMPlexMono-Regular',
									fontSize: 12,
									color: colors.mutedForeground,
									marginTop: 4,
								}}
							>
								Create a fresh conversation
							</Text>
						</Pressable>

						{isLoadingSessions ? (
							<Text
								style={{
									fontFamily: 'IBMPlexMono-Regular',
									textAlign: 'center',
									color: colors.mutedForeground,
								}}
							>
								Loading sessions...
							</Text>
						) : sessions.length === 0 ? (
							<Text
								style={{
									fontFamily: 'IBMPlexMono-Regular',
									textAlign: 'center',
									color: colors.mutedForeground,
								}}
							>
								No existing sessions
							</Text>
						) : (
							sessions.map((session) => (
								<Pressable
									key={session.id}
									onPress={() => selectSession(session)}
									style={{
										marginBottom: 8,
										borderRadius: 8,
										borderWidth: 1,
										borderColor: session.id === sessionId ? colors.primary : colors.border,
										backgroundColor: session.id === sessionId ? `${colors.primary}08` : colors.card,
										padding: 16,
									}}
								>
									<Text
										style={{
											fontFamily: 'IBMPlexMono-Medium',
											fontSize: 16,
											color: colors.foreground,
										}}
									>
										{session.title || `Session ${session.id.slice(0, 8)}`}
									</Text>
									<Text
										style={{
											fontFamily: 'IBMPlexMono-Regular',
											fontSize: 12,
											color: colors.mutedForeground,
											marginTop: 4,
										}}
									>
										ID: {session.id.slice(0, 16)}...
									</Text>
								</Pressable>
							))
						)}
					</ScrollView>
				</View>
			</Modal>
		</KeyboardAvoidingView>
	);
}
