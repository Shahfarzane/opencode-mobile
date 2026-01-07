import { tv, combineStyles } from "@/lib/styles";

const container = tv({ base: "flex-1", variants: {} });
const centered = tv({ base: "flex-1 items-center justify-center", variants: {} });
const header = tv({ base: "flex-row items-center justify-between px-4 py-2", variants: {} });
const backButton = tv({ base: "flex-row items-center gap-2", variants: {} });
const saveButton = tv({
  base: "px-3.5 py-1.5 rounded-md min-w-[50px] items-center",
  variants: { disabled: { true: "opacity-60", false: "opacity-100" } },
  defaultVariants: { disabled: false },
});
const scroll = tv({ base: "flex-1", variants: {} });
const content = tv({ base: "px-4 pb-8 gap-4", variants: {} });
const field = tv({ base: "gap-1.5", variants: {} });
const input = tv({ base: "px-3 py-2 border rounded-md", variants: {} });
const textarea = tv({ base: "px-3 py-2.5 border rounded-md min-h-[100px]", variants: {} });
const section = tv({ base: "pt-4 border-t", variants: {} });
const selectList = tv({ base: "border rounded-md overflow-hidden", variants: {} });
const selectItem = tv({
  base: "px-3 py-2.5",
  variants: { hasTopBorder: { true: "border-t", false: "" } },
  defaultVariants: { hasTopBorder: false },
});
const switchRow = tv({ base: "flex-row items-center gap-3", variants: {} });

export const commandDetailViewStyles = combineStyles({
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
  switchRow,
});
