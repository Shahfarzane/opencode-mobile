import { tv, combineStyles } from "@/lib/styles";

/**
 * Settings text area container styles
 */
const container = tv({
  base: "gap-1.5",
  variants: {},
});

/**
 * Label row styles
 */
const labelRow = tv({
  base: "flex-row items-center",
  variants: {},
});

/**
 * Label styles
 */
const label = tv({
  base: "text-foreground",
  variants: {},
});

/**
 * Required indicator styles
 */
const required = tv({
  base: "text-destructive",
  variants: {},
});

/**
 * Description styles
 */
const description = tv({
  base: "-mt-0.5 text-muted-foreground",
  variants: {},
});

/**
 * Input styles
 */
const input = tv({
  base: "px-3 py-2.5 rounded-lg border bg-muted",
  variants: {
    state: {
      default: "border-border",
      focused: "border-primary",
      error: "border-destructive",
    },
  },
  defaultVariants: {
    state: "default",
  },
});

/**
 * Error text styles
 */
const error = tv({
  base: "text-destructive",
  variants: {},
});

export const settingsTextAreaStyles = combineStyles({
  container,
  labelRow,
  label,
  required,
  description,
  input,
  error,
});
