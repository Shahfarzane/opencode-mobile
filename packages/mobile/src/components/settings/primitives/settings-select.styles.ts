import { tv, combineStyles } from "@/lib/styles";

/**
 * Settings select container styles
 */
const container = tv({
  base: "gap-1.5",
  variants: {},
});

/**
 * Label row styles
 */
const labelRow = tv({
  base: "flex-row items-center",
  variants: {},
});

/**
 * Label styles
 */
const label = tv({
  base: "text-foreground",
  variants: {},
});

/**
 * Required indicator styles
 */
const required = tv({
  base: "text-destructive",
  variants: {},
});

/**
 * Description styles
 */
const description = tv({
  base: "-mt-0.5 text-muted-foreground",
  variants: {},
});

/**
 * Trigger button styles
 */
const trigger = tv({
  base: "flex-row items-center px-3 py-2.5 rounded-lg border gap-2 bg-muted",
  variants: {
    hasError: {
      true: "border-destructive",
      false: "border-border",
    },
  },
  defaultVariants: {
    hasError: false,
  },
});

/**
 * Trigger text styles
 */
const triggerText = tv({
  base: "flex-1",
  variants: {
    hasValue: {
      true: "text-foreground",
      false: "text-muted-foreground",
    },
  },
  defaultVariants: {
    hasValue: false,
  },
});

/**
 * Error text styles
 */
const error = tv({
  base: "text-destructive",
  variants: {},
});

/**
 * Modal overlay styles
 */
const overlay = tv({
  base: "flex-1 justify-center items-center p-6",
  variants: {},
});

/**
 * Dropdown container styles
 */
const dropdown = tv({
  base: "w-full max-h-[400px] rounded-xl border overflow-hidden",
  variants: {},
});

/**
 * Dropdown header styles
 */
const dropdownHeader = tv({
  base: "px-4 py-3 border-b",
  variants: {},
});

/**
 * Options list styles
 */
const optionsList = tv({
  base: "max-h-[350px]",
  variants: {},
});

/**
 * Option item styles
 */
const option = tv({
  base: "flex-row items-center px-4 py-3",
  variants: {
    isSelected: {
      true: "",
      false: "",
    },
  },
});

/**
 * Option content styles
 */
const optionContent = tv({
  base: "flex-1 gap-0.5",
  variants: {},
});

/**
 * Option label styles
 */
const optionLabel = tv({
  base: "",
  variants: {
    isSelected: {
      true: "text-primary",
      false: "text-foreground",
    },
  },
  defaultVariants: {
    isSelected: false,
  },
});

/**
 * Option description styles
 */
const optionDescription = tv({
  base: "text-muted-foreground",
  variants: {},
});

export const settingsSelectStyles = combineStyles({
  container,
  labelRow,
  label,
  required,
  description,
  trigger,
  triggerText,
  error,
  overlay,
  dropdown,
  dropdownHeader,
  optionsList,
  option,
  optionContent,
  optionLabel,
  optionDescription,
});
