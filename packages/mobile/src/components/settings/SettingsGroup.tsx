import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Radius, Spacing, useTheme, Fonts, FontSizes, FixedLineHeights } from "@/theme";

interface SettingsGroupProps {
	/** Section header text (displayed above the group) */
	header?: string;
	/** Footer text (displayed below the group) */
	footer?: string;
	/** Children rows */
	children: React.ReactNode;
}

/**
 * iOS-style grouped settings container.
 * Provides rounded card styling with optional header/footer.
 */
export function SettingsGroup({ header, footer, children }: SettingsGroupProps) {
	const { colors } = useTheme();

	const childArray = React.Children.toArray(children).filter(Boolean);

	return (
		<View style={styles.container}>
			{header && (
				<Text
					style={[
						styles.header,
						{ color: colors.mutedForeground },
					]}
				>
					{header}
				</Text>
			)}
			<View
				style={[
					styles.group,
					{
						backgroundColor: colors.card,
						borderColor: colors.border,
					},
				]}
			>
				{childArray.map((child, index) => (
					<React.Fragment key={index}>
						{child}
						{index < childArray.length - 1 && (
							<View
								style={[
									styles.separator,
									{ backgroundColor: colors.border },
								]}
							/>
						)}
					</React.Fragment>
				))}
			</View>
			{footer && (
				<Text
					style={[
						styles.footer,
						{ color: colors.mutedForeground },
					]}
				>
					{footer}
				</Text>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: Spacing[6],
	},
	header: {
		fontSize: FontSizes.xs, // 12px - iOS-style section header
		fontFamily: Fonts.medium,
		textTransform: "uppercase",
		letterSpacing: 0.8,
		marginBottom: Spacing[2],
		marginLeft: Spacing[4],
	},
	group: {
		borderRadius: Radius.xl,
		overflow: "hidden",
		borderWidth: StyleSheet.hairlineWidth,
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		marginLeft: Spacing[4] + 24 + Spacing[3], // icon container + gap
	},
	footer: {
		fontSize: FontSizes.meta, // 14px - matches desktop meta typography
		fontFamily: Fonts.regular,
		marginTop: Spacing[2],
		marginHorizontal: Spacing[4],
		lineHeight: FixedLineHeights.ui, // 16px
	},
});
