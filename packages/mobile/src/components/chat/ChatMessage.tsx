import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
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

function UserIcon({ color }: { color: string }) {
	return (
		<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
			<Path
				d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

// Brain icon for assistant messages (matching desktop's RiBrainAi3Line)
function BrainIcon({ color }: { color: string }) {
	return (
		<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
			<Path
				d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 19.5V4.5zM12 4.5a2.5 2.5 0 0 1 4.96-.46 2.5 2.5 0 0 1 1.98 3 2.5 2.5 0 0 1 1.32 4.24 3 3 0 0 1-.34 5.58 2.5 2.5 0 0 1-2.96 3.08A2.5 2.5 0 0 1 12 19.5"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
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

	// Desktop uses bg-primary/10 for light mode, bg-primary/8 for dark
	const bubbleBackground = isDark
		? `${colors.primary}14` // ~8% opacity
		: `${colors.primary}1A`; // ~10% opacity

	return (
		<View style={styles.userMessageContainer}>
			<Pressable onLongPress={openMenu} style={styles.userMessageWrapper}>
				{/* Message bubble only - no avatar, matching desktop design */}
				<View
					style={[styles.userBubble, { backgroundColor: bubbleBackground }]}
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
	const { colors, isDark } = useTheme();
	const hasParts = message.parts && message.parts.length > 0;
	const isStreaming = message.isStreaming ?? false;
	const { showMenu, openMenu, closeMenu, copyMessageContent } =
		useMessageActions();

	// Extract model/agent info from message if available
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

	// Get agent color based on name hash (matching desktop)
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
			{/* Message header with brain icon and model info - matching desktop */}
			{showHeader && (
				<View style={styles.assistantHeader}>
					<View style={styles.assistantAvatarSmall}>
						<BrainIcon color={colors.mutedForeground} />
					</View>
					<Text
						style={[
							typography.uiLabel,
							styles.assistantName,
							{ color: colors.foreground },
						]}
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
								typing...
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

const styles = StyleSheet.create({
	// User message styles - right aligned like desktop
	userMessageContainer: {
		marginBottom: 8,
		paddingHorizontal: 16,
	},
	userMessageWrapper: {
		flexDirection: "row",
		justifyContent: "flex-end",
		alignItems: "flex-start",
		gap: 8,
	},
	userAvatar: {
		width: 32,
		height: 32,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	userBubble: {
		maxWidth: "80%",
		borderRadius: 16,
		borderBottomRightRadius: 4, // Sharp corner on bottom-right like desktop
		paddingHorizontal: 14,
		paddingVertical: 10,
	},

	// Assistant message styles - left aligned, no bubble
	assistantMessageContainer: {
		marginBottom: 16,
		paddingHorizontal: 16,
	},
	assistantHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 8,
		paddingLeft: 4,
	},
	assistantAvatar: {
		width: 28,
		height: 28,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	assistantAvatarSmall: {
		// Small icon without background - matching desktop MessageHeader
		alignItems: "center",
		justifyContent: "center",
	},
	assistantName: {
		fontWeight: "600",
	},
	agentBadge: {
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
	},
	streamingBadge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 6,
	},
	assistantContent: {
		width: "100%",
		paddingLeft: 4,
	},
	textContainer: {
		// No background - text flows naturally like desktop
		marginBottom: 4,
	},
	cursor: {
		marginLeft: 2,
	},
});
