import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { typography, useTheme } from "@/theme";

export interface ReasoningPartData {
	type: "reasoning";
	content?: string;
	isStreaming?: boolean;
}

interface ReasoningPartProps {
	part: ReasoningPartData;
}

export function ReasoningPart({ part }: ReasoningPartProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const { colors } = useTheme();

	const content = part.content || "";
	const previewLength = 100;
	const hasMore = content.length > previewLength;

	return (
		<View style={styles.container}>
			<Pressable
				onPress={() => setIsExpanded(!isExpanded)}
				style={[
					styles.pressable,
					{
						borderColor: `${colors.warning}30`,
						backgroundColor: `${colors.warning}08`,
					},
				]}
			>
				<View style={styles.header}>
					<Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
						<Path
							d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"
							stroke={colors.warning}
							strokeWidth={2}
							strokeLinecap="round"
						/>
						<Path
							d="M9 21h6M10 17v4M14 17v4"
							stroke={colors.warning}
							strokeWidth={2}
						/>
					</Svg>
					<Text
						style={[
							typography.uiLabel,
							styles.title,
							{ color: colors.warning },
						]}
					>
						Thinking
					</Text>
					{part.isStreaming && (
						<Text style={[typography.micro, { color: `${colors.warning}B0` }]}>
							...
						</Text>
					)}
					<Text style={[typography.micro, { color: colors.mutedForeground }]}>
						{isExpanded ? "▼" : "▶"}
					</Text>
				</View>

				{isExpanded ? (
					<View
						style={[
							styles.expandedContent,
							{ borderTopColor: `${colors.warning}20` },
						]}
					>
						<Text
							style={[
								typography.body,
								{ color: `${colors.foreground}CC`, lineHeight: 22 },
							]}
						>
							{content}
							{part.isStreaming && "▊"}
						</Text>
					</View>
				) : hasMore ? (
					<Text
						style={[
							typography.micro,
							styles.preview,
							{ color: colors.mutedForeground },
						]}
						numberOfLines={2}
					>
						{content.slice(0, previewLength)}...
					</Text>
				) : null}
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 8,
	},
	pressable: {
		borderRadius: 8,
		borderWidth: 1,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	title: {
		flex: 1,
	},
	expandedContent: {
		marginTop: 8,
		paddingTop: 8,
		borderTopWidth: 1,
	},
	preview: {
		marginTop: 4,
	},
});
