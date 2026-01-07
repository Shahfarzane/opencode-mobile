import type { TextInputProps, ViewStyle } from "react-native";

/**
 * Props for the SettingsTextArea component
 */
export interface SettingsTextAreaProps
  extends Omit<TextInputProps, "style" | "multiline"> {
  /** Field label */
  label: string;
  /** Field description */
  description?: string;
  /** Error message */
  error?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Number of visible rows (default: 4) */
  rows?: number;
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: ViewStyle;
}
