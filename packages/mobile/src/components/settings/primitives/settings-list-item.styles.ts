import { tv, combineStyles } from "@/lib/styles";

/**
 * Settings list item container styles
 * iOS HIG: 44pt minimum touch target, 16pt horizontal padding
 */
const container = tv({
  base: "flex-row items-center px-4 min-h-[44px]",
  variants: {},
});

/**
 * Content container styles
 */
const content = tv({
  base: "flex-1 min-w-0 py-3",
  variants: {},
});

/**
 * Title row styles
 */
const titleRow = tv({
  base: "flex-row items-center gap-2",
  variants: {},
});

/**
 * Title styles
 * iOS HIG: 17pt regular for list item titles
 */
const title = tv({
  base: "text-foreground",
  variants: {},
});

/**
 * Badge container styles
 */
const badge = tv({
  base: "px-1.5 py-0.5 rounded border border-border bg-muted ml-1",
  variants: {},
});

/**
 * Badge text styles
 */
const badgeText = tv({
  base: "text-muted-foreground",
  variants: {},
});

/**
 * Subtitle styles
 * iOS HIG: 15pt regular, secondary label color
 */
const subtitle = tv({
  base: "text-muted-foreground mt-0.5",
  variants: {},
});

/**
 * Chevron container for proper alignment
 */
const chevronContainer = tv({
  base: "ml-2",
  variants: {},
});

export const settingsListItemStyles = combineStyles({
  container,
  content,
  titleRow,
  title,
  badge,
  badgeText,
  subtitle,
  chevronContainer,
});
