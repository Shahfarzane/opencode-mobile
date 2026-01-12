import { combineStyles, tv } from "@/lib/styles";

const container = tv({
	base: "flex-1 relative",
	variants: {},
});

const emptyContainer = tv({
	base: "flex-1 items-center justify-center px-8 gap-6",
	variants: {},
});

const textLoopContainer = tv({
	base: "min-h-[28px]",
	variants: {},
});

const phraseText = tv({
	base: "text-center",
	variants: {},
});

const listContent = tv({
	base: "pt-3 pb-4",
	variants: {},
});

const scrollToBottomButton = tv({
	base: "absolute bottom-3 self-center w-9 h-9 rounded-full items-center justify-center",
	variants: {},
});

export const messageListStyles = combineStyles({
	container,
	emptyContainer,
	textLoopContainer,
	phraseText,
	listContent,
	scrollToBottomButton,
});
