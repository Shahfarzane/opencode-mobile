import { tv, combineStyles } from "@/lib/styles";

/**
 * Settings group container styles
 */
const container = tv({
  base: "mb-4",
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
  base: "h-px bg-border ml-4",
  variants: {},
});

/**
 * Footer text styles
 */
const footer = tv({
  base: "mt-2 px-4 text-muted-foreground",
  variants: {},
});

export const settingsGroupStyles = combineStyles({
  container,
  group,
  separator,
  footer,
});
