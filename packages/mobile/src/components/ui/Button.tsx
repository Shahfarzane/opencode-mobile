import * as Haptics from "expo-haptics";
import { forwardRef } from "react";
import {
	ActivityIndicator,
	Pressable,
	type PressableProps,
	StyleSheet,
	Text,
	type ViewStyle,
} from "react-native";
import { useTheme, typography } from "@/theme";

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

const sizeConfig: Record<ButtonSize, { height: number; paddingHorizontal: number; borderRadius: number }> = {
	sm: { height: 36, paddingHorizontal: 12, borderRadius: 8 },
	md: { height: 44, paddingHorizontal: 16, borderRadius: 8 },  // Standardized radius to match desktop
	lg: { height: 56, paddingHorizontal: 24, borderRadius: 8 },  // Standardized radius to match desktop
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
		const sizeStyles = sizeConfig[size];

		const getBackgroundColor = () => {
			switch (variant) {
				case "default":
					return colors.primary;
				case "secondary":
					return colors.secondary;
				case "outline":
				case "ghost":
					return "transparent";
				case "destructive":
					return colors.destructive;
			}
		};

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

		const getBorderStyle = (): ViewStyle => {
			if (variant === "outline") {
				return { borderWidth: 1, borderColor: colors.border };
			}
			return {};
		};

		return (
			<Pressable
				ref={ref as never}
				disabled={isDisabled}
				onPress={handlePress}
				style={[
					styles.button,
					{
						height: sizeStyles.height,
						paddingHorizontal: sizeStyles.paddingHorizontal,
						borderRadius: sizeStyles.borderRadius,
						backgroundColor: getBackgroundColor(),
						opacity: isDisabled ? 0.5 : 1,
					},
					getBorderStyle(),
					style,
				]}
				{...props}
			>
				{loading ? (
					<ActivityIndicator
						size="small"
						color={
							variant === "default" || variant === "destructive"
								? colors.primaryForeground
								: colors.foreground
						}
					/>
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

const styles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,  // Match desktop gap-2 for icon+text spacing
	},
});
