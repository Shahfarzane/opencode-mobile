import type { PressableProps, TextStyle, ViewStyle } from "react-native";

/**
 * Button variant options
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "warning"
  | "muted"
  | "info";

/**
 * Button size options
 *
 * Mobile-optimized sizes:
 * - xs: 28px - Extra compact UI
 * - sm: 36px - Compact, matches desktop default
 * - md: 44px - iOS minimum touch target (default)
 * - lg: 56px - Prominent actions
 *
 * Icon button sizes:
 * - icon-xs: 24px - Very compact icons
 * - icon-sm: 32px - Compact icons
 * - icon-md: 40px - Standard icons
 * - icon-lg: 48px - Large icons
 *
 * Desktop-equivalent sizes (for PWA parity):
 * - desktop: 36px - Matches PWA default button
 * - desktop-sm: 32px - Matches PWA small button
 * - desktop-lg: 40px - Matches PWA large button
 * - icon-desktop: 36px - Matches PWA icon button
 */
export type ButtonSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "icon-xs"
  | "icon-sm"
  | "icon-md"
  | "icon-lg"
  | "desktop"
  | "desktop-sm"
  | "desktop-lg"
  | "icon-desktop";

/**
 * Props for the Button root component
 */
export interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  /** Button variant style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Whether the button is in loading state */
  isLoading?: boolean;
  /** Whether the button is disabled */
  isDisabled?: boolean;
  /** Whether to trigger haptic feedback on press */
  hapticFeedback?: boolean;
  /** Additional className for the root element */
  className?: string;
  /** Additional style for the root element */
  style?: ViewStyle;
  /** Button content */
  children: React.ReactNode;
}

/**
 * Props for the Button.Label component
 */
export interface ButtonLabelProps {
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: TextStyle;
  /** Text content */
  children: React.ReactNode;
}

/**
 * Context value for compound button components
 */
export interface ButtonContextValue {
  variant: ButtonVariant;
  size: ButtonSize;
  isLoading: boolean;
  isDisabled: boolean;
}
