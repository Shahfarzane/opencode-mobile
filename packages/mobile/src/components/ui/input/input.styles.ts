import { tv, combineStyles } from "@/lib/styles";

/**
 * Input wrapper styles
 */
const wrapper = tv({
  base: "w-full",
  variants: {},
});

/**
 * Input container styles (the border box)
 *
 * Size mapping to match desktop PWA:
 * - Desktop input: h-9 (36px) = "sm" or "desktop"
 *
 * Mobile-optimized sizes use larger touch targets:
 * - sm: 36px - Matches desktop
 * - md: 44px - iOS minimum touch target (default)
 * - lg: 56px - Large inputs
 */
const container = tv({
  base: "flex-row items-center rounded-2xl border bg-transparent dark:bg-input/25",
  variants: {
    state: {
      default: "border-border",
      focused: "border-primary",
      error: "border-destructive",
      disabled: "border-border opacity-disabled",
    },
    size: {
      // Mobile-optimized sizes
      sm: "rounded-xl",
      md: "rounded-2xl",
      lg: "rounded-3xl",
      // Desktop-equivalent size
      desktop: "rounded-2xl",
    },
    multiline: {
      true: "items-start",
    },
  },
  defaultVariants: {
    state: "default",
    size: "md",
    multiline: false,
  },
});

/**
 * TextInput styles
 */
const input = tv({
  base: "flex-1 px-3 py-2 text-foreground",
  variants: {
    size: {
      // Mobile-optimized sizes (touch-friendly)
      sm: "min-h-9 text-sm",        // 36px - matches desktop
      md: "min-h-11 text-base",     // 44px - iOS minimum
      lg: "min-h-14 text-lg",       // 56px - large
      // Desktop-equivalent size
      desktop: "min-h-9 text-sm",   // 36px - exact desktop match
    },
    hasLeftIcon: {
      true: "pl-0",
    },
    hasRightIcon: {
      true: "pr-0",
    },
    multiline: {
      true: "py-3",
    },
  },
  defaultVariants: {
    size: "md",
    hasLeftIcon: false,
    hasRightIcon: false,
    multiline: false,
  },
});

/**
 * Label styles
 */
const label = tv({
  base: "mb-2 text-foreground",
  variants: {
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
      desktop: "text-sm", // Matches desktop typography-ui-label
    },
  },
  defaultVariants: {
    size: "md",
  },
});

/**
 * Helper text styles
 */
const helperText = tv({
  base: "mt-1.5",
  variants: {
    isError: {
      true: "text-destructive",
      false: "text-muted-foreground",
    },
    size: {
      sm: "text-xs",
      md: "text-xs",
      lg: "text-sm",
      desktop: "text-xs", // Matches desktop
    },
  },
  defaultVariants: {
    isError: false,
    size: "md",
  },
});

/**
 * Icon wrapper styles
 */
const iconWrapper = tv({
  base: "",
  variants: {
    position: {
      left: "pl-3",
      right: "pr-3",
    },
  },
});

/**
 * Prefix wrapper styles (for @ or / prefixes)
 */
const prefix = tv({
  base: "bg-muted/50 px-3 justify-center items-center",
  variants: {
    size: {
      sm: "min-h-9",
      md: "min-h-11",
      lg: "min-h-14",
      desktop: "min-h-9", // Matches desktop h-9
    },
  },
  defaultVariants: {
    size: "md",
  },
});

/**
 * Combined input styles
 */
export const inputStyles = combineStyles({
  wrapper,
  container,
  input,
  label,
  helperText,
  iconWrapper,
  prefix,
});
