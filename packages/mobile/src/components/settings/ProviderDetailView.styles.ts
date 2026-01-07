import { tv, combineStyles } from "@/lib/styles";

/**
 * Container styles
 */
const container = tv({
  base: "flex-1",
  variants: {},
});

/**
 * Centered loader styles
 */
const centered = tv({
  base: "flex-1 items-center justify-center",
  variants: {},
});

/**
 * Back button styles
 */
const backButton = tv({
  base: "flex-row items-center gap-2 px-4 py-2",
  variants: {},
});

/**
 * Scroll view styles
 */
const scroll = tv({
  base: "flex-1",
  variants: {},
});

/**
 * Content styles
 */
const content = tv({
  base: "px-4 pb-8 gap-6",
  variants: {},
});

/**
 * Section styles
 */
const section = tv({
  base: "pt-4 border-t",
  variants: {},
});

/**
 * Section title styles
 */
const sectionTitle = tv({
  base: "mb-2",
  variants: {},
});

/**
 * Input row styles
 */
const inputRow = tv({
  base: "flex-row gap-2",
  variants: {},
});

/**
 * Input styles
 */
const input = tv({
  base: "flex-1 px-3 py-2 border rounded-md",
  variants: {},
});

/**
 * Button styles
 */
const button = tv({
  base: "px-3.5 py-2 rounded-md items-center justify-center min-w-[60px]",
  variants: {
    disabled: {
      true: "opacity-60",
      false: "opacity-100",
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

/**
 * Model list styles
 */
const modelList = tv({
  base: "border rounded-md overflow-hidden",
  variants: {},
});

/**
 * Model item styles
 */
const modelItem = tv({
  base: "flex-row justify-between items-center px-3 py-2.5",
  variants: {
    hasTopBorder: {
      true: "border-t",
      false: "",
    },
  },
  defaultVariants: {
    hasTopBorder: false,
  },
});

export const providerDetailViewStyles = combineStyles({
  container,
  centered,
  backButton,
  scroll,
  content,
  section,
  sectionTitle,
  inputRow,
  input,
  button,
  modelList,
  modelItem,
});
