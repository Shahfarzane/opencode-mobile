import { tv, combineStyles } from "@/lib/styles";

const container = tv({
  base: "flex-row items-center gap-1",
  variants: {},
});

const modalOverlay = tv({
  base: "flex-1 justify-center items-center p-6",
  variants: {},
});

const modalContent = tv({
  base: "w-full max-w-xs rounded-2xl p-4",
  variants: {},
});

const modalTitle = tv({
  base: "mb-3",
  variants: {},
});

const statsContainer = tv({
  base: "rounded-xl p-3",
  variants: {},
});

const statRow = tv({
  base: "flex-row justify-between items-center py-1",
  variants: {},
});

const statRowLast = tv({
  base: "mt-2 pt-2",
  variants: {},
});

export const contextUsageDisplayStyles = combineStyles({
  container,
  modalOverlay,
  modalContent,
  modalTitle,
  statsContainer,
  statRow,
  statRowLast,
});
