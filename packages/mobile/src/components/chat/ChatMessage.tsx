import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { typography, useTheme } from "@/theme";
import { MarkdownRenderer } from "../markdown/MarkdownRenderer";
import { MessageActionsMenu, useMessageActions } from "./MessageActionsMenu";
import { ReasoningPart, ToolPart } from "./parts";
import type { Message, MessagePart } from "./types";

function FadeInView({
	children,
	isNew,
}: {
	children: React.ReactNode;
	isNew: boolean;
}) {
	const fadeAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
	const translateAnim = useRef(new Animated.Value(isNew ? 8 : 0)).current;

	useEffect(() => {
		if (isNew) {
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(translateAnim, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [fadeAnim, translateAnim, isNew]);

	return (
		<Animated.View
			style={{
				opacity: fadeAnim,
				transform: [{ translateY: translateAnim }],
			}}
		>
			{children}
		</Animated.View>
	);
}

function ProviderLogo({ modelName, color }: { modelName?: string; color: string }) {
	const getProviderSymbol = (name?: string): string => {
		if (!name) return "AI";
		const lower = name.toLowerCase();
		if (lower.includes("claude") || lower.includes("anthropic")) return "A\\";
		if (lower.includes("gpt") || lower.includes("openai")) return "O";
		if (lower.includes("gemini") || lower.includes("google")) return "G";
		if (lower.includes("mistral")) return "M";
		if (lower.includes("llama")) return "L";
		if (lower.includes("deepseek")) return "DS";
		return "AI";
	};

	return (
		<Text
			style={{
				fontFamily: "IBMPlexMono-SemiBold",
				fontSize: 12,
				color,
			}}
		>
			{getProviderSymbol(modelName)}
		</Text>
	);
}

type ChatMessageProps = {
	message: Message;
	onBranchSession?: (messageId: string) => void;
	showHeader?: boolean;
};

function UserMessage({ content }: { content: string }) {
	const { colors, isDark } = useTheme();
	const { showMenu, openMenu, closeMenu, copyMessageContent } =
		useMessageActions();

	const bubbleBackground = isDark
		? `${colors.primary}14`
		: `${colors.primary}1A`;

	return (
		<View style={styles.userMessageContainer}>
			<Pressable onLongPress={openMenu} style={styles.userMessageWrapper}>
				<View
					style={[
						styles.userBubble,
						{
							backgroundColor: bubbleBackground,
							borderRadius: 12, // rounded-xl
							borderBottomRightRadius: 2, // rounded-br-xs
						},
					]}
				>
					<Text style={[typography.body, { color: colors.foreground }]}>
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

function getToolState(
	part: MessagePart,
): "pending" | "running" | "completed" | "error" | "aborted" | undefined {
	if (!part.state) return undefined;
	if (typeof part.state === "string")
		return part.state as
			| "pending"
			| "running"
			| "completed"
			| "error"
			| "aborted";
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
	isStreaming,
}: {
	part: MessagePart;
	index: number;
	messageId: string;
	isLastPart: boolean;
	isStreaming: boolean;
}) {
	const { colors } = useTheme();
	const partKey = `${messageId}-part-${index}-${part.type}-${part.id || ""}`;

	if (
		part.type === "tool" ||
		part.type === "tool-call" ||
		part.type === "tool-result"
	) {
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
				<View style={styles.textContainer}>
					<MarkdownRenderer content={textContent} />
					{isLastPart && isStreaming && (
						<Text style={[styles.cursor, { color: colors.primary }]}>▊</Text>
					)}
				</View>
			</FadeInView>
		);
	}

	return null;
}

function AssistantMessage({
	message,
	onBranchSession,
	showHeader = true,
}: {
	message: Message;
	onBranchSession?: (messageId: string) => void;
	showHeader?: boolean;
}) {
	const { colors } = useTheme();
	const hasParts = message.parts && message.parts.length > 0;
	const isStreaming = message.isStreaming ?? false;
	const { showMenu, openMenu, closeMenu, copyMessageContent } =
		useMessageActions();

	const modelName = message.modelName;
	const agentName = message.agentName;

	const getTextContent = (): string => {
		if (hasParts) {
			return message
				.parts!.filter((part) => part.type === "text")
				.map((part) => part.content || part.text || "")
				.join("\n");
		}
		return message.content;
	};

	const getAgentColor = (name: string) => {
		const agentColors = [
			"#3B82F6", "#10B981", "#F59E0B", "#EF4444",
			"#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
		];
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
		}
		return agentColors[Math.abs(hash) % agentColors.length];
	};

	return (
		<View style={styles.assistantMessageContainer}>
			{showHeader && (
				<View style={styles.assistantHeader}>
					<View style={styles.assistantAvatarSmall}>
						<ProviderLogo modelName={modelName} color={colors.mutedForeground} />
					</View>
					<Text
						style={[
							typography.uiHeader, // Use header style for bold weight
							styles.assistantName,
							{ color: colors.foreground },
						]}
						numberOfLines={1}
					>
						{modelName || "Assistant"}
					</Text>
					{agentName && (
						<View
							style={[
								styles.agentBadge,
								{ backgroundColor: `${getAgentColor(agentName)}20` },
							]}
						>
							<Text
								style={[
									typography.micro,
									{ color: getAgentColor(agentName), fontWeight: "500" },
								]}
							>
								{agentName}
							</Text>
						</View>
					)}
					{isStreaming && (
						<View
							style={[
								styles.streamingBadge,
								{ backgroundColor: `${colors.primary}20` },
							]}
						>
							<Text style={[typography.micro, { color: colors.primary }]}>
								Working...
							</Text>
						</View>
					)}
				</View>
			)}

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
					<View style={styles.textContainer}>
						<MarkdownRenderer content={message.content} />
						{isStreaming && (
							<Text style={[styles.cursor, { color: colors.primary }]}>▊</Text>
						)}
					</View>
				)}
			</Pressable>
			<MessageActionsMenu
				visible={showMenu}
				onClose={closeMenu}
				onCopy={() => copyMessageContent(getTextContent())}
				onBranchSession={
					onBranchSession ? () => onBranchSession(message.id) : undefined
				}
				isAssistantMessage={true}
			/>
		</View>
	);
}

