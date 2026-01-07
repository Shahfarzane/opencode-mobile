import { tv, combineStyles } from "@/lib/styles";

const container = tv({
  base: "flex-1 relative",
  variants: {},
});

const shadowTop = tv({
  base: "absolute top-0 left-0 right-0",
  variants: {},
});

const shadowBottom = tv({
  base: "absolute bottom-0 left-0 right-0",
  variants: {},
});

const shadowLeft = tv({
  base: "absolute top-0 bottom-0 left-0",
  variants: {},
});

const shadowRight = tv({
  base: "absolute top-0 bottom-0 right-0",
  variants: {},
});

export const scrollShadowStyles = combineStyles({
  container,
  shadowTop,
  shadowBottom,
  shadowLeft,
  shadowRight,
});
