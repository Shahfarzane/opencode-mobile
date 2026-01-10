import { tv, combineStyles } from "@/lib/styles";
import { Radius, SemanticSpacing, Spacing } from "@/theme";

// Mobile-optimized spacing constants using theme tokens (matches PWA mobile CSS)
export const MOBILE_SPACING = {
  inputBorderRadius: Radius.xl, // 12px - rounded-xl
  inputPaddingH: Spacing[3], // 12px - px-3
  inputPaddingV: Spacing[2.5], // 10px - py-2.5
  toolbarPaddingH: Spacing[1.5], // 6px - px-1.5
  toolbarPaddingV: Spacing[1.5], // 6px - py-1.5
  toolbarButtonSize: SemanticSpacing.buttonHeightSm, // 36px - h-9 w-9
  toolbarButtonRadius: Radius.lg, // 8px
  toolbarGap: Spacing[1.5], // 6px - gap-x-1.5
  bubbleRadius: Radius.xl, // 12px - rounded-xl
  agentBadgePaddingH: Spacing[1.5], // 6px - px-1.5
  agentBadgePaddingV: 0, // py-0
  agentBadgeRadius: Radius.DEFAULT, // 4px - rounded
};

const container = tv({
  base: "relative",
  variants: {},
});

const inputContainer = tv({
  base: "rounded-xl overflow-hidden",
  variants: {},
});

const textInput = tv({
  base: "min-h-[52px] max-h-[140px] px-3 py-2.5",
  variants: {},
});

const toolbar = tv({
  base: "flex-row items-center justify-between px-1.5 py-1.5 gap-1.5",
  variants: {},
});

const toolbarLeftSection = tv({
  base: "shrink-0",
  variants: {},
});

const toolbarRightSection = tv({
  // Match PWA mobile: gap-x-2 (8px) between model, agent, and action button
  base: "flex-1 flex-row items-center justify-end gap-2 min-w-0",
  variants: {},
});

const toolbarButton = tv({
  base: "w-9 h-9 items-center justify-center rounded-lg shrink-0",
  variants: {},
});

const modelInfoContainer = tv({
  base: "flex-1 min-w-0 overflow-hidden items-end",
  variants: {},
});

const modelSelector = tv({
  // Match PWA mobile: gap-1.5 (6px) between provider icon and model name
  base: "flex-row items-center gap-1.5 min-w-0",
  variants: {},
});

const agentPressable = tv({
  base: "shrink-0",
  variants: {},
});

const agentBadgeContainer = tv({
  base: "flex-row items-center gap-1",
  variants: {},
});

const triggerIcon = tv({
  base: "h-6 w-6 items-center justify-center rounded-md",
  variants: {},
});

const autocompleteOverlay = tv({
  // Match PWA: rounded-xl (12px), mb-2 (8px margin), border border-border
  base: "absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden",
  variants: {},
});

const autocompleteHeader = tv({
  base: "px-3 py-2",
  variants: {},
});

const autocompleteItem = tv({
  // Match PWA: flex items-start gap-2 px-3 py-2 (gap 8px, padding 12px/8px)
  base: "flex-row items-start gap-2 px-3 py-2",
  variants: {},
});

const autocompleteItemContent = tv({
  base: "flex-1 min-w-0",
  variants: {},
});

const autocompleteFooter = tv({
  // Match PWA: px-3 pt-1 pb-1.5 (12px horizontal, 4px top, 6px bottom)
  base: "px-3 pt-1 pb-1.5",
  variants: {},
});

export const chatInputStyles = combineStyles({
  container,
  inputContainer,
  textInput,
  toolbar,
  toolbarLeftSection,
  toolbarRightSection,
  toolbarButton,
  modelInfoContainer,
  modelSelector,
  agentPressable,
  agentBadgeContainer,
  triggerIcon,
  autocompleteOverlay,
  autocompleteHeader,
  autocompleteItem,
  autocompleteItemContent,
  autocompleteFooter,
});
