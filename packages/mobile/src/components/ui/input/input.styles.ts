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
 */
const container = tv({
  base: "flex-row items-center rounded-lg border",
  variants: {
    state: {
      default: "border-border bg-input",
      focused: "border-primary bg-input",
      error: "border-destructive bg-input",
      disabled: "border-border bg-input opacity-disabled",
    },
    size: {
      sm: "rounded-md",
      md: "rounded-lg",
      lg: "rounded-xl",
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
      sm: "min-h-9 text-sm",
      md: "min-h-11 text-base",
      lg: "min-h-14 text-lg",
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
