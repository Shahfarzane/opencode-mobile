import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Message } from "../../src/components/chat";
import { ChatInput, MessageList } from "../../src/components/chat";
import { streamChat } from "../../src/lib/streaming";

const STORAGE_KEYS = {
	SERVER_URL: "openchamber_server_url",
	AUTH_TOKEN: "openchamber_auth_token",
} as const;

export default function ChatScreen() {
	const insets = useSafeAreaInsets();
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [serverUrl, setServerUrl] = useState<string | null>(null);
	const [authToken, setAuthToken] = useState<string | null>(null);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [connectionStatus, setConnectionStatus] = useState<
		"connecting" | "connected" | "disconnected"
	>("connecting");

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

	const createSession = useCallback(async (): Promise<string> => {
		if (!serverUrl || !authToken) {
			throw new Error("Not connected to server");
		}

		const response = await fetch(`${serverUrl}/api/session`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${authToken}`,
			},
		});

		if (!response.ok) {
			throw new Error("Failed to create session");
		}

		const data = await response.json();
		return data.id;
	}, [serverUrl, authToken]);

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
				<Text className="text-center font-mono text-lg font-semibold text-foreground">
					OpenChamber
				</Text>
				<Text className={`text-center font-mono text-xs ${getStatusColor()}`}>
					{getStatusText()}
				</Text>
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
		</KeyboardAvoidingView>
	);
}
