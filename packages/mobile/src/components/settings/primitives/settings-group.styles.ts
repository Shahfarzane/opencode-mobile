import { tv, combineStyles } from "@/lib/styles";

/**
 * Settings group container styles
 */
const container = tv({
  base: "mb-6",
  variants: {},
});

/**
 * Group container styles - flat, no card
 */
const group = tv({
  base: "",
  variants: {},
});

/**
 * Separator styles
 * iOS HIG: Separator starts from left padding (16px)
 */
const separator = tv({
  base: "h-px bg-border",
  variants: {},
});

/**
 * Footer text styles
 */
const footer = tv({
  base: "mt-2 text-muted-foreground",
  variants: {},
});

export const settingsGroupStyles = combineStyles({
  container,
  group,
  separator,
  footer,
});
