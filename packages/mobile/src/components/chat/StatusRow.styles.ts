import { tv, combineStyles } from "@/lib/styles";

const container = tv({
  base: "flex-row items-center justify-between px-3 py-2 rounded-lg mb-2",
  variants: {},
});

const left = tv({
  base: "flex-row items-center gap-2 flex-1",
  variants: {},
});

const abortButton = tv({
  base: "flex-row items-center gap-1 px-2.5 py-1.5 rounded-md",
  variants: {},
});

export const statusRowStyles = combineStyles({
  container,
  left,
  abortButton,
});
