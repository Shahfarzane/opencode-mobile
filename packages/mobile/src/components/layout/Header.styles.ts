import { tv, combineStyles } from "@/lib/styles";

const container = tv({
  base: "border-b",
  variants: {},
});

const content = tv({
  base: "flex-row items-center justify-between px-3 py-2",
  variants: {},
});

const leftSection = tv({
  base: "flex-row items-center gap-2",
  variants: {},
});

const rightSection = tv({
  base: "flex-row items-center gap-1.5",
  variants: {},
});

const iconButton = tv({
  base: "w-9 h-9 items-center justify-center",
  variants: {},
});

const tabContent = tv({
  base: "relative",
  variants: {},
});

const updateDot = tv({
  base: "absolute top-0 right-0 w-2 h-2 rounded-full",
  variants: {},
});

const changeDot = tv({
  base: "absolute top-0 right-0 w-2 h-2 rounded-full",
  variants: {},
});

const countBadge = tv({
  base: "absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full items-center justify-center",
  variants: {},
});

const countBadgeText = tv({
  base: "text-xs font-semibold",
  variants: {},
});

export const headerStyles = combineStyles({
  container,
  content,
  leftSection,
  rightSection,
  iconButton,
  tabContent,
  updateDot,
  changeDot,
  countBadge,
  countBadgeText,
});
