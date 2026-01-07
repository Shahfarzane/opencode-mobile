import type { ViewStyle } from "react-native";

/**
 * Select option type
 */
export interface SelectOption {
  /** Option value */
  value: string;
  /** Option display label */
  label: string;
  /** Optional description */
  description?: string;
}

/**
 * Props for the SettingsSelect component
 */
export interface SettingsSelectProps {
  /** Field label */
  label: string;
  /** Field description */
  description?: string;
  /** Available options */
  options: SelectOption[];
  /** Currently selected value */
  value: string | undefined;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: ViewStyle;
}
