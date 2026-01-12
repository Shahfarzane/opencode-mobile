import * as Haptics from "expo-haptics";
import { createContext, forwardRef, useContext } from "react";
import {
	ActivityIndicator,
	Pressable,
	Text,
	type View,
	type ViewStyle,
} from "react-native";
import { typography, useTheme } from "@/theme";
import { OPACITY, withOpacity } from "@/utils/colors";
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
		const { colors, isDark } = useTheme();

		const disabled = isDisabled || isLoading;
		const pressableHitSlop = { top: 8, right: 10, bottom: 8, left: 10 };

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

		// Get background color based on variant - matches PWA dark/light mode handling
		// PWA: outline uses dark:bg-input/30, ghost is transparent but with dark:hover:bg-accent/50
		const getBackgroundColor = () => {
			switch (variant) {
				case "primary":
					return colors.primary;
				case "secondary":
					return colors.secondary;
				case "destructive":
					// PWA: dark:bg-destructive/60
					return isDark
						? withOpacity(colors.destructive, 0.6)
						: colors.destructive;
				case "warning":
					return colors.warning;
				case "muted":
					return colors.muted;
				case "info":
					return colors.info;
				case "outline":
					// PWA: dark:bg-input/30 - 30% opacity of input color in dark mode
					return isDark
						? withOpacity(colors.input, OPACITY.overlay)
						: "transparent";
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

		// Get border color for outline variant - PWA: dark:border-input
		const getBorderColor = () => {
			if (variant === "outline") {
				return isDark ? colors.input : colors.border;
			}
			return undefined;
		};

		// Get pressed background color - matches PWA hover states
		const getPressedBackgroundColor = () => {
			const baseColor = getBackgroundColor();

			if (variant === "outline") {
				// PWA: dark:hover:bg-input/50
				return isDark
					? withOpacity(colors.input, OPACITY.half)
					: withOpacity(colors.accent, OPACITY.selected);
			}

			if (variant === "ghost") {
				// PWA: dark:hover:bg-accent/50
				return isDark
					? withOpacity(colors.accent, OPACITY.half)
					: withOpacity(colors.accent, OPACITY.selected);
			}

			if (baseColor === "transparent") {
				return withOpacity(colors.foreground, OPACITY.selected);
			}

			// For solid variants, darken slightly (90% opacity effect)
			return withOpacity(baseColor, 0.9);
		};

		// Get border radius based on size - matches PWA rounded-lg (8px) style
		const getBorderRadius = () => {
			switch (size) {
				case "xs":
					return 6;
				case "sm":
				case "desktop-sm":
					return 8;
				case "lg":
					return 10;
				case "icon-xs":
					return 6;
				case "icon-sm":
					return 8;
				case "icon-md":
				case "icon-lg":
				case "icon-desktop":
					return 10;
				default:
					return 8; // Default to rounded-lg equivalent
			}
		};

		// Compute button styles - matches PWA design with subtle shadows
		const getButtonStyle = (pressed: boolean): ViewStyle[] => {
			const baseStyle: ViewStyle = {
				backgroundColor: pressed
					? getPressedBackgroundColor()
					: getBackgroundColor(),
				borderRadius: getBorderRadius(),
			};

			const borderStyle: ViewStyle | false = variant === "outline" && {
				borderColor: getBorderColor(),
				borderWidth: 1,
			};

			// Subtle shadow for solid buttons (not outline/ghost) - much more subtle than before
			const shadowStyle: ViewStyle | false = !disabled &&
				!pressed &&
				variant !== "outline" &&
				variant !== "ghost" && {
					shadowColor: colors.foreground,
					shadowOffset: { width: 0, height: 1 },
					shadowOpacity: isDark ? 0.15 : 0.08,
					shadowRadius: 2,
					elevation: 2,
				};

			return [
				baseStyle,
				borderStyle || {},
				shadowStyle || {},
				style as ViewStyle,
			].filter(Boolean) as ViewStyle[];
		};

		// Filter out props that are incompatible with Pressable
		const { testID, accessibilityLabel, accessibilityHint } = props;

		return (
			<ButtonContext.Provider value={contextValue}>
				<Pressable
					ref={ref as never}
					disabled={disabled ?? false}
					onPress={handlePress as unknown as () => void}
					hitSlop={pressableHitSlop}
					className={rootClassName}
					style={({ pressed }) => getButtonStyle(pressed)}
					accessibilityRole="button"
					accessibilityState={{ disabled: disabled ?? false }}
					testID={testID ?? undefined}
					accessibilityLabel={accessibilityLabel ?? undefined}
					accessibilityHint={accessibilityHint ?? undefined}
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
