import { forwardRef, useState } from "react";
import { Text, TextInput, type TextInputProps, View } from "react-native";
import { typography, useTheme } from "@/theme";

interface InputProps extends TextInputProps {
	label?: string;
	error?: string;
	helperText?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
	(
		{
			label,
			error,
			helperText,
			leftIcon,
			rightIcon,
			editable = true,
			style,
			...props
		},
		ref,
	) => {
		const { colors } = useTheme();
		const [isFocused, setIsFocused] = useState(false);

		const hasError = !!error;
		const isDisabled = !editable;

		const getBorderColor = () => {
			if (hasError) return colors.destructive;
			if (isFocused) return colors.primary;
			return colors.border;
		};

		return (
			<View className="w-full">
				{label && (
					<Text
						className="mb-2"
						style={[typography.uiLabel, { color: colors.foreground }]}
					>
						{label}
					</Text>
				)}

				<View
					className={`flex-row items-center rounded-lg border ${isDisabled ? "opacity-50" : ""}`}
					style={{
						borderColor: getBorderColor(),
						backgroundColor: colors.input,
					}}
				>
					{leftIcon && <View className="pl-3">{leftIcon}</View>}

					<TextInput
						ref={ref}
						editable={editable}
						onFocus={(e) => {
							setIsFocused(true);
							props.onFocus?.(e);
						}}
						onBlur={(e) => {
							setIsFocused(false);
							props.onBlur?.(e);
						}}
						placeholderTextColor={colors.mutedForeground}
						className="flex-1 min-h-11 px-3 py-2"
						style={[typography.body, { color: colors.foreground }, style]}
						{...props}
					/>

					{rightIcon && <View className="pr-3">{rightIcon}</View>}
				</View>

				{(error || helperText) && (
					<Text
						className="mt-1.5"
						style={[
							typography.micro,
							{ color: hasError ? colors.destructive : colors.mutedForeground },
						]}
					>
						{error || helperText}
					</Text>
				)}
			</View>
		);
	},
);

Input.displayName = "Input";
