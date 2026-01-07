import { useState } from "react";
import { Text, TextInput, type TextInputProps, View } from "react-native";
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
		<View className="gap-1.5">
			<View className="flex-row items-center">
				<Text style={[typography.uiLabel, { color: colors.foreground }]}>
					{label}
					{required && <Text style={{ color: colors.destructive }}> *</Text>}
				</Text>
			</View>
			{description && (
				<Text
					className="-mt-0.5"
					style={[typography.meta, { color: colors.mutedForeground }]}
				>
					{description}
				</Text>
			)}
			<TextInput
				className="px-3 py-2.5 rounded-lg border"
				style={[
					typography.uiLabel,
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
