import { FlashList } from "@shopify/flash-list";
import { useCallback, useRef } from "react";
import { Text, View } from "react-native";
import { ChatMessage } from "./ChatMessage";

export type Message = {
	id: string;
	role: "user" | "assistant";
	content: string;
	isStreaming?: boolean;
	parts?: MessagePart[];
	createdAt?: number;
};

export type MessagePart = {
	type: "text" | "tool-call" | "tool-result" | "reasoning";
	content: string;
	toolName?: string;
	isCollapsed?: boolean;
};

type MessageListProps = {
	messages: Message[];
	isLoading?: boolean;
};

function EmptyState() {
	return (
		<View className="flex-1 items-center justify-center px-8">
			<View className="mb-6 h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
				<Text className="text-4xl">💬</Text>
			</View>
			<Text className="text-center font-mono text-xl font-semibold text-foreground">
				Start a conversation
			</Text>
			<Text className="mt-2 text-center font-mono text-muted-foreground">
				Ask me anything about your code, or use @file to reference files
			</Text>
		</View>
	);
}

function LoadingIndicator() {
	return (
		<View className="px-4 py-2">
			<View className="max-w-[85%] rounded-2xl bg-card px-4 py-3">
				<Text className="font-mono text-muted-foreground">Thinking...</Text>
			</View>
		</View>
	);
}

export function MessageList({ messages, isLoading }: MessageListProps) {
	const listRef = useRef<FlashList<Message>>(null);

	const renderItem = useCallback(({ item }: { item: Message }) => {
		return <ChatMessage message={item} />;
	}, []);

	const keyExtractor = useCallback((item: Message) => item.id, []);

	const handleContentSizeChange = useCallback(() => {
		if (messages.length > 0) {
			listRef.current?.scrollToEnd({ animated: true });
		}
	}, [messages.length]);

	if (messages.length === 0 && !isLoading) {
		return <EmptyState />;
	}

	return (
		<FlashList
			ref={listRef}
			data={messages}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			estimatedItemSize={100}
			contentContainerStyle={{
				paddingTop: 16,
				paddingBottom: isLoading ? 8 : 16,
			}}
			onContentSizeChange={handleContentSizeChange}
			ListFooterComponent={isLoading ? <LoadingIndicator /> : null}
			showsVerticalScrollIndicator={false}
		/>
	);
}
