import type { TextInputProps, ViewStyle } from "react-native";

/**
 * TextField size variants
 * Matches PWA sizes: md (default), lg (larger touch target)
 */
export type TextFieldSize = "sm" | "md" | "lg";

/**
 * TextField variant for styling
 */
export type TextFieldVariant = "default" | "ghost";

/**
 * TextField state for styling
 */
export type TextFieldState = "default" | "focused" | "error" | "disabled";

/**
 * TextField component props
 */
export interface TextFieldProps extends Omit<TextInputProps, "style"> {
  /** Size variant */
  size?: TextFieldSize;
  /** Visual variant */
  variant?: TextFieldVariant;
  /** Error message or error state */
  error?: string | boolean;
  /** Label text */
  label?: string;
  /** Helper text shown below the input */
  helperText?: string;
  /** Custom className for container */
  className?: string;
  /** Custom className for input */
  inputClassName?: string;
  /** Custom style for container */
  containerStyle?: ViewStyle;
  /** Custom style for input */
  inputStyle?: TextInputProps["style"];
}

/**
 * TextField context value for compound components
 */
export interface TextFieldContextValue {
  size: TextFieldSize;
  variant: TextFieldVariant;
  state: TextFieldState;
  hasError: boolean;
}
