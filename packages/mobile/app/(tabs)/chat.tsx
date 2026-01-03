import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
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
import type { Message } from "../../src/components/chat";
import { ChatInput, MessageList } from "../../src/components/chat";
import { streamChat } from "../../src/lib/streaming";

const STORAGE_KEYS = {
	SERVER_URL: "openchamber_server_url",
	AUTH_TOKEN: "openchamber_auth_token",
} as const;

interface Session {
	id: string;
	title?: string;
	createdAt?: number;
	updatedAt?: number;
}

export default function ChatScreen() {
	const insets = useSafeAreaInsets();
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [serverUrl, setServerUrl] = useState<string | null>(null);
	const [authToken, setAuthToken] = useState<string | null>(null);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [sessions, setSessions] = useState<Session[]>([]);
	const [showSessionPicker, setShowSessionPicker] = useState(false);
	const [isLoadingSessions, setIsLoadingSessions] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<
		"connecting" | "connected" | "disconnected"
	>("connecting");

	const fetchSessions = useCallback(async () => {
		if (!serverUrl || !authToken) return;

		setIsLoadingSessions(true);
		try {
			const response = await fetch(`${serverUrl}/api/session/list`, {
				headers: {
					Authorization: `Bearer ${authToken}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				setSessions(Array.isArray(data) ? data : []);
			}
		} catch (error) {
			console.error("Failed to fetch sessions:", error);
		} finally {
			setIsLoadingSessions(false);
		}
	}, [serverUrl, authToken]);

	const loadSessionMessages = useCallback(
		async (id: string) => {
			if (!serverUrl || !authToken) return;

			try {
				const response = await fetch(
					`${serverUrl}/api/session/${id}/messages`,
					{
						headers: {
							Authorization: `Bearer ${authToken}`,
						},
					},
				);

				if (response.ok) {
					const data = await response.json();
					const loadedMessages: Message[] = [];

					if (Array.isArray(data)) {
						for (const msg of data) {
							if (msg.info) {
								let content = "";
								if (Array.isArray(msg.parts)) {
									for (const part of msg.parts) {
										if (part.type === "text" && part.text) {
											content += part.text;
										}
									}
								}
								loadedMessages.push({
									id: msg.info.id || `msg-${Date.now()}`,
									role: msg.info.role === "user" ? "user" : "assistant",
									content,
									createdAt: msg.info.createdAt || Date.now(),
								});
							}
						}
					}

					setMessages(loadedMessages);
				}
			} catch (error) {
				console.error("Failed to load session messages:", error);
			}
		},
		[serverUrl, authToken],
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
		const loadCredentials = async () => {
			try {
				const url = await SecureStore.getItemAsync(STORAGE_KEYS.SERVER_URL);
				const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);

				if (url && token) {
					setServerUrl(url);
					setAuthToken(token);
					setConnectionStatus("connected");
				} else {
					setConnectionStatus("disconnected");
				}
			} catch {
				setConnectionStatus("disconnected");
			}
		};

		loadCredentials();
	}, []);

	useEffect(() => {
		if (connectionStatus === "connected") {
			fetchSessions();
		}
	}, [connectionStatus, fetchSessions]);

	const createSession = useCallback(async (): Promise<string> => {
		if (!serverUrl || !authToken) {
			throw new Error("Not connected to server");
		}

		const response = await fetch(`${serverUrl}/api/session/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${authToken}`,
			},
			body: JSON.stringify({}),
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => "Unknown error");
			throw new Error(`Failed to create session: ${response.status} - ${errorText}`);
		}

		const data = await response.json();
		fetchSessions();
		return data.id;
	}, [serverUrl, authToken, fetchSessions]);

	const handleSend = useCallback(
		async (content: string) => {
			if (!serverUrl || !authToken || isLoading) return;

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
				const assistantMessage: Message = {
					id: assistantMessageId,
					role: "assistant",
					content: "",
					isStreaming: true,
					createdAt: Date.now(),
				};

				setMessages((prev) => [...prev, assistantMessage]);

				let fullContent = "";

				for await (const event of streamChat(
					serverUrl,
					currentSessionId,
					content,
					authToken,
				)) {
					if (
						event.type === "message.delta" &&
						typeof event.data === "object" &&
						event.data !== null
					) {
						const delta = event.data as { content?: string };
						if (delta.content) {
							fullContent += delta.content;
							setMessages((prev) =>
								prev.map((msg) =>
									msg.id === assistantMessageId
										? { ...msg, content: fullContent }
										: msg,
								),
							);
						}
					}

					if (event.type === "message.complete") {
						setMessages((prev) =>
							prev.map((msg) =>
								msg.id === assistantMessageId
									? { ...msg, isStreaming: false }
									: msg,
							),
						);
					}
				}

				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === assistantMessageId
							? {
									...msg,
									isStreaming: false,
									content: fullContent || "I received your message.",
								}
							: msg,
					),
				);
			} catch (error) {
				const errorMessage: Message = {
					id: `error-${Date.now()}`,
					role: "assistant",
					content: `Error: ${error instanceof Error ? error.message : "Failed to send message"}`,
					createdAt: Date.now(),
				};
				setMessages((prev) => [...prev, errorMessage]);
			} finally {
				setIsLoading(false);
			}
		},
		[serverUrl, authToken, sessionId, isLoading, createSession],
	);

	const getStatusColor = () => {
		switch (connectionStatus) {
			case "connected":
				return "text-success";
			case "connecting":
				return "text-warning";
			case "disconnected":
				return "text-destructive";
		}
	};

	const getStatusText = () => {
		switch (connectionStatus) {
			case "connected":
				return "Connected";
			case "connecting":
				return "Connecting...";
			case "disconnected":
				return "Not connected";
		}
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
						<Text
							className={`font-mono text-xs ${getStatusColor()}`}
						>
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
						connectionStatus === "connected"
							? "Ask anything..."
							: "Connect to server first"
					}
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
