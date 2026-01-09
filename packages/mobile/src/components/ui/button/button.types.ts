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
 */
export type ButtonSize = "sm" | "md" | "lg" | "xs" | "icon-sm" | "icon-md" | "icon-lg";

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
