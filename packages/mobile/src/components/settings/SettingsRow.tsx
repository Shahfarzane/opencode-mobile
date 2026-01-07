import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { ChevronRightIcon } from "@/components/icons";
import { Spacing, useTheme, Fonts, FontSizes, FixedLineHeights } from "@/theme";

interface SettingsRowBaseProps {
	/** Row icon (rendered on the left) */
	icon?: React.ReactNode;
	/** Primary text */
	title: string;
	/** Secondary text (below title) */
	subtitle?: string;
	/** Value text (displayed on the right, before chevron) */
	value?: string;
	/** Whether this is a destructive action */
	destructive?: boolean;
}

interface SettingsRowNavigationProps extends SettingsRowBaseProps {
	/** Navigation handler */
	onPress: () => void;
	/** Toggle value - not used for navigation rows */
	toggle?: never;
	/** Toggle change handler - not used for navigation rows */
	onToggleChange?: never;
}

interface SettingsRowToggleProps extends SettingsRowBaseProps {
	/** Toggle value */
	toggle: boolean;
	/** Toggle change handler */
	onToggleChange: (value: boolean) => void;
	/** Navigation handler - not used for toggle rows */
	onPress?: never;
}

interface SettingsRowStaticProps extends SettingsRowBaseProps {
	/** No interaction */
	onPress?: never;
	toggle?: never;
	onToggleChange?: never;
}

type SettingsRowProps =
	| SettingsRowNavigationProps
	| SettingsRowToggleProps
	| SettingsRowStaticProps;

/**
 * iOS-style settings row component.
 * Supports navigation rows (with chevron), toggle rows (with switch), and static rows.
 */
export function SettingsRow(props: SettingsRowProps) {
	const { colors } = useTheme();
	const { icon, title, subtitle, value, destructive } = props;

	const isToggle = "toggle" in props && props.toggle !== undefined;
	const isNavigation = "onPress" in props && typeof props.onPress === "function";

	const handlePress = useCallback(() => {
		if (isNavigation && props.onPress) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			props.onPress();
		}
	}, [isNavigation, props]);

	const handleToggleChange = useCallback(
		(value: boolean) => {
			if (isToggle && props.onToggleChange) {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				props.onToggleChange(value);
			}
		},
		[isToggle, props]
	);

	const textColor = destructive ? colors.destructive : colors.foreground;

	const content = (
		<View style={styles.row}>
			{icon && (
				<View style={styles.iconContainer}>
					{icon}
				</View>
			)}
			<View style={styles.content}>
				<View style={styles.textContainer}>
					<Text
						style={[
							styles.title,
							{ color: textColor },
						]}
						numberOfLines={1}
					>
						{title}
					</Text>
					{subtitle && (
						<Text
							style={[
								styles.subtitle,
								{ color: colors.mutedForeground },
							]}
							numberOfLines={2}
						>
							{subtitle}
						</Text>
					)}
				</View>
				<View style={styles.rightContainer}>
					{value && !isToggle && (
						<Text
							style={[
								styles.value,
								{ color: colors.mutedForeground },
							]}
							numberOfLines={1}
						>
							{value}
						</Text>
					)}
					{isToggle && (
						<Switch
							value={props.toggle}
							onValueChange={handleToggleChange}
							trackColor={{
								false: colors.muted,
								true: colors.primary,
							}}
							thumbColor={colors.background}
						/>
					)}
					{isNavigation && !isToggle && (
						<ChevronRightIcon
							size={20}
							color={colors.mutedForeground}
						/>
					)}
				</View>
			</View>
		</View>
	);

	if (isNavigation) {
		return (
			<Pressable
				onPress={handlePress}
				style={({ pressed }) => [
					pressed && { backgroundColor: colors.muted },
				]}
			>
				{content}
			</Pressable>
		);
	}

	return content;
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: Spacing[4],
		paddingVertical: Spacing[3],
		minHeight: 44, // iOS touch target
	},
	iconContainer: {
		width: 24,
		height: 24,
		alignItems: "center",
		justifyContent: "center",
		marginRight: Spacing[3],
	},
	content: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	textContainer: {
		flex: 1,
		marginRight: Spacing[2],
	},
	title: {
		fontSize: FontSizes.uiHeader, // 15px
		fontFamily: Fonts.regular,
		lineHeight: 20,
	},
	subtitle: {
		fontSize: FontSizes.meta, // 14px - matches desktop meta typography
		fontFamily: Fonts.regular,
		lineHeight: FixedLineHeights.ui, // 16px
		marginTop: 2,
	},
	rightContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing[2],
	},
	value: {
		fontSize: FontSizes.uiHeader, // 15px
		fontFamily: Fonts.regular,
	},
});
