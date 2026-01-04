import { flexokiDarkTheme, flexokiLightTheme } from '@openchamber/shared/themes';

const dark = flexokiDarkTheme.colors;
const light = flexokiLightTheme.colors;

export const FlexokiDark = {
	background: dark.surface.background,
	foreground: dark.surface.foreground,
	card: dark.surface.elevated,
	cardForeground: dark.surface.elevatedForeground,
	popover: dark.surface.elevated,
	popoverForeground: dark.surface.elevatedForeground,
	primary: dark.primary.base,
	primaryHover: dark.primary.hover ?? dark.primary.base,
	primaryForeground: dark.primary.foreground ?? dark.surface.background,
	muted: dark.surface.muted,
	mutedForeground: dark.surface.mutedForeground,
	secondary: dark.surface.muted,
	secondaryForeground: dark.surface.foreground,
	accent: dark.surface.subtle,
	accentForeground: dark.surface.foreground,
	destructive: dark.status.error,
	destructiveForeground: dark.status.errorForeground,
	success: dark.status.success,
	successForeground: dark.status.successForeground,
	info: dark.status.info,
	infoForeground: dark.status.infoForeground,
	warning: dark.status.warning,
	warningForeground: dark.status.warningForeground,
	border: dark.interactive.border,
	input: dark.surface.muted,
	ring: dark.primary.base,
} as const;

export const FlexokiLight = {
	background: light.surface.background,
	foreground: light.surface.foreground,
	card: light.surface.elevated,
	cardForeground: light.surface.elevatedForeground,
	popover: light.surface.elevated,
	popoverForeground: light.surface.elevatedForeground,
	primary: light.primary.base,
	primaryHover: light.primary.hover ?? light.primary.base,
	primaryForeground: light.primary.foreground ?? light.surface.background,
	muted: light.surface.muted,
	mutedForeground: light.surface.mutedForeground,
	secondary: light.surface.muted,
	secondaryForeground: light.surface.foreground,
	accent: light.surface.subtle,
	accentForeground: light.surface.foreground,
	destructive: light.status.error,
	destructiveForeground: light.status.errorForeground,
	success: light.status.success,
	successForeground: light.status.successForeground,
	info: light.status.info,
	infoForeground: light.status.infoForeground,
	warning: light.status.warning,
	warningForeground: light.status.warningForeground,
	border: light.interactive.border,
	input: light.surface.muted,
	ring: light.primary.base,
} as const;

export type ThemeColors = typeof FlexokiDark | typeof FlexokiLight;

export function getThemeColors(isDark: boolean): ThemeColors {
	return isDark ? FlexokiDark : FlexokiLight;
}
