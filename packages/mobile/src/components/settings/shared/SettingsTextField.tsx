import { useState } from "react";
import {
	StyleSheet,
	Text,
	TextInput,
	type TextInputProps,
	View,
} from "react-native";
import { typography, useTheme } from "@/theme";

interface SettingsTextFieldProps extends Omit<TextInputProps, "style"> {
	label: string;
	description?: string;
	error?: string;
	required?: boolean;
}

export function SettingsTextField({
	label,
	description,
	error,
	required = false,
	...inputProps
}: SettingsTextFieldProps) {
	const { colors } = useTheme();
	const [isFocused, setIsFocused] = useState(false);

	const borderColor = error
		? colors.destructive
		: isFocused
			? colors.primary
			: colors.border;

	return (
		<View style={styles.container}>
			<View style={styles.labelRow}>
				<Text style={[typography.uiLabel, { color: colors.foreground }]}>
					{label}
					{required && <Text style={{ color: colors.destructive }}> *</Text>}
				</Text>
			</View>
			{description && (
				<Text
					style={[
						typography.meta,
						styles.description,
						{ color: colors.mutedForeground },
					]}
				>
					{description}
				</Text>
			)}
			<TextInput
				style={[
					typography.uiLabel,
					styles.input,
					{
						color: colors.foreground,
						backgroundColor: colors.muted,
						borderColor,
					},
				]}
				placeholderTextColor={colors.mutedForeground}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				{...inputProps}
			/>
			{error && (
				<Text style={[typography.micro, { color: colors.destructive }]}>
					{error}
				</Text>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		gap: 6,
	},
	labelRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	description: {
		marginTop: -2,
	},
	input: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 8,
		borderWidth: 1,
	},
});
