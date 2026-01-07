import type { ViewStyle } from "react-native";

/**
 * Props for the SettingsSwitch component
 */
export interface SettingsSwitchProps {
  /** Switch label */
  label: string;
  /** Switch description */
  description?: string;
  /** Current value */
  value: boolean;
  /** Change handler */
  onChange: (value: boolean) => void;
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: ViewStyle;
}
