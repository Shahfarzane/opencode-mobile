import { forwardRef, useState } from "react";
import {
	StyleSheet,
	Text,
	TextInput,
	type TextInputProps,
	View,
} from "react-native";
import { useTheme, typography } from "@/theme";

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
			<View style={styles.container}>
				{label && (
					<Text style={[typography.uiLabel, styles.label, { color: colors.foreground }]}>
						{label}
					</Text>
				)}

				<View
					style={[
						styles.inputWrapper,
						{
							borderColor: getBorderColor(),
							backgroundColor: colors.input,
							opacity: isDisabled ? 0.5 : 1,
						},
					]}
				>
					{leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

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
						style={[
							styles.input,
							typography.body,
							{ color: colors.foreground },
							style,
						]}
						{...props}
					/>

					{rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
				</View>

				{(error || helperText) && (
					<Text
						style={[
							typography.micro,
							styles.helperText,
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

const styles = StyleSheet.create({
	container: {
		width: '100%',
	},
	label: {
		marginBottom: 8,
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 8,     // Match desktop rounded-lg (was 12)
		borderWidth: 1,
	},
	leftIcon: {
		paddingLeft: 12,
	},
	rightIcon: {
		paddingRight: 12,
	},
	input: {
		flex: 1,
		minHeight: 44,       // Keep mobile-friendly touch target
		paddingHorizontal: 12, // Match desktop px-3 (was 16)
		paddingVertical: 8,    // Adjusted for mobile (was 12)
	},
	helperText: {
		marginTop: 6,
	},
});
