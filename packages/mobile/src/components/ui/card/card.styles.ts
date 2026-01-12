import { tv, combineStyles } from "@/lib/styles";

/**
 * Card root styles
 */
const root = tv({
  base: "rounded-2xl border border-border bg-card",
  variants: {
    variant: {
      default: "",
      elevated: "shadow-md",
      outlined: "border border-border",
    },
    padding: {
      none: "p-0",
      sm: "p-3",
      md: "p-6",
      lg: "p-8",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "md",
  },
});

/**
 * Card header styles
 */
const header = tv({
  base: "gap-1.5",
  variants: {},
});

/**
 * Card content styles
 */
const content = tv({
  base: "",
  variants: {},
});

/**
 * Card footer styles
 */
const footer = tv({
  base: "flex-row items-center gap-2",
  variants: {},
});

/**
 * Combined card styles
 */
export const cardStyles = combineStyles({
  root,
  header,
  content,
  footer,
});
