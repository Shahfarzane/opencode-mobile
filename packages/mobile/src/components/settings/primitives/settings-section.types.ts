import type { ViewStyle } from "react-native";

/**
 * Props for the SettingsSection component
 */
export interface SettingsSectionProps {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Section content */
  children: React.ReactNode;
  /** Whether to show divider above section */
  showDivider?: boolean;
  /** Whether this is the first section (removes top margin) */
  isFirst?: boolean;
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: ViewStyle;
}
