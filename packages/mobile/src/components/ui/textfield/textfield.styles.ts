import { tv, combineStyles } from "@/lib/styles";

/**
 * TextField container styles
 * Matches PWA Textarea styling:
 * - min-h-16 (64px minimum height)
 * - rounded-lg
 * - border
 * - focus ring styling
 */
const container = tv({
  base: "w-full rounded-2xl border border-input bg-transparent dark:bg-input/30",
  variants: {
    state: {
      default: "border-border bg-transparent",
      focused: "border-primary bg-transparent",
      error: "border-destructive bg-transparent",
      disabled: "border-border bg-muted/20 opacity-50",
    },
    variant: {
      default: "",
      ghost: "border-transparent",
    },
    size: {
      sm: "min-h-12 rounded-xl", // 48px
      md: "min-h-16 rounded-2xl", // 64px - matches PWA
      lg: "min-h-20 rounded-3xl", // 80px
    },
  },
  defaultVariants: {
    state: "default",
    variant: "default",
    size: "md",
  },
});

/**
 * TextField input styles
 */
const input = tv({
  base: "flex-1 text-foreground",
  variants: {
    size: {
      sm: "",
      md: "", // matches PWA px-3 py-2
      lg: "",
    },
    variant: {
      default: "",
      ghost: "",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

/**
 * TextField label styles
 */
const label = tv({
  base: "text-foreground",
  variants: {
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

/**
 * TextField helper text styles
 */
const helperText = tv({
  base: "",
  variants: {
    isError: {
      true: "text-destructive",
      false: "text-muted-foreground",
    },
    size: {
      sm: "text-xs",
      md: "text-xs",
      lg: "text-sm",
    },
  },
  defaultVariants: {
    isError: false,
    size: "md",
  },
});

/**
 * Combined TextField styles
 */
export const textFieldStyles = combineStyles({
  container,
  input,
  label,
  helperText,
});
