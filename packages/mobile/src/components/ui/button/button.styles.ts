import { tv, combineStyles } from "@/lib/styles";

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
  // Base layout styles only - colors handled via inline styles for theme support
  base: "relative overflow-hidden flex-row items-center justify-center",
  variants: {
    // Variant classes for non-color styles only (colors set inline via useTheme)
    variant: {
      primary: "",
      secondary: "",
      outline: "border",
      ghost: "",
      destructive: "",
      warning: "",
      muted: "",
      info: "",
    },
    size: {
      // Mobile-optimized sizes - using rounded-lg (8px) style like PWA
      xs: "h-7 px-2.5 gap-1",      // Compact size for toolbars
      sm: "h-8 px-3 gap-1.5",      // Small button
      md: "h-10 px-4 gap-2",       // Default mobile button
      lg: "h-12 px-5 gap-2",       // Large mobile button
      // Icon button sizes
      "icon-xs": "h-7 w-7",
      "icon-sm": "h-8 w-8",
      "icon-md": "h-10 w-10",
      "icon-lg": "h-12 w-12",
      // Desktop-equivalent sizes (for parity with PWA)
      "desktop": "h-9 px-4 gap-2",        // h-9 = 36px (desktop default)
      "desktop-sm": "h-8 px-3 gap-1.5",   // h-8 = 32px (desktop sm)
      "desktop-lg": "h-10 px-6 gap-2",    // h-10 = 40px (desktop lg)
      "icon-desktop": "h-9 w-9",          // size-9 = 36px (desktop icon)
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
