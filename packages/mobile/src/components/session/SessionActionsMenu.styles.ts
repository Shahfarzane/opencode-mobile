import { tv, combineStyles } from "@/lib/styles";

const overlay = tv({
  base: "flex-1 justify-center items-center",
  variants: {},
});

const menu = tv({
  base: "rounded-xl min-w-[180px] overflow-hidden",
  variants: {},
});

const menuItem = tv({
  base: "flex-row items-center gap-3 px-4 py-3.5",
  variants: {},
});

const divider = tv({
  base: "h-px",
  variants: {},
});

export const sessionActionsMenuStyles = combineStyles({
  overlay,
  menu,
  menuItem,
  divider,
});
