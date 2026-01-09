import type { ReactNode } from "react";

/**
 * Props for the SettingsListItem component
 * Matches desktop SettingsSidebarItem design
 */
export interface SettingsListItemProps {
  /** Item title */
  title: string;
  /** Item subtitle/description (displayed below title) */
  subtitle?: string;
  /** Badge text (e.g., "system", "user", "project") */
  badge?: string;
  /** Small icon to display before title (e.g., lock icon for built-in items) */
  icon?: ReactNode;
  /** Mode icon to display after title (e.g., agent mode indicator) */
  modeIcon?: ReactNode;
  /** Left icon (e.g., provider logo) - displayed before the main content */
  leftIcon?: ReactNode;
  /** Right content (e.g., model count text) */
  rightContent?: ReactNode;
  /** Press handler */
  onPress?: () => void;
}
