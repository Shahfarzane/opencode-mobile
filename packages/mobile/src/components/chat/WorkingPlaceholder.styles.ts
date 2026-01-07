import { tv, combineStyles } from "@/lib/styles";

const container = tv({
  base: "flex-row items-center px-4 py-2 gap-2",
  variants: {},
});

const indicator = tv({
  base: "w-2 h-2 rounded-full relative",
  variants: {},
});

const pulse = tv({
  base: "absolute top-0 left-0 w-2 h-2 rounded-full",
  variants: {},
});

export const workingPlaceholderStyles = combineStyles({
  container,
  indicator,
  pulse,
});
