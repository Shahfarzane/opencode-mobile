import { StyleSheet, Text, View } from "react-native";
import { useTheme, typography } from "@/theme";

interface SettingsSectionProps {
	title?: string;
	description?: string;
	children: React.ReactNode;
	showDivider?: boolean;
}

export function SettingsSection({
	title,
	description,
	children,
	showDivider = true,
}: SettingsSectionProps) {
	const { colors } = useTheme();

	return (
		<View style={styles.container}>
			{showDivider && (
				<View style={[styles.divider, { backgroundColor: colors.border }]} />
			)}
			{(title || description) && (
				<View style={styles.header}>
					{title && (
						<Text style={[typography.uiLabel, styles.title, { color: colors.foreground }]}>
							{title}
						</Text>
					)}
					{description && (
						<Text style={[typography.meta, { color: colors.mutedForeground }]}>
							{description}
						</Text>
					)}
				</View>
			)}
			<View>{children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginTop: 16,
	},
	divider: {
		height: 1,
		marginBottom: 16,
	},
	header: {
		marginBottom: 12,
	},
	title: {
		fontWeight: "600",
		marginBottom: 4,
	},
});
