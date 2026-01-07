import { tv, combineStyles } from "@/lib/styles";

/**
 * Settings switch container styles
 */
const container = tv({
  base: "flex-row items-center gap-3 py-1",
  variants: {
    isDisabled: {
      true: "opacity-disabled",
    },
  },
  defaultVariants: {
    isDisabled: false,
  },
});

/**
 * Content container styles
 */
const content = tv({
  base: "flex-1 gap-0.5",
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
 * Description styles
 */
const description = tv({
  base: "text-muted-foreground",
  variants: {},
});

export const settingsSwitchStyles = combineStyles({
  container,
  content,
  label,
  description,
});
