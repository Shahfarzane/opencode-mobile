import { tv, combineStyles } from "@/lib/styles";

export const MAX_CODE_BLOCK_HEIGHT = 400;

const container = tv({
  base: "my-2 overflow-hidden rounded-lg w-full self-stretch",
  variants: {},
});

const header = tv({
  base: "flex-row items-center justify-between px-3 py-2",
  variants: {},
});

const languageInfo = tv({
  base: "flex-row items-center gap-2",
  variants: {},
});

const languageDot = tv({
  base: "h-2.5 w-2.5 rounded-full",
  variants: {},
});

const copyButton = tv({
  base: "rounded px-2 py-1",
  variants: {},
});

const codeScrollView = tv({
  base: "max-h-[400px]",
  variants: {},
});

const codeScrollContent = tv({
  base: "flex-grow",
  variants: {},
});

const verticalScrollView = tv({
  base: "flex-1",
  variants: {},
});

const verticalScrollContent = tv({
  base: "flex-grow",
  variants: {},
});

const codeContent = tv({
  base: "flex-row p-3",
  variants: {},
});

const codeLines = tv({
  base: "shrink-0",
  variants: {},
});

const lineNumbers = tv({
  base: "mr-3 items-end",
  variants: {},
});

const lineNumber = tv({
  base: "leading-5 opacity-50",
  variants: {},
});

const codeLine = tv({
  base: "leading-5",
  variants: {},
});

export const codeBlockStyles = combineStyles({
  container,
  header,
  languageInfo,
  languageDot,
  copyButton,
  codeScrollView,
  codeScrollContent,
  verticalScrollView,
  verticalScrollContent,
  codeContent,
  codeLines,
  lineNumbers,
  lineNumber,
  codeLine,
});
