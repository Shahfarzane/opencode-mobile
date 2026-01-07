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
  /** Press handler */
  onPress?: () => void;
  /** Whether to show chevron indicator */
  showChevron?: boolean;
}
