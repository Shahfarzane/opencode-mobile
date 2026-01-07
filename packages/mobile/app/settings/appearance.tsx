import { Pressable, StyleSheet, Text, View } from "react-native";
import { SettingsScreen } from "@/components/settings";
import { Fonts, Spacing, useTheme } from "@/theme";
import { type ThemeMode, useThemeMode } from "@/theme/ThemeProvider";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
	{ value: "system", label: "System" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
];

function ThemeModeSelector() {
	const { colors } = useTheme();
	const { themeMode, setThemeMode } = useThemeMode();

	return (
		<View style={[styles.segmentedControl, { backgroundColor: colors.muted }]}>
			{THEME_OPTIONS.map((option) => {
				const isSelected = themeMode === option.value;
				return (
					<Pressable
						key={option.value}
						onPress={() => setThemeMode(option.value)}
						style={[
							styles.segment,
							isSelected && [
								styles.segmentSelected,
								{ backgroundColor: colors.primary },
							],
						]}
					>
						<Text
							style={[
								styles.segmentLabel,
								{
									color: isSelected ? colors.background : colors.foreground,
								},
							]}
						>
							{option.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

export default function AppearanceScreen() {
	const { colors } = useTheme();

	return (
		<SettingsScreen title="Appearance">
			<View style={styles.section}>
				<Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
					Theme Mode
				</Text>
				<ThemeModeSelector />
			</View>
		</SettingsScreen>
	);
}

const styles = StyleSheet.create({
	section: {
		paddingHorizontal: Spacing[4],
		paddingTop: Spacing[6],
	},
	sectionHeader: {
		fontSize: 13,
		fontFamily: Fonts.medium,
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: Spacing[3],
	},
	segmentedControl: {
		flexDirection: "row",
		borderRadius: 8,
		padding: 3,
	},
	segment: {
		flex: 1,
		paddingVertical: 8,
		paddingHorizontal: 12,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 6,
	},
	segmentSelected: {
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	segmentLabel: {
		fontSize: 14,
		fontFamily: Fonts.medium,
	},
});
