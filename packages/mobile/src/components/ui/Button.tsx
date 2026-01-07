import * as Haptics from "expo-haptics";
import { forwardRef } from "react";
import {
	ActivityIndicator,
	Pressable,
	type PressableProps,
	Text,
	type ViewStyle,
} from "react-native";
import { typography, useTheme } from "@/theme";

type ButtonVariant =
	| "default"
	| "secondary"
	| "outline"
	| "ghost"
	| "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style"> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
	children: React.ReactNode;
	style?: ViewStyle;
}

const sizeClasses: Record<ButtonSize, string> = {
	sm: "h-9 px-3 rounded-lg",
	md: "h-11 px-4 rounded-lg",
	lg: "h-14 px-6 rounded-lg",
};

const variantClasses: Record<ButtonVariant, string> = {
	default: "bg-primary",
	secondary: "bg-secondary",
	outline: "bg-transparent border border-border",
	ghost: "bg-transparent",
	destructive: "bg-destructive",
};

export const Button = forwardRef<typeof Pressable, ButtonProps>(
	(
		{
			variant = "default",
			size = "md",
			loading = false,
			disabled,
			children,
			onPress,
			style,
			...props
		},
		ref,
	) => {
		const { colors } = useTheme();

		const handlePress = async (
			event: Parameters<NonNullable<PressableProps["onPress"]>>[0],
		) => {
			if (loading || disabled) return;
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			onPress?.(event);
		};

		const isDisabled = disabled || loading;

		const getTextColor = () => {
			switch (variant) {
				case "default":
					return colors.primaryForeground;
				case "secondary":
					return colors.secondaryForeground;
				case "outline":
				case "ghost":
					return colors.foreground;
				case "destructive":
					return colors.destructiveForeground;
			}
		};

		const getLoaderColor = () => {
			return variant === "default" || variant === "destructive"
				? colors.primaryForeground
				: colors.foreground;
		};

		return (
			<Pressable
				ref={ref as never}
				disabled={isDisabled}
				onPress={handlePress}
				className={`flex-row items-center justify-center gap-2 ${sizeClasses[size]} ${variantClasses[variant]} ${isDisabled ? "opacity-50" : ""}`}
				style={style}
				{...props}
			>
				{loading ? (
					<ActivityIndicator size="small" color={getLoaderColor()} />
				) : typeof children === "string" ? (
					<Text style={[typography.button, { color: getTextColor() }]}>
						{children}
					</Text>
				) : (
					children
				)}
			</Pressable>
		);
	},
);

Button.displayName = "Button";
