import type { TextInputProps, TextStyle, ViewStyle } from "react-native";

/**
 * Input size options
 *
 * Mobile-optimized sizes:
 * - sm: 36px - Compact, matches desktop
 * - md: 44px - iOS minimum touch target (default)
 * - lg: 56px - Large inputs
 *
 * Desktop-equivalent size (for PWA parity):
 * - desktop: 36px - Exact desktop input size
 */
export type InputSize = "sm" | "md" | "lg" | "desktop";

/**
 * Input state for styling
 */
export type InputState = "default" | "focused" | "error" | "disabled";

/**
 * Props for the Input component
 */
export interface InputProps extends Omit<TextInputProps, "style"> {
  /** Input label (string or ReactNode for custom styling) */
  label?: React.ReactNode;
  /** Error message (shows error state when provided) */
  error?: string;
  /** Helper text shown below input */
  helperText?: string;
  /** Input size */
  size?: InputSize;
  /** Prefix text shown before input with muted background (e.g., "@" or "/") */
  prefix?: string;
  /** Icon to show on the left side */
  leftIcon?: React.ReactNode;
  /** Icon to show on the right side */
  rightIcon?: React.ReactNode;
  /** Additional className for the wrapper */
  className?: string;
  /** Additional className for the input */
  inputClassName?: string;
  /** Additional style for the wrapper */
  style?: ViewStyle;
  /** Additional style for the input */
  inputStyle?: TextStyle;
  /** Number of lines for multiline input (sets min height) */
  numberOfLines?: number;
}

/**
 * Props for the Input.Label component
 */
export interface InputLabelProps {
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: TextStyle;
  /** Label text */
  children: React.ReactNode;
}

/**
 * Props for the Input.HelperText component
 */
export interface InputHelperTextProps {
  /** Whether this is an error message */
  isError?: boolean;
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: TextStyle;
  /** Helper text content */
  children: React.ReactNode;
}

/**
 * Context value for compound input components
 */
export interface InputContextValue {
  size: InputSize;
  state: InputState;
  hasError: boolean;
}
