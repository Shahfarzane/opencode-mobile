import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { MarkdownRenderer } from "../markdown/MarkdownRenderer";
import type { Message, MessagePart } from "./MessageList";

type ChatMessageProps = {
	message: Message;
};

function UserMessage({ content }: { content: string }) {
	return (
		<View className="mb-4 items-end px-4">
			<View className="max-w-[85%] rounded-2xl bg-primary px-4 py-3">
				<Text className="font-mono text-base text-primary-foreground">
					{content}
				</Text>
			</View>
		</View>
	);
}

function ToolCallPart({ part }: { part: MessagePart }) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<Pressable
			onPress={() => setIsExpanded(!isExpanded)}
			className="mb-2 rounded-lg border border-border bg-muted px-3 py-2"
		>
			<View className="flex-row items-center gap-2">
				<Text className="font-mono text-xs text-info">⚡</Text>
				<Text className="flex-1 font-mono text-sm text-muted-foreground">
					{part.toolName || "Tool call"}
				</Text>
				<Text className="font-mono text-xs text-muted-foreground">
					{isExpanded ? "▼" : "▶"}
				</Text>
			</View>
			{isExpanded && (
				<View className="mt-2 rounded bg-background p-2">
					<Text className="font-mono text-xs text-muted-foreground">
						{part.content}
					</Text>
				</View>
			)}
		</Pressable>
	);
}

function ReasoningPart({ part }: { part: MessagePart }) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<Pressable
			onPress={() => setIsExpanded(!isExpanded)}
			className="mb-2 rounded-lg border border-border/50 bg-muted/50 px-3 py-2"
		>
			<View className="flex-row items-center gap-2">
				<Text className="font-mono text-xs text-warning">💭</Text>
				<Text className="flex-1 font-mono text-sm text-muted-foreground">
					Reasoning
				</Text>
				<Text className="font-mono text-xs text-muted-foreground">
					{isExpanded ? "▼" : "▶"}
				</Text>
			</View>
			{isExpanded && (
				<View className="mt-2">
					<Text className="font-mono text-sm text-muted-foreground">
						{part.content}
					</Text>
				</View>
			)}
		</Pressable>
	);
}

function AssistantMessage({ message }: { message: Message }) {
	const hasParts = message.parts && message.parts.length > 0;

	return (
		<View className="mb-4 items-start px-4">
			<View className="max-w-[90%]">
				{hasParts ? (
					message.parts!.map((part, partIndex) => {
						const partKey = `${message.id}-part-${partIndex}-${part.type}`;
						if (part.type === "tool-call" || part.type === "tool-result") {
							return <ToolCallPart key={partKey} part={part} />;
						}
						if (part.type === "reasoning") {
							return <ReasoningPart key={partKey} part={part} />;
						}
						return (
							<View key={partKey} className="rounded-2xl bg-card px-4 py-3">
								<MarkdownRenderer content={part.content} />
								{message.isStreaming &&
									partIndex === message.parts!.length - 1 && (
										<Text className="text-muted-foreground">▊</Text>
									)}
							</View>
						);
					})
				) : (
					<View className="rounded-2xl bg-card px-4 py-3">
						<MarkdownRenderer content={message.content} />
						{message.isStreaming && (
							<Text className="text-muted-foreground">▊</Text>
						)}
					</View>
				)}
			</View>
		</View>
	);
}

export function ChatMessage({ message }: ChatMessageProps) {
	if (message.role === "user") {
		return <UserMessage content={message.content} />;
	}

	return <AssistantMessage message={message} />;
}
