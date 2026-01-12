import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { FontFamilySans, FontSizes, fontStyle, Radius, Spacing, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";
import { MarkdownRenderer } from "../markdown/MarkdownRenderer";
import { MessageActionsMenu } from "./MessageActionsMenu";
import { useMessageActions } from "./useMessageActions";
import { ReasoningPart, ToolPart } from "./parts";
import { CopyIcon, UndoIcon, GitBranchIcon, CheckIcon } from "../icons";
import { ProviderLogo } from "../ui/ProviderLogo";
import { type Message, type MessagePart, inferProviderIdFromModelName } from "./types";

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

/**
 * Fallback provider symbol when logo fails to load
 */
function ProviderSymbol({ modelName, color }: { modelName?: string; color: string }) {
	const getSymbol = (name?: string): string => {
		if (!name) return "AI";
		const lower = name.toLowerCase();
		if (lower.includes("claude") || lower.includes("anthropic")) return "A\\";
		if (lower.includes("gpt") || lower.includes("openai") || lower.includes("o1") || lower.includes("o3")) return "O";
		if (lower.includes("gemini") || lower.includes("google")) return "G";
		if (lower.includes("mistral")) return "M";
		if (lower.includes("llama")) return "L";
		if (lower.includes("deepseek")) return "DS";
		if (lower.includes("groq")) return "Gr";
		if (lower.includes("xai") || lower.includes("grok")) return "X";
		return "AI";
	};

	return (
		<Text
			style={{
				fontFamily: FontFamilySans.semiBold,
				fontSize: FontSizes.micro,
				color,
			}}
		>
			{getSymbol(modelName)}
		</Text>
	);
}

/**
 * Provider logo with fallback to text symbol
 * Shows the provider's logo image if available, falls back to text symbol
 */
function MessageProviderLogo({ providerId, modelName }: { providerId?: string; modelName?: string }) {
	const { colors } = useTheme();
	const [logoLoaded, setLogoLoaded] = useState(false);
	const [logoError, setLogoError] = useState(false);
	const resolvedProviderId = providerId || inferProviderIdFromModelName(modelName);

	// Reset state when provider changes
	useEffect(() => {
		setLogoLoaded(false);
		setLogoError(false);
	}, [resolvedProviderId]);

	// If we can't determine the provider or logo failed, show the text fallback
	if (!resolvedProviderId || logoError) {
		return <ProviderSymbol modelName={modelName} color={colors.mutedForeground} />;
	}

	// Show both logo and text, hiding text once logo loads
	return (
		<View style={{ width: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
			{/* Text fallback - hidden once logo loads */}
			{!logoLoaded && (
				<ProviderSymbol modelName={modelName} color={colors.mutedForeground} />
			)}
			{/* Logo positioned on top */}
			<View
				style={{
					position: logoLoaded ? "relative" : "absolute",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<ProviderLogo
					providerId={resolvedProviderId}
					size={14}
					onLoad={() => setLogoLoaded(true)}
					onError={() => setLogoError(true)}
				/>
			</View>
		</View>
	);
}

type ChatMessageProps = {
	message: Message;
	onBranchSession?: (messageId: string) => void;
	onRevert?: (messageId: string) => void;
	onSelectSession?: (sessionId: string) => void;
	showHeader?: boolean;
};

function MessageActionButton({
	icon,
	onPress,
	accessibilityLabel,
}: {
	icon: React.ReactNode;
	onPress: () => void;
	accessibilityLabel: string;
}) {
	return (
		<Pressable
			onPress={onPress}
			accessibilityLabel={accessibilityLabel}
			style={{
				padding: Spacing[2.5],
				borderRadius: Radius.md,
				minWidth: Spacing[9],
				minHeight: Spacing[9],
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			{icon}
		</Pressable>
	);
}

function UserMessage({
	content,
	messageId,
	onRevert,
	onFork,
}: {
	content: string;
	messageId: string;
	onRevert?: (messageId: string) => void;
	onFork?: (messageId: string) => void;
}) {
	const { colors, isDark } = useTheme();
	const { showMenu, messageLayout, bubbleRef, openMenu, closeMenu, copyMessageContent } =
		useMessageActions();
	const [copied, setCopied] = useState(false);
	const [showActions, setShowActions] = useState(false);
	const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const bubbleBackground = withOpacity(colors.primary, isDark ? OPACITY.light : OPACITY.selected);

	const handleCopy = () => {
		copyMessageContent(content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handlePress = () => {
		// Clear any existing timeout
		if (hideTimeoutRef.current) {
			clearTimeout(hideTimeoutRef.current);
		}

		setShowActions((prev) => !prev);

		// Auto-hide after 4 seconds if showing
		if (!showActions) {
			hideTimeoutRef.current = setTimeout(() => {
				setShowActions(false);
			}, 4000);
		}
	};

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (hideTimeoutRef.current) {
				clearTimeout(hideTimeoutRef.current);
			}
		};
	}, []);

	return (
		<View className="mb-2 px-3">
			<Pressable
				onPress={handlePress}
				onLongPress={openMenu}
				className="flex-row justify-end items-start gap-2"
			>
				<View
					ref={bubbleRef}
					className="px-3 py-2"
					style={{
						maxWidth: "85%",
						backgroundColor: bubbleBackground,
						borderRadius: Radius.xl,
						borderBottomRightRadius: Radius.sm,
					}}
				>
					<Text style={[typography.body, { color: colors.foreground }]}>
						{content}
					</Text>
				</View>
			</Pressable>
			{/* Inline action icons - only shown when message is pressed */}
			{showActions && (
				<View className="flex-row justify-end items-center gap-1 mt-1">
					{onRevert && (
						<MessageActionButton
							icon={<UndoIcon size={14} color={colors.mutedForeground} />}
							onPress={() => onRevert(messageId)}
							accessibilityLabel="Revert to this message"
						/>
					)}
					{onFork && (
						<MessageActionButton
							icon={<GitBranchIcon size={14} color={colors.mutedForeground} />}
							onPress={() => onFork(messageId)}
							accessibilityLabel="Fork from this message"
						/>
					)}
					<MessageActionButton
						icon={copied
							? <CheckIcon size={14} color={colors.primary} />
							: <CopyIcon size={14} color={colors.mutedForeground} />
						}
						onPress={handleCopy}
						accessibilityLabel="Copy message"
					/>
				</View>
			)}
			<MessageActionsMenu
				visible={showMenu}
				onClose={closeMenu}
				onCopy={handleCopy}
				onRevert={onRevert ? () => onRevert(messageId) : undefined}
				onBranchSession={onFork ? () => onFork(messageId) : undefined}
				isAssistantMessage={false}
				messageLayout={messageLayout}
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
	onSelectSession,
}: {
	part: MessagePart;
	index: number;
	messageId: string;
	isLastPart: boolean;
	isStreaming: boolean;
	onSelectSession?: (sessionId: string) => void;
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
						sessionId: part.sessionId,
					}}
					onSelectSession={onSelectSession}
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
				<View style={{ marginBottom: Spacing[1] }}>
					<MarkdownRenderer content={textContent} />
					{isLastPart && isStreaming && (
						<Text style={{ marginLeft: Spacing[0.5], color: colors.primary }}>▊</Text>
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
	onRevert,
	onSelectSession,
	showHeader = true,
}: {
	message: Message;
	onBranchSession?: (messageId: string) => void;
	onRevert?: (messageId: string) => void;
	onSelectSession?: (sessionId: string) => void;
	showHeader?: boolean;
}) {
	const { colors } = useTheme();
	const hasParts = message.parts && message.parts.length > 0;
	const isStreaming = message.isStreaming ?? false;
	const { showMenu, messageLayout, bubbleRef, openMenu, closeMenu, copyMessageContent } =
		useMessageActions();
	const [copied, setCopied] = useState(false);

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

	const handleCopy = () => {
		copyMessageContent(getTextContent());
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const agentPalette = [
		colors.info,
		colors.success,
		colors.warning,
		colors.destructive,
		colors.primary,
		colors.infoForeground,
		colors.successForeground,
		colors.warningForeground,
	];

	const getAgentColor = (name: string) => {
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
		}
		return agentPalette[Math.abs(hash) % agentPalette.length];
	};

	// Only show action icons when message is complete (not streaming)
	const showActionIcons = !isStreaming && getTextContent().trim().length > 0;

	return (
		<View className="mb-2 px-3">
			{showHeader && (
				<View className="flex-row items-center gap-1.5 mb-2 pl-3">
					<View className="items-center justify-center">
						<MessageProviderLogo providerId={message.providerId} modelName={modelName} />
					</View>
					<Text
						style={[
							typography.uiLabel,
							fontStyle("500"),
							{ color: colors.foreground },
						]}
						numberOfLines={1}
					>
						{modelName || "Assistant"}
					</Text>


					{agentName && (() => {
						const agentColor = getAgentColor(agentName);
						return (
							<View
								className="px-1.5 py-0 rounded"
								style={{ backgroundColor: withOpacity(agentColor, OPACITY.emphasized) }}
							>
								<Text
									style={[
										typography.micro,
										fontStyle("500"),
										{ color: agentColor },
									]}
								>
									{agentName}
								</Text>
							</View>
						);
					})()}

				</View>
			)}

			<View ref={bubbleRef} style={{ paddingLeft: Spacing[3] }}>
				{hasParts ? (
					message.parts!.map((part, idx) => (
						<RenderPart
							key={`${message.id}-part-${idx}`}
							part={part}
							index={idx}
							messageId={message.id}
							isLastPart={idx === message.parts!.length - 1}
							isStreaming={isStreaming}
							onSelectSession={onSelectSession}
						/>
					))
				) : (
					<Pressable onLongPress={openMenu}>
						<View style={{ marginBottom: Spacing[1] }}>
							<MarkdownRenderer content={message.content} />
							{isStreaming && (
								<Text style={{ marginLeft: Spacing[0.5], color: colors.primary }}>▊</Text>
							)}
						</View>
					</Pressable>
				)}
			</View>
			{/* Inline action icons for assistant messages */}
			{showActionIcons && (
				<View className="flex-row items-center gap-1 mt-1 pl-3">
					{onBranchSession && (
						<MessageActionButton
							icon={<GitBranchIcon size={14} color={colors.mutedForeground} />}
							onPress={() => onBranchSession(message.id)}
							accessibilityLabel="Start new session from this answer"
						/>
					)}
					<MessageActionButton
						icon={copied
							? <CheckIcon size={14} color={colors.primary} />
							: <CopyIcon size={14} color={colors.mutedForeground} />
						}
						onPress={handleCopy}
						accessibilityLabel="Copy answer"
					/>
				</View>
			)}
			<MessageActionsMenu
				visible={showMenu}
				onClose={closeMenu}
				onCopy={handleCopy}
				onRevert={onRevert ? () => onRevert(message.id) : undefined}
				onBranchSession={
					onBranchSession ? () => onBranchSession(message.id) : undefined
				}
				isAssistantMessage={true}
				messageLayout={messageLayout}
			/>
		</View>
	);
}

export function ChatMessage({
	message,
	onBranchSession,
	onRevert,
	onSelectSession,
	showHeader = true,
}: ChatMessageProps) {
	if (message.role === "user") {
		return (
			<UserMessage
				content={message.content}
				messageId={message.id}
				onRevert={onRevert}
				onFork={onBranchSession}
			/>
		);
	}

	return (
		<AssistantMessage
			message={message}
			onBranchSession={onBranchSession}
			onRevert={onRevert}
			onSelectSession={onSelectSession}
			showHeader={showHeader}
		/>
	);
}
