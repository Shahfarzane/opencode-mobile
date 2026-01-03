import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

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

	const content = part.content || "";
	const previewLength = 100;
	const hasMore = content.length > previewLength;

	return (
		<View className="mb-2">
			<Pressable
				onPress={() => setIsExpanded(!isExpanded)}
				className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2"
			>
				<View className="flex-row items-center gap-2">
					<Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
						<Path
							d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"
							stroke="#D0A215"
							strokeWidth={2}
							strokeLinecap="round"
						/>
						<Path d="M9 21h6M10 17v4M14 17v4" stroke="#D0A215" strokeWidth={2} />
					</Svg>
					<Text className="font-mono text-sm font-medium text-warning flex-1">
						Thinking
					</Text>
					{part.isStreaming && (
						<Text className="font-mono text-xs text-warning/70">...</Text>
					)}
					<Text className="font-mono text-xs text-muted-foreground">
						{isExpanded ? "▼" : "▶"}
					</Text>
				</View>

				{isExpanded ? (
					<View className="mt-2 pt-2 border-t border-warning/20">
						<Text className="font-mono text-sm text-foreground/80 leading-relaxed">
							{content}
							{part.isStreaming && "▊"}
						</Text>
					</View>
				) : hasMore ? (
					<Text
						className="mt-1 font-mono text-xs text-muted-foreground"
						numberOfLines={2}
					>
						{content.slice(0, previewLength)}...
					</Text>
				) : null}
			</Pressable>
		</View>
	);
}
