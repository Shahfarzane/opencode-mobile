import type { ReactNode } from "react";

/**
 * Props for the SettingsListItem component
 */
export interface SettingsListItemProps {
  /** Item title */
  title: string;
  /** Item subtitle */
  subtitle?: string;
  /** Badge text */
  badge?: string;
  /** Icon to display before title (e.g., lock icon for built-in items) */
  icon?: ReactNode;
  /** Mode icon to display after title/badge row (e.g., agent mode indicator) */
  modeIcon?: ReactNode;
  /** Press handler */
  onPress?: () => void;
  /** Whether to show chevron indicator */
  showChevron?: boolean;
}
