import { forwardRef, useState } from "react";
import {
	Text,
	TextInput,
	type TextInputProps,
	useColorScheme,
	View,
} from "react-native";

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
			className = "",
			editable = true,
			...props
		},
		ref,
	) => {
		const colorScheme = useColorScheme();
		const isDark = colorScheme === "dark";
		const [isFocused, setIsFocused] = useState(false);

		const hasError = !!error;
		const isDisabled = !editable;

		const getBorderColor = () => {
			if (hasError) return "border-destructive";
			if (isFocused) return "border-primary";
			return "border-border";
		};

		return (
			<View className="w-full">
				{label && (
					<Text className="mb-2 font-mono text-sm font-medium text-foreground">
						{label}
					</Text>
				)}

				<View
					className={`flex-row items-center rounded-xl border bg-input ${getBorderColor()} ${isDisabled ? "opacity-50" : ""}`}
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
						placeholderTextColor={isDark ? "#878580" : "#6F6E69"}
						className={`min-h-[44px] flex-1 px-4 py-3 font-mono text-base text-foreground ${className}`}
						{...props}
					/>

					{rightIcon && <View className="pr-3">{rightIcon}</View>}
				</View>

				{(error || helperText) && (
					<Text
						className={`mt-1.5 font-mono text-xs ${hasError ? "text-destructive" : "text-muted-foreground"}`}
					>
						{error || helperText}
					</Text>
				)}
			</View>
		);
	},
);

Input.displayName = "Input";
