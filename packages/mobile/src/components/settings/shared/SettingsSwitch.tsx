import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { typography, useTheme } from "@/theme";

interface SettingsSwitchProps {
	label: string;
	description?: string;
	value: boolean;
	onChange: (value: boolean) => void;
	disabled?: boolean;
}

export function SettingsSwitch({
	label,
	description,
	value,
	onChange,
	disabled = false,
}: SettingsSwitchProps) {
	const { colors } = useTheme();

	return (
		<Pressable
			onPress={() => !disabled && onChange(!value)}
			disabled={disabled}
			style={[styles.container, disabled && styles.disabled]}
		>
			<View style={styles.content}>
				<Text style={[typography.uiLabel, { color: colors.foreground }]}>
					{label}
				</Text>
				{description && (
					<Text style={[typography.meta, { color: colors.mutedForeground }]}>
						{description}
					</Text>
				)}
			</View>
			<Switch
				value={value}
				onValueChange={onChange}
				disabled={disabled}
				trackColor={{ false: colors.muted, true: colors.primary }}
				thumbColor={colors.background}
			/>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 4,
	},
	content: {
		flex: 1,
		gap: 2,
	},
	disabled: {
		opacity: 0.5,
	},
});
