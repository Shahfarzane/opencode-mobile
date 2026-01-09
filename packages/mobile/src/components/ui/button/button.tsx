import * as Haptics from "expo-haptics";
import { createContext, forwardRef, useContext } from "react";
import { ActivityIndicator, Pressable, Text, type View } from "react-native";
import { typography, useTheme } from "@/theme";
import {
	BUTTON_DISPLAY_NAME,
	BUTTON_LABEL_DISPLAY_NAME,
} from "./button.constants";
import { buttonStyles } from "./button.styles";
import type {
	ButtonContextValue,
	ButtonLabelProps,
	ButtonProps,
	ButtonSize,
	ButtonVariant,
} from "./button.types";

/**
 * Button context for compound components
 */
const ButtonContext = createContext<ButtonContextValue | null>(null);

/**
 * Button root component
 *
 * A pressable button with multiple variants and sizes.
 * Supports haptic feedback and loading states.
 *
 * @example
 * // Simple usage with string children
 * <Button variant="primary" size="md">
 *   Click me
 * </Button>
 *
 * @example
 * // Compound component usage
 * <Button variant="secondary">
 *   <Button.Label>Submit</Button.Label>
 * </Button>
 */
const ButtonRoot = forwardRef<View, ButtonProps>(
	(
		{
			variant = "primary",
			size = "md",
			isLoading = false,
			isDisabled = false,
			hapticFeedback = true,
			className,
			style,
			children,
			onPress,
			...props
		},
		ref,
	) => {
		const { colors } = useTheme();

		const disabled = isDisabled || isLoading;

		const handlePress = async (
			event: Parameters<NonNullable<typeof onPress>>[0],
		) => {
			if (disabled) return;

			if (hapticFeedback) {
				await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			}

			onPress?.(event);
		};

		const rootClassName = buttonStyles.root({
			variant,
			size,
			isDisabled: disabled,
			isLoading,
			className,
		});

		// Get background color based on variant - use JS theme colors for consistency
		const getBackgroundColor = () => {
			switch (variant) {
				case "primary":
					return colors.primary;
				case "secondary":
					return colors.secondary;
				case "destructive":
					return colors.destructive;
				case "warning":
					return colors.warning;
				case "muted":
					return colors.muted;
				case "info":
					return colors.info;
				case "outline":
				case "ghost":
					return "transparent";
				default:
					return colors.primary;
			}
		};

		// Get spinner color based on variant
		const getSpinnerColor = () => {
			switch (variant) {
				case "primary":
					return colors.primaryForeground;
				case "secondary":
					return colors.secondaryForeground;
				case "destructive":
					return colors.destructiveForeground;
				case "warning":
					return colors.warningForeground;
				case "muted":
					return colors.mutedForeground;
				case "info":
					return colors.infoForeground;
				default:
					return colors.foreground;
			}
		};

		// Render string children with typography
		const renderChildren = () => {
			if (isLoading) {
				return <ActivityIndicator size="small" color={getSpinnerColor()} />;
			}

			if (typeof children === "string") {
				return (
					<ButtonLabel variant={variant} size={size}>
						{children}
					</ButtonLabel>
				);
			}

			return children;
		};

		const contextValue: ButtonContextValue = {
			variant,
			size,
			isLoading,
			isDisabled: disabled,
		};

		// Get border color for outline variant
		const getBorderColor = () => {
			if (variant === "outline") {
				return colors.border;
			}
			return undefined;
		};

		return (
			<ButtonContext.Provider value={contextValue}>
				<Pressable
					ref={ref as never}
					disabled={disabled}
					onPress={handlePress}
					className={rootClassName}
					style={[
						{ backgroundColor: getBackgroundColor() },
						variant === "outline" && { borderColor: getBorderColor() },
						style,
					]}
					accessibilityRole="button"
					accessibilityState={{ disabled }}
					{...props}
				>
					{renderChildren()}
				</Pressable>
			</ButtonContext.Provider>
		);
	},
);

ButtonRoot.displayName = BUTTON_DISPLAY_NAME;

/**
 * Button label component for compound usage
 *
 * @example
 * <Button>
 *   <Button.Label>Click me</Button.Label>
 * </Button>
 */
function ButtonLabel({
	className,
	style,
	children,
	variant: variantProp,
	size: sizeProp,
}: ButtonLabelProps & { variant?: ButtonVariant; size?: ButtonSize }) {
	const context = useContext(ButtonContext);
	const { colors } = useTheme();

	// Use props if provided, otherwise fall back to context
	const variant = variantProp ?? context?.variant ?? "primary";
	const size = sizeProp ?? context?.size ?? "md";

	// Get text color based on variant
	const getTextColor = () => {
		switch (variant) {
			case "primary":
				return colors.primaryForeground;
			case "secondary":
				return colors.secondaryForeground;
			case "destructive":
				return colors.destructiveForeground;
			case "warning":
				return colors.warningForeground;
			case "muted":
				return colors.mutedForeground;
			case "info":
				return colors.infoForeground;
			default:
				return colors.foreground;
		}
	};

	const labelClassName = buttonStyles.label({
		variant,
		size,
		className,
	});

	return (
		<Text
			className={labelClassName}
			style={[typography.button, { color: getTextColor() }, style]}
		>
			{children}
		</Text>
	);
}

ButtonLabel.displayName = BUTTON_LABEL_DISPLAY_NAME;

/**
 * Button component with compound components
 */
export const Button = Object.assign(ButtonRoot, {
	Label: ButtonLabel,
});

/**
 * Props for IconButton component
 */
export interface IconButtonProps
	extends Omit<ButtonProps, "children" | "size"> {
	/** Icon to render */
	icon: React.ReactNode;
	/** Size of the icon button */
	size?: "icon-sm" | "icon-md" | "icon-lg";
	/** Accessible label for the button */
	accessibilityLabel: string;
}

/**
 * Icon-only button component
 *
 * @example
 * <IconButton
 *   icon={<CloseIcon color={colors.foreground} size={18} />}
 *   variant="ghost"
 *   size="icon-sm"
 *   accessibilityLabel="Close"
 *   onPress={handleClose}
 * />
 */
export function IconButton({
	icon,
	size = "icon-md",
	accessibilityLabel,
	...props
}: IconButtonProps) {
	return (
		<Button size={size} accessibilityLabel={accessibilityLabel} {...props}>
			{icon}
		</Button>
	);
}

IconButton.displayName = "IconButton";

export type { ButtonProps, ButtonLabelProps, ButtonVariant, ButtonSize };
