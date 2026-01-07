import type { ViewStyle } from "react-native";

/**
 * Props for the SettingsScreen component
 */
export interface SettingsScreenProps {
  /** Screen title */
  title: string;
  /** Whether to show back button (default) or close button */
  showClose?: boolean;
  /** Custom back handler */
  onBack?: () => void;
  /** Content */
  children: React.ReactNode;
  /** Whether content should scroll (default: true) */
  scrollable?: boolean;
  /** Additional className for the container */
  className?: string;
  /** Additional style */
  style?: ViewStyle;
}
