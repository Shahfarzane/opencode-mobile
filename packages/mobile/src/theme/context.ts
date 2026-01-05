import type { Theme } from "@openchamber/shared/themes";
import { createContext } from "react";

export interface ThemeColors {
	background: string;
	foreground: string;
	muted: string;
	mutedForeground: string;
	card: string;
	cardForeground: string;
	popover: string;
	popoverForeground: string;
	subtle: string;
	overlay: string;

	primary: string;
	primaryHover: string;
	primaryActive: string;
	primaryForeground: string;
	primaryMuted: string;

	border: string;
	borderHover: string;
	borderFocus: string;
	input: string;
	ring: string;
	focus: string;
	focusRing: string;
	selection: string;
	selectionForeground: string;

	error: string;
	errorForeground: string;
	errorBackground: string;
	errorBorder: string;
	warning: string;
	warningForeground: string;
	warningBackground: string;
	warningBorder: string;
	success: string;
	successForeground: string;
	successBackground: string;
	successBorder: string;
	info: string;
	infoForeground: string;
	infoBackground: string;
	infoBorder: string;

	destructive: string;
	destructiveForeground: string;

	accent: string;
	accentForeground: string;

	secondary: string;
	secondaryForeground: string;

	chatUserMessage: string;
	chatUserMessageBackground: string;
	chatAssistantMessage: string;
	chatAssistantMessageBackground: string;
	chatTimestamp: string;
	chatDivider: string;

	toolBackground: string;
	toolBorder: string;
	toolHeaderHover: string;
	toolIcon: string;
	toolTitle: string;
	toolDescription: string;
	toolEditAdded: string;
	toolEditAddedBackground: string;
	toolEditRemoved: string;
	toolEditRemovedBackground: string;
	toolEditLineNumber: string;

	markdownHeading1: string;
	markdownHeading2: string;
	markdownHeading3: string;
	markdownHeading4: string;
	markdownLink: string;
	markdownLinkHover: string;
	markdownInlineCode: string;
	markdownInlineCodeBackground: string;
	markdownBlockquote: string;
	markdownBlockquoteBorder: string;
	markdownListMarker: string;

	syntaxBackground: string;
	syntaxForeground: string;
	syntaxComment: string;
	syntaxKeyword: string;
	syntaxString: string;
	syntaxNumber: string;
	syntaxFunction: string;
	syntaxVariable: string;
	syntaxType: string;
	syntaxOperator: string;

	diffAdded: string;
	diffAddedBackground: string;
	diffRemoved: string;
	diffRemovedBackground: string;
	diffModified: string;
	diffModifiedBackground: string;
	lineNumber: string;
	lineNumberActive: string;
}

export interface ThemeContextValue {
	theme: Theme;
	isDark: boolean;
	colors: ThemeColors;
	variant: "light" | "dark";
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
