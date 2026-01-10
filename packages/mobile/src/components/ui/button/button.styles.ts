import { tv } from "@/lib/styles";
import { combineStyles } from "@/lib/styles";

/**
 * Button root styles using tailwind-variants
 *
 * Size mapping to match desktop PWA:
 * - Desktop default (h-9, 36px) = Mobile "sm" or "desktop"
 * - Desktop sm (h-8, 32px) = Mobile "xs" or "desktop-sm"
 * - Desktop lg (h-10, 40px) = Mobile "desktop-lg"
 * - Desktop icon (size-9, 36px) = Mobile "icon-desktop"
 *
 * Mobile-optimized sizes use larger touch targets (44px minimum):
 * - Mobile default (44px) = "md"
 * - Mobile large (56px) = "lg"
 */
const root = tv({
  base: "flex-row items-center justify-center",
  variants: {
    variant: {
      primary: "bg-primary",
      secondary: "bg-secondary",
      outline: "bg-transparent border border-border dark:bg-input/30 dark:border-input",
      ghost: "bg-transparent dark:active:bg-accent/50",
      destructive: "bg-destructive dark:bg-destructive/60",
      warning: "bg-warning",
      muted: "bg-muted",
      info: "bg-info",
    },
    size: {
      // Mobile-optimized sizes (touch-friendly)
      xs: "h-7 px-2 gap-1 rounded-md",
      sm: "h-9 px-3 gap-1.5 rounded-lg",
      md: "h-11 px-4 gap-2 rounded-lg",
      lg: "h-14 px-6 gap-2.5 rounded-lg",
      // Icon button sizes
      "icon-xs": "h-6 w-6 rounded-md",
      "icon-sm": "h-8 w-8 rounded-lg",
      "icon-md": "h-10 w-10 rounded-lg",
      "icon-lg": "h-12 w-12 rounded-lg",
      // Desktop-equivalent sizes (for parity with PWA)
      "desktop": "h-9 px-4 gap-2 rounded-lg",        // h-9 = 36px (desktop default)
      "desktop-sm": "h-8 px-3 gap-1.5 rounded-lg",   // h-8 = 32px (desktop sm)
      "desktop-lg": "h-10 px-6 gap-2 rounded-lg",    // h-10 = 40px (desktop lg)
      "icon-desktop": "h-9 w-9 rounded-lg",          // size-9 = 36px (desktop icon)
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
      // Mobile-optimized sizes
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      // Icon button sizes
      "icon-xs": "text-xs",
      "icon-sm": "text-sm",
      "icon-md": "text-base",
      "icon-lg": "text-lg",
      // Desktop-equivalent sizes
      "desktop": "text-sm",      // Matches desktop typography-ui-label
      "desktop-sm": "text-xs",   // Smaller desktop text
      "desktop-lg": "text-sm",   // Desktop lg still uses ui-label size
      "icon-desktop": "text-sm", // Desktop icon text
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