export function ChatMessage({
	message,
	onBranchSession,
	showHeader = true,
}: ChatMessageProps) {
	if (message.role === "user") {
		return <UserMessage content={message.content} />;
	}

	return (
		<AssistantMessage
			message={message}
			onBranchSession={onBranchSession}
			showHeader={showHeader}
		/>
	);
}

// Desktop-aligned spacing constants
const DESKTOP_MESSAGE_SPACING = {
	containerPaddingH: 12, // Match desktop's chat-column padding
	bubbleRadius: 12, // rounded-xl
	bubbleRadiusCutout: 2, // rounded-br-xs
	bubblePaddingH: 14, // px-3.5
	bubblePaddingTop: 10, // pt-2.5
	bubblePaddingBottom: 6, // pb-1.5
	headerPaddingLeft: 12, // pl-3
	headerGap: 8, // gap-2
	headerMarginBottom: 8, // mb-2
	agentBadgePaddingH: 6, // px-1.5
	agentBadgePaddingV: 0, // py-0
	agentBadgeRadius: 4, // rounded
};

const styles = StyleSheet.create({
	userMessageContainer: {
		marginBottom: 8,
		paddingHorizontal: DESKTOP_MESSAGE_SPACING.containerPaddingH,
	},
	userMessageWrapper: {
		flexDirection: "row",
		justifyContent: "flex-end",
		alignItems: "flex-start",
		gap: 8,
	},
	userBubble: {
		maxWidth: "85%",
		paddingHorizontal: DESKTOP_MESSAGE_SPACING.bubblePaddingH,
		paddingTop: DESKTOP_MESSAGE_SPACING.bubblePaddingTop,
		paddingBottom: DESKTOP_MESSAGE_SPACING.bubblePaddingBottom,
	},

	assistantMessageContainer: {
		marginBottom: 16,
		paddingHorizontal: DESKTOP_MESSAGE_SPACING.containerPaddingH,
	},
	assistantHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: DESKTOP_MESSAGE_SPACING.headerGap,
		marginBottom: DESKTOP_MESSAGE_SPACING.headerMarginBottom,
		paddingLeft: DESKTOP_MESSAGE_SPACING.headerPaddingLeft,
	},
	assistantAvatar: {
		width: 28,
		height: 28,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	assistantAvatarSmall: {
		alignItems: "center",
		justifyContent: "center",
	},
	assistantName: {
		fontWeight: "700", // font-bold
	},
	agentBadge: {
		paddingHorizontal: DESKTOP_MESSAGE_SPACING.agentBadgePaddingH,
		paddingVertical: DESKTOP_MESSAGE_SPACING.agentBadgePaddingV,
		borderRadius: DESKTOP_MESSAGE_SPACING.agentBadgeRadius,
	},
	streamingBadge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 6,
	},
	assistantContent: {
		width: "100%",
		paddingLeft: DESKTOP_MESSAGE_SPACING.headerPaddingLeft,
	},
	textContainer: {
		marginBottom: 4,
	},
	cursor: {
		marginLeft: 2,
	},
});
