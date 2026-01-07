import { tv, combineStyles } from "@/lib/styles";

/**
 * Settings row container styles
 */
const container = tv({
  base: "flex-row items-center min-h-[44px]",
  variants: {},
});

/**
 * Content container styles
 */
const content = tv({
  base: "flex-1 flex-row items-center justify-between",
  variants: {},
});

/**
 * Text container styles
 */
const textContainer = tv({
  base: "flex-1",
  variants: {},
});

/**
 * Title styles
 * iOS HIG: 17pt regular for list item titles
 */
const title = tv({
  base: "",
  variants: {
    destructive: {
      true: "text-destructive",
      false: "text-foreground",
    },
  },
  defaultVariants: {
    destructive: false,
  },
});

/**
 * Right container styles
 */
const rightContainer = tv({
  base: "flex-row items-center gap-2",
  variants: {},
});

/**
 * Value text styles
 */
const value = tv({
  base: "text-muted-foreground",
  variants: {},
});

export const settingsRowStyles = combineStyles({
  container,
  content,
  textContainer,
  title,
  rightContainer,
  value,
});
