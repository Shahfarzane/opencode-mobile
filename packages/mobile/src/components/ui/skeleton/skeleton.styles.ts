import { tv, combineStyles } from "@/lib/styles";

/**
 * Skeleton base styles
 */
const base = tv({
  base: "overflow-hidden bg-muted",
  variants: {
    variant: {
      rectangle: "rounded-2xl",
      circle: "rounded-full",
      text: "rounded-lg",
    },
  },
  defaultVariants: {
    variant: "rectangle",
  },
});

/**
 * Skeleton text container styles
 */
const textContainer = tv({
  base: "gap-2",
  variants: {},
});

/**
 * Skeleton card container styles
 */
const cardContainer = tv({
  base: "p-4 rounded-2xl border border-border bg-card gap-3",
  variants: {},
});

/**
 * Skeleton card header styles
 */
const cardHeader = tv({
  base: "flex-row items-center gap-3",
  variants: {},
});

/**
 * Skeleton card header content styles
 */
const cardHeaderContent = tv({
  base: "flex-1 gap-1",
  variants: {},
});

/**
 * Skeleton message container styles
 */
const messageContainer = tv({
  base: "px-4 py-1",
  variants: {
    isUser: {
      true: "items-end",
      false: "items-start",
    },
  },
  defaultVariants: {
    isUser: false,
  },
});

/**
 * Skeleton message bubble styles
 */
const messageBubble = tv({
  base: "p-3 rounded-xl min-w-[100px]",
  variants: {
    isUser: {
      true: "self-end max-w-[85%]",
      false: "self-start max-w-[90%]",
    },
  },
  defaultVariants: {
    isUser: false,
  },
});

/**
 * Combined skeleton styles
 */
export const skeletonStyles = combineStyles({
  base,
  textContainer,
  cardContainer,
  cardHeader,
  cardHeaderContent,
  messageContainer,
  messageBubble,
});
