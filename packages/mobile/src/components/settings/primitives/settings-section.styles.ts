import { tv, combineStyles } from "@/lib/styles";

/**
 * Settings section container styles
 */
const container = tv({
  base: "mt-4",
  variants: {
    isFirst: {
      true: "mt-0",
    },
  },
  defaultVariants: {
    isFirst: false,
  },
});

/**
 * Divider styles
 */
const divider = tv({
  base: "h-px mb-4 bg-border",
  variants: {},
});

/**
 * Header container styles
 */
const headerContainer = tv({
  base: "mb-3",
  variants: {},
});

/**
 * Title styles
 */
const title = tv({
  base: "mb-1 text-foreground",
  variants: {},
});

/**
 * Description styles
 */
const description = tv({
  base: "text-muted-foreground",
  variants: {},
});

/**
 * Content container styles
 */
const content = tv({
  base: "",
  variants: {},
});

export const settingsSectionStyles = combineStyles({
  container,
  divider,
  headerContainer,
  title,
  description,
  content,
});
