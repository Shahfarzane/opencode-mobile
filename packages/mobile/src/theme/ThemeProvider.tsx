import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { flexokiDarkTheme, flexokiLightTheme, type Theme } from '@openchamber/shared/themes';

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
	variant: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function createColors(theme: Theme): ThemeColors {
	const { colors } = theme;

	return {
		background: colors.surface.background,
		foreground: colors.surface.foreground,
		muted: colors.surface.muted,
		mutedForeground: colors.surface.mutedForeground,
		card: colors.surface.elevated,
		cardForeground: colors.surface.elevatedForeground,
		popover: colors.surface.elevated,
		popoverForeground: colors.surface.elevatedForeground,
		subtle: colors.surface.subtle,
		overlay: colors.surface.overlay,

		primary: colors.primary.base,
		primaryHover: colors.primary.hover ?? colors.primary.base,
		primaryActive: colors.primary.active ?? colors.primary.base,
		primaryForeground: colors.primary.foreground ?? colors.surface.background,
		primaryMuted: colors.primary.muted ?? colors.primary.base,

		border: colors.interactive.border,
		borderHover: colors.interactive.borderHover,
		borderFocus: colors.interactive.borderFocus,
		input: colors.surface.muted,
		ring: colors.primary.base,
		focus: colors.interactive.focus,
		focusRing: colors.interactive.focusRing,
		selection: colors.interactive.selection,
		selectionForeground: colors.interactive.selectionForeground,

		error: colors.status.error,
		errorForeground: colors.status.errorForeground,
		errorBackground: colors.status.errorBackground,
		errorBorder: colors.status.errorBorder,
		warning: colors.status.warning,
		warningForeground: colors.status.warningForeground,
		warningBackground: colors.status.warningBackground,
		warningBorder: colors.status.warningBorder,
		success: colors.status.success,
		successForeground: colors.status.successForeground,
		successBackground: colors.status.successBackground,
		successBorder: colors.status.successBorder,
		info: colors.status.info,
		infoForeground: colors.status.infoForeground,
		infoBackground: colors.status.infoBackground,
		infoBorder: colors.status.infoBorder,

		destructive: colors.status.error,
		destructiveForeground: colors.status.errorForeground,

		accent: colors.surface.subtle,
		accentForeground: colors.surface.foreground,

		secondary: colors.surface.muted,
		secondaryForeground: colors.surface.foreground,

		chatUserMessage: colors.chat?.userMessage ?? colors.surface.foreground,
		chatUserMessageBackground: colors.chat?.userMessageBackground ?? colors.surface.elevated,
		chatAssistantMessage: colors.chat?.assistantMessage ?? colors.surface.foreground,
		chatAssistantMessageBackground: colors.chat?.assistantMessageBackground ?? colors.surface.background,
		chatTimestamp: colors.chat?.timestamp ?? colors.surface.mutedForeground,
		chatDivider: colors.chat?.divider ?? colors.interactive.border,

		toolBackground: colors.tools?.background ?? colors.surface.muted,
		toolBorder: colors.tools?.border ?? colors.interactive.border,
		toolHeaderHover: colors.tools?.headerHover ?? colors.interactive.hover,
		toolIcon: colors.tools?.icon ?? colors.surface.mutedForeground,
		toolTitle: colors.tools?.title ?? colors.surface.foreground,
		toolDescription: colors.tools?.description ?? colors.surface.mutedForeground,
		toolEditAdded: colors.tools?.edit.added ?? colors.status.success,
		toolEditAddedBackground: colors.tools?.edit.addedBackground ?? colors.status.successBackground,
		toolEditRemoved: colors.tools?.edit.removed ?? colors.status.error,
		toolEditRemovedBackground: colors.tools?.edit.removedBackground ?? colors.status.errorBackground,
		toolEditLineNumber: colors.tools?.edit.lineNumber ?? colors.surface.mutedForeground,

		markdownHeading1: colors.markdown?.heading1 ?? colors.surface.foreground,
		markdownHeading2: colors.markdown?.heading2 ?? colors.surface.foreground,
		markdownHeading3: colors.markdown?.heading3 ?? colors.surface.foreground,
		markdownHeading4: colors.markdown?.heading4 ?? colors.surface.foreground,
		markdownLink: colors.markdown?.link ?? colors.status.info,
		markdownLinkHover: colors.markdown?.linkHover ?? colors.status.info,
		markdownInlineCode: colors.markdown?.inlineCode ?? colors.status.success,
		markdownInlineCodeBackground: colors.markdown?.inlineCodeBackground ?? colors.surface.muted,
		markdownBlockquote: colors.markdown?.blockquote ?? colors.surface.mutedForeground,
		markdownBlockquoteBorder: colors.markdown?.blockquoteBorder ?? colors.interactive.border,
		markdownListMarker: colors.markdown?.listMarker ?? colors.surface.mutedForeground,

		syntaxBackground: colors.syntax.base.background,
		syntaxForeground: colors.syntax.base.foreground,
		syntaxComment: colors.syntax.base.comment,
		syntaxKeyword: colors.syntax.base.keyword,
		syntaxString: colors.syntax.base.string,
		syntaxNumber: colors.syntax.base.number,
		syntaxFunction: colors.syntax.base.function,
		syntaxVariable: colors.syntax.base.variable,
		syntaxType: colors.syntax.base.type,
		syntaxOperator: colors.syntax.base.operator,

		diffAdded: colors.syntax.highlights?.diffAdded ?? colors.status.success,
		diffAddedBackground: colors.syntax.highlights?.diffAddedBackground ?? colors.status.successBackground,
		diffRemoved: colors.syntax.highlights?.diffRemoved ?? colors.status.error,
		diffRemovedBackground: colors.syntax.highlights?.diffRemovedBackground ?? colors.status.errorBackground,
		diffModified: colors.syntax.highlights?.diffModified ?? colors.status.info,
		diffModifiedBackground: colors.syntax.highlights?.diffModifiedBackground ?? colors.status.infoBackground,
		lineNumber: colors.syntax.highlights?.lineNumber ?? colors.surface.mutedForeground,
		lineNumberActive: colors.syntax.highlights?.lineNumberActive ?? colors.surface.foreground,
	};
}

interface ThemeProviderProps {
	children: React.ReactNode;
	forcedTheme?: 'light' | 'dark';
}

export function ThemeProvider({ children, forcedTheme }: ThemeProviderProps) {
	const systemColorScheme = useColorScheme();

	const value = useMemo<ThemeContextValue>(() => {
		const isDark = forcedTheme ? forcedTheme === 'dark' : systemColorScheme === 'dark';
		const theme = isDark ? flexokiDarkTheme : flexokiLightTheme;
		const colors = createColors(theme);

		return {
			theme,
			isDark,
			colors,
			variant: isDark ? 'dark' : 'light',
		};
	}, [systemColorScheme, forcedTheme]);

	return (
		<ThemeContext.Provider value={value}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}

export function useColors(): ThemeColors {
	return useTheme().colors;
}

export default ThemeProvider;
