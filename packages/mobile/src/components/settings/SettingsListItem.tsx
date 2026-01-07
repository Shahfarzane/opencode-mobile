import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { typography, useTheme } from "@/theme";

interface SettingsListItemProps {
	title: string;
	subtitle?: string;
	badge?: string;
	isSelected?: boolean;
	onPress?: () => void;
	icon?: React.ReactNode;
	showChevron?: boolean;
}

export function SettingsListItem({
	title,
	subtitle,
	badge,
	isSelected = false,
	onPress,
	icon,
	showChevron = true,
}: SettingsListItemProps) {
	const { colors } = useTheme();

	const handlePress = useCallback(() => {
		if (onPress) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			onPress();
		}
	}, [onPress]);

	return (
		<Pressable
			onPress={handlePress}
			disabled={!onPress}
			className="flex-row items-center gap-3 px-3 py-2 rounded-lg"
			style={{
				backgroundColor: isSelected
					? colors.primary + "15"
					: "transparent",
			}}
		>
			{icon && (
				<View
					className="w-9 h-9 items-center justify-center rounded-lg"
					style={{ backgroundColor: colors.muted }}
				>
					{icon}
				</View>
			)}
			<View className="flex-1 min-w-0">
				<View className="flex-row items-center gap-2">
					<Text
						style={[typography.uiLabel, { color: colors.foreground }]}
						numberOfLines={1}
					>
						{title}
					</Text>
					{badge && (
						<View
							className="px-1.5 py-0.5 rounded border"
							style={{ backgroundColor: colors.muted, borderColor: colors.border }}
						>
							<Text
								style={[typography.micro, { color: colors.mutedForeground }]}
							>
								{badge}
							</Text>
						</View>
					)}
				</View>
				{subtitle && (
					<Text
						style={[typography.meta, { color: colors.mutedForeground }]}
						numberOfLines={1}
					>
						{subtitle}
					</Text>
				)}
			</View>
			{showChevron && onPress && (
				<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
					<Path
						d="M9 18l6-6-6-6"
						stroke={colors.mutedForeground}
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</Svg>
			)}
		</Pressable>
	);
}
