import { Pressable, StyleSheet, Text, View } from "react-native";
import {
	SettingsGroup,
	SettingsScreen,
} from "@/components/settings";
import { Radius, Spacing, Fonts, useTheme } from "@/theme";
import { type ThemeMode, useThemeMode } from "@/theme/ThemeProvider";

interface ThemeModeOption {
	value: ThemeMode;
	label: string;
	description: string;
}

const THEME_MODE_OPTIONS: ThemeModeOption[] = [
	{ value: "system", label: "System", description: "Follow system settings" },
	{ value: "light", label: "Light", description: "Always use light theme" },
	{ value: "dark", label: "Dark", description: "Always use dark theme" },
];

function ThemeModeSelector() {
	const { colors } = useTheme();
	const { themeMode, setThemeMode } = useThemeMode();

	return (
		<View style={styles.selectorContainer}>
			{THEME_MODE_OPTIONS.map((option) => {
				const isSelected = themeMode === option.value;
				return (
					<Pressable
						key={option.value}
						onPress={() => setThemeMode(option.value)}
						style={[
							styles.option,
							{
								backgroundColor: isSelected
									? colors.primary + "20"
									: "transparent",
								borderColor: isSelected ? colors.primary : colors.border,
							},
						]}
					>
						<View style={styles.optionContent}>
							<Text
								style={[
									styles.optionLabel,
									{
										color: isSelected ? colors.primary : colors.foreground,
									},
								]}
							>
								{option.label}
							</Text>
							<Text
								style={[
									styles.optionDescription,
									{ color: colors.mutedForeground },
								]}
							>
								{option.description}
							</Text>
						</View>
						<View
							style={[
								styles.radio,
								{
									borderColor: isSelected ? colors.primary : colors.border,
									backgroundColor: isSelected ? colors.primary : "transparent",
								},
							]}
						>
							{isSelected && (
								<View
									style={[styles.radioInner, { backgroundColor: colors.background }]}
								/>
							)}
						</View>
					</Pressable>
				);
			})}
		</View>
	);
}

export default function AppearanceScreen() {
	return (
		<SettingsScreen title="Appearance">
			<SettingsGroup
				header="Theme"
				footer="Choose how the app should appear. System will automatically switch between light and dark based on your device settings."
			>
				<ThemeModeSelector />
			</SettingsGroup>
		</SettingsScreen>
	);
}

const styles = StyleSheet.create({
	selectorContainer: {
		padding: Spacing[3],
		gap: Spacing[2],
	},
	option: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: Spacing[3],
		borderRadius: Radius.lg,
		borderWidth: 1,
	},
	optionContent: {
		flex: 1,
	},
	optionLabel: {
		fontSize: 15,
		fontFamily: Fonts.medium,
		marginBottom: 2,
	},
	optionDescription: {
		fontSize: 13,
		fontFamily: Fonts.regular,
	},
	radio: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 2,
		alignItems: "center",
		justifyContent: "center",
		marginLeft: Spacing[3],
	},
	radioInner: {
		width: 10,
		height: 10,
		borderRadius: 5,
	},
});
