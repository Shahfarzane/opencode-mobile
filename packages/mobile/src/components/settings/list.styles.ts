import { tv, combineStyles } from "@/lib/styles";

/**
 * Shared styles for list components (AgentsList, CommandsList, etc.)
 */

const container = tv({ base: "flex-1", variants: {} });
const loadingContainer = tv({ base: "flex-1 items-center justify-center", variants: {} });
const header = tv({ base: "flex-row justify-between items-center px-4 py-3 border-b", variants: {} });
const headerSimple = tv({ base: "px-4 py-3 border-b", variants: {} });
const addButton = tv({ base: "flex-row items-center gap-1 px-2.5 py-1.5 rounded-md", variants: {} });
const section = tv({ base: "pt-3", variants: {} });
const sectionTitle = tv({ base: "px-4 pb-2 tracking-wide", variants: {} });
const emptyContainer = tv({ base: "flex-1 items-center justify-center py-12 gap-3", variants: {} });
const createButton = tv({ base: "flex-row items-center gap-2 px-4 py-3 rounded-lg mt-2", variants: {} });
const colorDot = tv({ base: "w-[18px] h-[18px] rounded-full", variants: {} });

export const listStyles = combineStyles({
  container,
  loadingContainer,
  header,
  headerSimple,
  addButton,
  section,
  sectionTitle,
  emptyContainer,
  createButton,
  colorDot,
});
