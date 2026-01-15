import MarkdownLib from "@ronradtke/react-native-markdown-display";
import type { ComponentType, ReactNode } from "react";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BrainIcon, ChevronDownIcon } from "@/components/icons";
import {
	FontSizes,
	Fonts,
	LineHeights,
	Radius,
	Spacing,
	typography,
	useTheme,
} from "@/theme";
import { OPACITY, withOpacity } from "@/utils/colors";

const Markdown = MarkdownLib as unknown as ComponentType<{
	style?: Record<string, unknown>;
	children?: ReactNode;
}>;

function ReasoningMarkdown({
	content,
	color,
}: {
	content: string;
	color: string;
}) {
	const { colors } = useTheme();

	const markdownStyles = {
		body: {
			color,
			fontFamily: Fonts.monoRegular,
			fontSize: FontSizes.code,
			lineHeight: FontSizes.code * LineHeights.normal,
			fontStyle: "italic" as const,
		},
		paragraph: {
			marginTop: 0,
			marginBottom: Spacing[1],
		},
		strong: {
			fontFamily: Fonts.monoSemiBold,
			fontStyle: "italic" as const,
		},
		em: {
			fontStyle: "italic" as const,
		},
		code_inline: {
			fontFamily: Fonts.monoRegular,
			fontSize: FontSizes.micro,
			backgroundColor: colors.muted,
			color: colors.foreground,
			paddingHorizontal: Spacing[1],
			borderRadius: Radius.sm,
			fontStyle: "normal" as const,
		},
		link: {
			color: colors.primary,
			textDecorationLine: "underline" as const,
		},
		bullet_list: {
			marginBottom: Spacing[1],
		},
		ordered_list: {
			marginBottom: Spacing[1],
		},
		list_item: {
			marginBottom: Spacing[0.5],
		},
	};

	return <Markdown style={markdownStyles}>{content}</Markdown>;
}

export interface ReasoningPartData {
	type: "reasoning";
	content?: string;
	isStreaming?: boolean;
}

interface ReasoningPartProps {
	part: ReasoningPartData;
}

function cleanReasoningText(text: string): string {
	if (typeof text !== "string" || text.trim().length === 0) {
		return "";
	}

	return text
		.split("\n")
		.map((line) => line.replace(/^>\s?/, "").trimEnd())
		.filter((line) => line.trim().length > 0)
		.join("\n")
		.trim();
}

function stripMarkdown(text: string): string {
	return text
		.replace(/\*\*(.+?)\*\*/g, "$1")
		.replace(/\*(.+?)\*/g, "$1")
		.replace(/__(.+?)__/g, "$1")
		.replace(/_(.+?)_/g, "$1")
		.replace(/~~(.+?)~~/g, "$1")
		.replace(/`(.+?)`/g, "$1")
		.replace(/\[(.+?)\]\(.+?\)/g, "$1")
		.replace(/^#{1,6}\s+/gm, "")
		.replace(/^[-*+]\s+/gm, "")
		.replace(/^\d+\.\s+/gm, "");
}

function getReasoningSummary(text: string): string {
	if (!text) return "";

	const trimmed = text.trim();
	const newlineIndex = trimmed.indexOf("\n");
	const periodIndex = trimmed.indexOf(".");

	const cutoffCandidates = [
		newlineIndex >= 0 ? newlineIndex : Infinity,
		periodIndex >= 0 ? periodIndex : Infinity,
	];
	const cutoff = Math.min(...cutoffCandidates);

	let summary: string;
	if (!Number.isFinite(cutoff)) {
		summary = trimmed;
	} else {
		summary = trimmed.substring(0, cutoff).trim();
	}

	return stripMarkdown(summary);
}

export function ReasoningPart({ part }: ReasoningPartProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const { colors } = useTheme();

	const rawContent = part.content || "";
	const textContent = useMemo(
		() => cleanReasoningText(rawContent),
		[rawContent],
	);
	const summary = useMemo(
		() => getReasoningSummary(textContent),
		[textContent],
	);

	if (!textContent || textContent.trim().length === 0) {
		return null;
	}

	return (
		<View className="my-0.5">
		<Pressable
			onPress={() => setIsExpanded(!isExpanded)}
			className="flex-row items-center py-1.5 px-0.5 gap-2"
			style={({ pressed }) => ({
				borderRadius: 10,
				paddingRight: 8,
				backgroundColor: pressed
					? withOpacity(colors.toolBackground, OPACITY.light)
					: "transparent",
			})}
		>

				<View className="flex-row items-center gap-2 shrink-0">
					<View className="w-3.5 h-3.5 items-center justify-center">
						{isExpanded ? (
							<ChevronDownIcon size={14} color={colors.mutedForeground} />
						) : (
							<BrainIcon size={14} color={colors.mutedForeground} />
						)}
					</View>
					<Text
						style={[
							typography.meta,
							{ color: colors.foreground, fontFamily: Fonts.medium },
						]}
					>
						Thinking
					</Text>
					{part.isStreaming && (
						<Text style={[typography.micro, { color: colors.mutedForeground }]}>
							...
						</Text>
					)}
				</View>

				{summary && !isExpanded && (
					<View className="flex-1 min-w-0">
						<Text
							style={[
								typography.meta,
								{
									color: withOpacity(colors.mutedForeground, OPACITY.secondary),
								},
							]}
							numberOfLines={1}
						>
							{summary}
						</Text>
					</View>
				)}
			</Pressable>

			{isExpanded && (
				<View
					className="ml-1.5 pl-4 py-1 border-l"
					style={{
						borderLeftColor: withOpacity(colors.border, OPACITY.strong),
					}}
				>
					<ReasoningMarkdown
						content={textContent + (part.isStreaming ? " ▊" : "")}
						color={withOpacity(colors.mutedForeground, OPACITY.secondary)}
					/>
				</View>
			)}
		</View>
	);
}
