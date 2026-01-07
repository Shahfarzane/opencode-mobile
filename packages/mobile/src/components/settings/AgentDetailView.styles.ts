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
 * Header styles
 */
const header = tv({
  base: "flex-row items-center justify-between px-4 py-2",
  variants: {},
});

/**
 * Back button styles
 */
const backButton = tv({
  base: "flex-row items-center gap-2",
  variants: {},
});

/**
 * Save button styles
 */
const saveButton = tv({
  base: "px-3.5 py-1.5 rounded-md min-w-[50px] items-center",
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
  base: "px-4 pb-8 gap-4",
  variants: {},
});

/**
 * Field container styles
 */
const field = tv({
  base: "gap-1.5",
  variants: {},
});

/**
 * Input styles
 */
const input = tv({
  base: "px-3 py-2 border rounded-md",
  variants: {},
});

/**
 * Textarea styles
 */
const textarea = tv({
  base: "px-3 py-2.5 border rounded-md min-h-[120px]",
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
 * Select list styles
 */
const selectList = tv({
  base: "border rounded-md overflow-hidden",
  variants: {},
});

/**
 * Select item styles
 */
const selectItem = tv({
  base: "px-3 py-2.5",
  variants: {
    selected: {
      true: "",
      false: "",
    },
    hasTopBorder: {
      true: "border-t",
      false: "",
    },
  },
  defaultVariants: {
    selected: false,
    hasTopBorder: false,
  },
});

export const agentDetailViewStyles = combineStyles({
  container,
  centered,
  header,
  backButton,
  saveButton,
  scroll,
  content,
  field,
  input,
  textarea,
  section,
  selectList,
  selectItem,
});
