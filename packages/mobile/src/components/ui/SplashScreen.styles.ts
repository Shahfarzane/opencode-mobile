import { tv, combineStyles } from "@/lib/styles";

const container = tv({
  base: "flex-1 items-center justify-center absolute top-0 left-0 right-0 bottom-0 z-[9999]",
  variants: {},
});

const logoContainer = tv({
  base: "w-[180px] h-[180px] items-center justify-center",
  variants: {},
});

const logoOverlay = tv({
  base: "absolute w-[180px] h-[180px] items-center justify-center",
  variants: {},
});

export const splashScreenStyles = combineStyles({
  container,
  logoContainer,
  logoOverlay,
});
