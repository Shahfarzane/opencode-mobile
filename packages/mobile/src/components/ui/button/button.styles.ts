import { tv } from "@/lib/styles";
import { combineStyles } from "@/lib/styles";

/**
 * Button root styles using tailwind-variants
 */
const root = tv({
  base: "flex-row items-center justify-center",
  variants: {
    variant: {
      primary: "bg-primary",
      secondary: "bg-secondary",
      outline: "bg-transparent border border-border",
      ghost: "bg-transparent",
      destructive: "bg-destructive",
      warning: "bg-warning",
      muted: "bg-muted",
      info: "bg-info",
    },
    size: {
      xs: "h-7 px-2 gap-1 rounded-md",
      sm: "h-9 px-3 gap-1.5 rounded-lg",
      md: "h-11 px-4 gap-2 rounded-lg",
      lg: "h-14 px-6 gap-2.5 rounded-lg",
      "icon-sm": "h-8 w-8 rounded-lg",
      "icon-md": "h-10 w-10 rounded-lg",
      "icon-lg": "h-12 w-12 rounded-lg",
    },
    isDisabled: {
      true: "opacity-disabled",
    },
    isLoading: {
      true: "opacity-70",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    isDisabled: false,
    isLoading: false,
  },
});

/**
 * Button label styles using tailwind-variants
 */
const label = tv({
  base: "text-center",
  variants: {
    variant: {
      primary: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      outline: "text-foreground",
      ghost: "text-foreground",
      destructive: "text-destructive-foreground",
      warning: "text-warning-foreground",
      muted: "text-muted-foreground",
      info: "text-info-foreground",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      "icon-sm": "text-sm",
      "icon-md": "text-base",
      "icon-lg": "text-lg",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

/**
 * Button spinner styles
 */
const spinner = tv({
  base: "",
  variants: {
    variant: {
      primary: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      outline: "text-foreground",
      ghost: "text-foreground",
      destructive: "text-destructive-foreground",
      warning: "text-warning-foreground",
      muted: "text-muted-foreground",
      info: "text-info-foreground",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

/**
 * Combined button styles
 */
export const buttonStyles = combineStyles({
  root,
  label,
  spinner,
});
