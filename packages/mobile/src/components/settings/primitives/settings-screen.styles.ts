import { tv, combineStyles } from "@/lib/styles";

/**
 * Settings screen container styles
 */
const container = tv({
  base: "flex-1 bg-background",
  variants: {},
});

/**
 * Settings screen header styles
 * iOS HIG: Centered title with balanced left/right buttons
 */
const header = tv({
  base: "flex-row items-center px-4 pb-4 border-b border-b-hairline border-border",
  variants: {},
});

/**
 * Header button styles
 * iOS HIG: 44pt minimum touch target
 */
const headerButton = tv({
  base: "w-11 h-11 items-center justify-center",
  variants: {},
});

/**
 * Close button styles
 */
const closeButton = tv({
  base: "w-8 h-8 rounded-full items-center justify-center bg-muted",
  variants: {},
});

/**
 * Title styles
 * iOS HIG: 17pt semibold, centered
 */
const title = tv({
  base: "flex-1 text-center text-foreground",
  variants: {},
});

/**
 * Scroll view styles
 */
const scrollView = tv({
  base: "flex-1",
  variants: {},
});

/**
 * Scroll content styles
 */
const scrollContent = tv({
  base: "pt-4 px-4",
  variants: {},
});

/**
 * Non-scrollable content styles
 */
const content = tv({
  base: "flex-1 pt-4 px-4",
  variants: {},
});

export const settingsScreenStyles = combineStyles({
  container,
  header,
  headerButton,
  closeButton,
  title,
  scrollView,
  scrollContent,
  content,
});
