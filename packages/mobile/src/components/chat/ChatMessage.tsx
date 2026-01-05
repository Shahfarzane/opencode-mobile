import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { MarkdownRenderer } from "../markdown/MarkdownRenderer";
import type { Message, MessagePart } from "./types";
import { ReasoningPart, ToolPart } from "./parts";
import { useTheme, typography } from "@/theme";
import { MessageActionsMenu, useMessageActions } from "./MessageActionsMenu";

function FadeInView({ children, isNew }: { children: React.ReactNode; isNew: boolean }) {
	const fadeAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;

	useEffect(() => {
		if (isNew) {
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			}).start();
		}
	}, [fadeAnim, isNew]);

	return (
		<Animated.View style={{ opacity: fadeAnim }}>
			{children}
		</Animated.View>
	);
}

type ChatMessageProps = {
	message: Message;
	onBranchSession?: (messageId: string) => void;
};

function UserMessage({ content }: { content: string }) {
	const { colors } = useTheme();
	const { showMenu, openMenu, closeMenu, copyMessageContent } = useMessageActions();
	
	return (
		<View style={styles.userMessageContainer}>
			<Pressable onLongPress={openMenu}>
				<View style={[styles.userBubble, { backgroundColor: colors.primary }]}>
					<Text style={[typography.body, { color: colors.primaryForeground }]}>
						{content}
					</Text>
				</View>
			</Pressable>
			<MessageActionsMenu
				visible={showMenu}
				onClose={closeMenu}
				onCopy={() => copyMessageContent(content)}
				isAssistantMessage={false}
			/>
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

function RenderPart({ 
	part, 
	index, 
	messageId, 
	isLastPart, 
	isStreaming 
}: { 
	part: MessagePart; 
	index: number; 
	messageId: string; 
	isLastPart: boolean; 
	isStreaming: boolean;
}) {
	const { colors } = useTheme();
	const partKey = `${messageId}-part-${index}-${part.type}-${part.id || ""}`;

	if (part.type === "tool" || part.type === "tool-call" || part.type === "tool-result") {
		return (
			<FadeInView key={partKey} isNew={isStreaming}>
				<ToolPart
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
			</FadeInView>
		);
	}

	if (part.type === "reasoning") {
		const reasoningContent = part.content || part.text;
		return (
			<FadeInView key={partKey} isNew={isStreaming}>
				<ReasoningPart
					part={{
						type: "reasoning",
						content: reasoningContent,
						isStreaming: isLastPart && isStreaming,
					}}
				/>
			</FadeInView>
		);
	}

	if (part.type === "text") {
		const textContent = part.content || part.text;
		if (!textContent) return null;
		
		return (
			<FadeInView key={partKey} isNew={isLastPart && isStreaming}>
				<View style={[styles.textBubble, { backgroundColor: colors.card }]}>
					<MarkdownRenderer content={textContent} />
					{isLastPart && isStreaming && (
						<Text style={{ color: colors.mutedForeground }}>▊</Text>
					)}
				</View>
			</FadeInView>
		);
	}

	return null;
}

function AssistantMessage({ 
	message, 
	onBranchSession 
}: { 
	message: Message; 
	onBranchSession?: (messageId: string) => void;
}) {
	const { colors } = useTheme();
	const hasParts = message.parts && message.parts.length > 0;
	const isStreaming = message.isStreaming ?? false;
	const { showMenu, openMenu, closeMenu, copyMessageContent } = useMessageActions();

	const getTextContent = (): string => {
		if (hasParts) {
			return message.parts!
				.filter(part => part.type === "text")
				.map(part => part.content || part.text || "")
				.join("\n");
		}
		return message.content;
	};

	return (
		<View style={styles.assistantMessageContainer}>
			<Pressable onLongPress={openMenu} style={styles.assistantContent}>
				{hasParts ? (
					message.parts!.map((part, idx) => (
						<RenderPart 
							key={`${message.id}-part-${idx}`}
							part={part}
							index={idx}
							messageId={message.id}
							isLastPart={idx === message.parts!.length - 1}
							isStreaming={isStreaming}
						/>
					))
				) : (
					<View style={[styles.textBubble, { backgroundColor: colors.card }]}>
						<MarkdownRenderer content={message.content} />
						{isStreaming && <Text style={{ color: colors.mutedForeground }}>▊</Text>}
					</View>
				)}
			</Pressable>
			<MessageActionsMenu
				visible={showMenu}
				onClose={closeMenu}
				onCopy={() => copyMessageContent(getTextContent())}
				onBranchSession={onBranchSession ? () => onBranchSession(message.id) : undefined}
				isAssistantMessage={true}
			/>
		</View>
	);
}

export function ChatMessage({ message, onBranchSession }: ChatMessageProps) {
	if (message.role === "user") {
		return <UserMessage content={message.content} />;
	}

	return <AssistantMessage message={message} onBranchSession={onBranchSession} />;
}

const styles = StyleSheet.create({
	userMessageContainer: {
		marginBottom: 16,
		alignItems: 'flex-end',
		paddingHorizontal: 16,
	},
	userBubble: {
		maxWidth: '85%',
		borderRadius: 12,      // Match desktop rounded-xl (was 16)
		paddingHorizontal: 12, // Consistent padding
		paddingVertical: 12,
	},
	assistantMessageContainer: {
		marginBottom: 16,
		alignItems: 'flex-start',
		paddingHorizontal: 16,
	},
	assistantContent: {
		width: '100%',         // Full width for assistant (no maxWidth)
	},
	textBubble: {
		borderRadius: 12,      // Match desktop rounded-xl (was 16)
		paddingHorizontal: 12, // Consistent padding
		paddingVertical: 12,
		marginBottom: 8,
	},
});
