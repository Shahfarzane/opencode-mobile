import MarkdownLib from "@ronradtke/react-native-markdown-display";
import type { ComponentType, ReactNode } from "react";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Fonts, FontSizes, LineHeights, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";

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
			marginBottom: 4,
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
			paddingHorizontal: 4,
			borderRadius: 2,
			fontStyle: "normal" as const,
		},
		link: {
			color: colors.primary,
			textDecorationLine: "underline" as const,
		},
		bullet_list: {
			marginBottom: 4,
		},
		ordered_list: {
			marginBottom: 4,
		},
		list_item: {
			marginBottom: 2,
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

function BrainIcon({ size = 14, color }: { size?: number; color: string }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
			<Path d="M3.29921 5.28989C4.52511 3.30505 6.7498 2 9.22024 2C9.67399 2 10.118 2.04031 10.5481 2.1176C11.0065 2.03457 11.4777 1.99158 11.9581 1.99158C14.5726 1.99158 16.8918 3.36693 18.0882 5.41958L18.1093 5.45529C19.6819 5.86194 21.0002 7.26834 21.0002 9.2C21.0002 9.77295 20.8882 10.321 20.6859 10.8244C21.3326 11.6715 21.7156 12.7306 21.7156 13.8811C21.7156 16.0098 20.2309 17.8029 18.2329 18.3304L18.231 18.3309C17.9246 20.2867 16.1946 21.7811 14.1156 21.7811C13.2471 21.7811 12.4416 21.5135 11.7769 21.0556L11.776 21.055C11.5174 21.2085 11.2422 21.3378 10.9538 21.4398C10.2595 21.6857 9.5159 21.8194 8.74138 21.8194C6.46568 21.8194 4.50411 20.5258 3.52952 18.6409C2.19003 18.1098 1.18799 16.9393 1.01127 15.5144C0.418411 14.7887 0.0581055 13.8622 0.0581055 12.8497C0.0581055 11.8303 0.423051 10.8978 1.02388 10.1685C1.0132 10.0506 1.00781 9.93139 1.00781 9.81106C1.00781 7.71023 2.27139 5.91215 4.06626 5.19399C3.76696 5.23203 3.51749 5.25879 3.29921 5.28989ZM5.82422 7.06119C6.16469 6.95645 6.52612 6.9 6.90101 6.9C8.26632 6.9 9.40102 7.78387 9.70102 9H7.58622C7.31008 8.42135 6.72043 8.02121 6.03851 8.00155L5.82422 7.06119ZM11.75 9.5C12.1642 9.5 12.5 9.83579 12.5 10.25V13.5H15.75C16.1642 13.5 16.5 13.8358 16.5 14.25C16.5 14.6642 16.1642 15 15.75 15H12.5V18.25C12.5 18.6642 12.1642 19 11.75 19C11.3358 19 11 18.6642 11 18.25V15H7.75C7.33579 15 7 14.6642 7 14.25C7 13.8358 7.33579 13.5 7.75 13.5H11V10.25C11 9.83579 11.3358 9.5 11.75 9.5Z" />
		</Svg>
	);
}

function ChevronDownIcon({
	size = 14,
	color,
}: {
	size?: number;
	color: string;
}) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
			<Path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z" />
		</Svg>
	);
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
								{ color: withOpacity(colors.mutedForeground, OPACITY.secondary) },
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
					style={{ borderLeftColor: withOpacity(colors.border, OPACITY.strong) }}
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
