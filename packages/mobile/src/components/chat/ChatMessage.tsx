import { Text, View } from "react-native";
import { MarkdownRenderer } from "../markdown/MarkdownRenderer";
import type { Message, MessagePart } from "./types";
import { ReasoningPart, ToolPart } from "./parts";

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

function getToolState(part: MessagePart): "pending" | "running" | "completed" | "error" | "aborted" | undefined {
	if (!part.state) return undefined;
	if (typeof part.state === "string") return part.state as "pending" | "running" | "completed" | "error" | "aborted";
	return part.state.status;
}

function getToolInput(part: MessagePart): Record<string, unknown> | undefined {
	if (part.input) return part.input;
	if (part.state && typeof part.state === "object") return part.state.input;
	return undefined;
}

function getToolOutput(part: MessagePart): string | undefined {
	if (part.output) return part.output;
	if (part.state && typeof part.state === "object") return part.state.output;
	return undefined;
}

function getToolError(part: MessagePart): string | undefined {
	if (part.error) return part.error;
	if (part.state && typeof part.state === "object") return part.state.error;
	return undefined;
}

function renderPart(part: MessagePart, index: number, messageId: string, isLastPart: boolean, isStreaming: boolean) {
	const partKey = `${messageId}-part-${index}-${part.type}-${part.id || ""}`;

	if (part.type === "tool" || part.type === "tool-call" || part.type === "tool-result") {
		return (
			<ToolPart
				key={partKey}
				part={{
					type: part.type,
					toolName: part.toolName || part.tool,
					toolId: part.toolId || part.callID,
					state: getToolState(part),
					content: part.content,
					input: getToolInput(part),
					output: getToolOutput(part),
					error: getToolError(part),
				}}
			/>
		);
	}

	if (part.type === "reasoning") {
		const reasoningContent = part.content || part.text;
		return (
			<ReasoningPart
				key={partKey}
				part={{
					type: "reasoning",
					content: reasoningContent,
					isStreaming: isLastPart && isStreaming,
				}}
			/>
		);
	}

	if (part.type === "text") {
		const textContent = part.content || part.text;
		if (!textContent) return null;
		
		return (
			<View key={partKey} className="rounded-2xl bg-card px-4 py-3 mb-2">
				<MarkdownRenderer content={textContent} />
				{isLastPart && isStreaming && (
					<Text className="text-muted-foreground">▊</Text>
				)}
			</View>
		);
	}

	return null;
}

function AssistantMessage({ message }: { message: Message }) {
	const hasParts = message.parts && message.parts.length > 0;
	const isStreaming = message.isStreaming ?? false;

	return (
		<View className="mb-4 items-start px-4">
			<View className="max-w-[90%]">
				{hasParts ? (
					message.parts!.map((part, idx) =>
						renderPart(part, idx, message.id, idx === message.parts!.length - 1, isStreaming)
					)
				) : (
					<View className="rounded-2xl bg-card px-4 py-3">
						<MarkdownRenderer content={message.content} />
						{isStreaming && <Text className="text-muted-foreground">▊</Text>}
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
