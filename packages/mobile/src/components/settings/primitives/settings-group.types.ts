import type { ViewStyle } from "react-native";

/**
 * Props for the SettingsGroup component
 */
export interface SettingsGroupProps {
  /** Footer text (displayed below the group) */
  footer?: string;
  /** Children rows */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: ViewStyle;
}
