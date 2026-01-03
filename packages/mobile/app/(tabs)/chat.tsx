import { useCallback, useEffect, useRef, useState } from "react";
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
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
	const { directory, isConnected } = useConnectionStore();

	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [sessions, setSessions] = useState<Session[]>([]);
	const [showSessionPicker, setShowSessionPicker] = useState(false);
	const [isLoadingSessions, setIsLoadingSessions] = useState(false);

	const partsMapRef = useRef<Map<string, MessagePart>>(new Map());
	const currentAssistantMessageIdRef = useRef<string | null>(null);

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

	const getStatusColor = () => {
		if (isConnected) return "text-success";
		return "text-destructive";
	};

	const getStatusText = () => {
		if (isConnected) return "Connected";
		return "Not connected";
	};

	const currentSession = sessions.find((s) => s.id === sessionId);

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			className="flex-1 bg-background"
			keyboardVerticalOffset={0}
		>
			<View
				className="border-b border-border bg-background px-4 py-3"
				style={{ paddingTop: insets.top + 8 }}
			>
				<View className="flex-row items-center justify-between">
					<Pressable
						onPress={() => {
							fetchSessions();
							setShowSessionPicker(true);
						}}
						className="flex-1"
					>
						<Text className="font-mono text-lg font-semibold text-foreground">
							{currentSession?.title || (sessionId ? "Session" : "New Chat")}
						</Text>
						<Text className={`font-mono text-xs ${getStatusColor()}`}>
							{getStatusText()} • Tap to switch
						</Text>
					</Pressable>

					<Pressable
						onPress={startNewSession}
						className="rounded-lg bg-primary px-3 py-2"
					>
						<Text className="font-mono text-sm font-medium text-primary-foreground">
							+ New
						</Text>
					</Pressable>
				</View>
			</View>

			<View className="flex-1">
				<MessageList messages={messages} isLoading={isLoading} />
			</View>

			<View
				className="border-t border-border bg-background px-4 py-3"
				style={{ paddingBottom: insets.bottom + 8 }}
			>
				<ChatInput
					onSend={handleSend}
					isLoading={isLoading}
					placeholder={
						isConnected ? "Ask anything..." : "Connect to server first"
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
					className="flex-1 bg-background"
					style={{ paddingTop: insets.top }}
				>
					<View className="flex-row items-center justify-between border-b border-border px-4 py-3">
						<Text className="font-mono text-lg font-semibold text-foreground">
							Sessions
						</Text>
						<Pressable
							onPress={() => setShowSessionPicker(false)}
							className="rounded-lg bg-muted px-3 py-2"
						>
							<Text className="font-mono text-sm text-foreground">Close</Text>
						</Pressable>
					</View>

					<ScrollView className="flex-1 p-4">
						<Pressable
							onPress={startNewSession}
							className="mb-3 rounded-lg border border-primary bg-primary/10 p-4"
						>
							<Text className="font-mono text-base font-semibold text-primary">
								+ Start New Session
							</Text>
							<Text className="font-mono text-xs text-muted-foreground">
								Create a fresh conversation
							</Text>
						</Pressable>

						{isLoadingSessions ? (
							<Text className="text-center font-mono text-muted-foreground">
								Loading sessions...
							</Text>
						) : sessions.length === 0 ? (
							<Text className="text-center font-mono text-muted-foreground">
								No existing sessions
							</Text>
						) : (
							sessions.map((session) => (
								<Pressable
									key={session.id}
									onPress={() => selectSession(session)}
									className={`mb-2 rounded-lg border p-4 ${
										session.id === sessionId
											? "border-primary bg-primary/5"
											: "border-border bg-card"
									}`}
								>
									<Text className="font-mono text-base font-medium text-foreground">
										{session.title || `Session ${session.id.slice(0, 8)}`}
									</Text>
									<Text className="font-mono text-xs text-muted-foreground">
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
