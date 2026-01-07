import type { ViewStyle } from "react-native";

/**
 * Base props for all SettingsRow variants
 */
interface SettingsRowBaseProps {
  /** Primary text */
  title: string;
  /** Value text (displayed on the right, before chevron) */
  value?: string;
  /** Whether this is a destructive action */
  destructive?: boolean;
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * Props for navigation rows (with chevron)
 */
interface SettingsRowNavigationProps extends SettingsRowBaseProps {
  /** Navigation handler */
  onPress: () => void;
  /** Toggle value - not used for navigation rows */
  toggle?: never;
  /** Toggle change handler - not used for navigation rows */
  onToggleChange?: never;
}

/**
 * Props for toggle rows (with switch)
 */
interface SettingsRowToggleProps extends SettingsRowBaseProps {
  /** Toggle value */
  toggle: boolean;
  /** Toggle change handler */
  onToggleChange: (value: boolean) => void;
  /** Navigation handler - not used for toggle rows */
  onPress?: never;
}

/**
 * Props for static rows (no interaction)
 */
interface SettingsRowStaticProps extends SettingsRowBaseProps {
  /** No interaction */
  onPress?: never;
  toggle?: never;
  onToggleChange?: never;
}

/**
 * Union type for all SettingsRow variants
 */
export type SettingsRowProps =
  | SettingsRowNavigationProps
  | SettingsRowToggleProps
  | SettingsRowStaticProps;
