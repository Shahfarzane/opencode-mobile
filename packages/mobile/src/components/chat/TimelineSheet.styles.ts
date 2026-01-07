import { tv, combineStyles } from "@/lib/styles";

const header = tv({
  base: "flex-row items-center justify-between px-5 py-3 border-b",
  variants: {},
});

const headerTitle = tv({
  base: "flex-row items-center gap-2",
  variants: {},
});

const scrollContent = tv({
  base: "p-4",
  variants: {},
});

const emptyState = tv({
  base: "items-center py-10",
  variants: {},
});

const turnItem = tv({
  base: "flex-row mb-2",
  variants: {},
});

const turnIndicator = tv({
  base: "w-8 items-center",
  variants: {},
});

const turnDot = tv({
  base: "w-6 h-6 rounded-full items-center justify-center",
  variants: {},
});

const turnLine = tv({
  base: "w-0.5 flex-1 mt-1",
  variants: {},
});

const turnContent = tv({
  base: "flex-1 pl-2",
  variants: {},
});

const turnCard = tv({
  base: "rounded-xl p-3",
  variants: {},
});

const turnHeader = tv({
  base: "flex-row items-center justify-between mb-1.5",
  variants: {},
});

const messagePreview = tv({
  base: "leading-5",
  variants: {},
});

const assistantPreview = tv({
  base: "mt-2 p-2 rounded-md",
  variants: {},
});

const turnActions = tv({
  base: "flex-row gap-2 mt-2.5",
  variants: {},
});

const actionButton = tv({
  base: "flex-row items-center gap-1 px-2.5 py-1.5 rounded-md",
  variants: {},
});

export const timelineSheetStyles = combineStyles({
  header,
  headerTitle,
  scrollContent,
  emptyState,
  turnItem,
  turnIndicator,
  turnDot,
  turnLine,
  turnContent,
  turnCard,
  turnHeader,
  messagePreview,
  assistantPreview,
  turnActions,
  actionButton,
});
