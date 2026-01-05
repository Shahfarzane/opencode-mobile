import { Pressable, StyleSheet, Text, View } from "react-native";
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

	return (
		<Pressable
			onPress={onPress}
			disabled={!onPress}
			style={({ pressed }) => [
				styles.container,
				{
					backgroundColor: isSelected
						? colors.primary + "15"
						: pressed
							? colors.muted
							: "transparent",
				},
			]}
		>
			{icon && (
				<View style={[styles.iconContainer, { backgroundColor: colors.muted }]}>
					{icon}
				</View>
			)}
			<View style={styles.content}>
				<View style={styles.titleRow}>
					<Text
						style={[typography.uiLabel, { color: colors.foreground }]}
						numberOfLines={1}
					>
						{title}
					</Text>
					{badge && (
						<View
							style={[
								styles.badge,
								{ backgroundColor: colors.muted, borderColor: colors.border },
							]}
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

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 8,
		marginHorizontal: 8,
		marginVertical: 2,
	},
	iconContainer: {
		width: 36,
		height: 36,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 8,
	},
	content: {
		flex: 1,
		minWidth: 0,
	},
	titleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	badge: {
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		borderWidth: 1,
	},
});
