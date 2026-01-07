import type { TextInputProps, ViewStyle } from "react-native";

/**
 * Props for the SettingsTextField component
 */
export interface SettingsTextFieldProps extends Omit<TextInputProps, "style"> {
  /** Field label */
  label: string;
  /** Field description */
  description?: string;
  /** Error message */
  error?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: ViewStyle;
}
