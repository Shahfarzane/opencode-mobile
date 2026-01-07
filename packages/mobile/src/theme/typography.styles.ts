import { MOBILE_TYPOGRAPHY } from "@openchamber/shared/typography";
import { StyleSheet, type TextStyle } from "react-native";

function remToPixels(rem: string): number {
	const value = parseFloat(rem);
	return Math.round(value * 16);
}

/**
 * Sans-serif font family for UI text (headers, labels, buttons, settings).
 * Matches desktop: --font-sans: "IBM Plex Sans"
 */
export const FontFamilySans = {
	regular: "IBMPlexSans-Regular",
	medium: "IBMPlexSans-Medium",
	semiBold: "IBMPlexSans-SemiBold",
	bold: "IBMPlexSans-Bold",
} as const;

/**
 * Monospace font family for code blocks and technical content.
 * Matches desktop: --font-mono: "IBM Plex Mono"
 */
export const FontFamilyMono = {
	regular: "IBMPlexMono-Regular",
	medium: "IBMPlexMono-Medium",
	semiBold: "IBMPlexMono-SemiBold",
	bold: "IBMPlexMono-Bold",
} as const;

/**
 * Default font family - Sans for UI text.
 * Use FontFamilyMono explicitly for code/technical content.
 */
export const FontFamily = FontFamilySans;

/**
 * Shorthand exports for common usage patterns.
 * Fonts.regular, Fonts.medium, etc. refer to Sans fonts.
 */
export const Fonts = {
	// Sans fonts (UI text)
	regular: FontFamilySans.regular,
	medium: FontFamilySans.medium,
	semiBold: FontFamilySans.semiBold,
	bold: FontFamilySans.bold,
	// Mono fonts (code, technical)
	monoRegular: FontFamilyMono.regular,
	monoMedium: FontFamilyMono.medium,
	monoSemiBold: FontFamilyMono.semiBold,
	monoBold: FontFamilyMono.bold,
} as const;

type FontWeight =
	| "400"
	| "500"
	| "600"
	| "700"
	| "regular"
	| "medium"
	| "semibold"
	| "bold";

/**
 * Get the correct Sans font family for a given weight.
 * In React Native, fontWeight style doesn't work with custom fonts -
 * you must use the specific fontFamily name for each weight variant.
 */
export function getFontFamily(weight: FontWeight = "regular"): string {
	switch (weight) {
		case "700":
		case "bold":
			return FontFamilySans.bold;
		case "600":
		case "semibold":
			return FontFamilySans.semiBold;
		case "500":
		case "medium":
			return FontFamilySans.medium;
		case "400":
		case "regular":
		default:
			return FontFamilySans.regular;
	}
}

/**
 * Get the correct Mono font family for a given weight.
 */
export function getMonoFontFamily(weight: FontWeight = "regular"): string {
	switch (weight) {
		case "700":
		case "bold":
			return FontFamilyMono.bold;
		case "600":
		case "semibold":
			return FontFamilyMono.semiBold;
		case "500":
		case "medium":
			return FontFamilyMono.medium;
		case "400":
		case "regular":
		default:
			return FontFamilyMono.regular;
	}
}

/**
 * Helper to create a text style with the correct Sans font family for the weight.
 * Use this instead of { fontWeight: "600" } which doesn't work in React Native.
 */
export function fontStyle(weight: FontWeight = "regular") {
	return { fontFamily: getFontFamily(weight) };
}

/**
 * Helper to create a text style with the correct Mono font family for the weight.
 */
export function monoFontStyle(weight: FontWeight = "regular") {
	return { fontFamily: getMonoFontFamily(weight) };
}

export const FontSizes = {
	markdown: remToPixels(MOBILE_TYPOGRAPHY.markdown),
	code: remToPixels(MOBILE_TYPOGRAPHY.code),
	uiHeader: remToPixels(MOBILE_TYPOGRAPHY.uiHeader),
	uiLabel: remToPixels(MOBILE_TYPOGRAPHY.uiLabel),
	meta: remToPixels(MOBILE_TYPOGRAPHY.meta),
	micro: remToPixels(MOBILE_TYPOGRAPHY.micro),
	xs: 12, // 0.75rem - matches desktop text-xs
	microSmall: 11, // 0.7rem - matches desktop git stats text-[0.7rem]
	xxs: 10, // Very small text for UI elements like turn numbers
	h1: 24,
	h2: 20,
	h3: 18,
	h4: 16,
} as const;

export const LineHeights = {
	tight: 1.25,
	normal: 1.5,
	relaxed: 1.625,
} as const;

// Fixed line heights matching desktop CSS variables
// Desktop uses fixed values, not multipliers
export const FixedLineHeights = {
	ui: 16, // 1rem - for badges, labels, captions, buttons
	body: 24, // 1.5rem - for markdown body text
	heading: 20, // 1.25rem - for headings
	code: 22, // 1.4rem - for code blocks
} as const;

interface TypographyStyles {
	// Content styles (use Sans for body, Mono for code)
	markdown: TextStyle;
	code: TextStyle;
	// UI styles (use Sans)
	uiHeader: TextStyle;
	uiLabel: TextStyle;
	meta: TextStyle;
	micro: TextStyle;
	// Heading styles (use Sans)
	h1: TextStyle;
	h2: TextStyle;
	h3: TextStyle;
	h4: TextStyle;
	// Body styles (use Sans)
	body: TextStyle;
	bodySmall: TextStyle;
	caption: TextStyle;
	// Button styles (use Sans)
	button: TextStyle;
	buttonSmall: TextStyle;
}

export const typography = StyleSheet.create<TypographyStyles>({
	// Body text uses Sans with fixed 24px line height
	// (matches desktop --markdown-body-line-height: 1.5rem)
	markdown: {
		fontFamily: FontFamilySans.regular,
		fontSize: FontSizes.markdown,
		lineHeight: FixedLineHeights.body,
	},
	// Code uses Mono with fixed 22px line height
	// (matches desktop --code-block-line-height: 1.4rem)
	code: {
		fontFamily: FontFamilyMono.regular,
		fontSize: FontSizes.code,
		lineHeight: FixedLineHeights.code,
	},
	// UI elements use Sans with fixed 16px line height
	// (matches desktop --ui-label-line-height: 1rem)
	uiHeader: {
		fontFamily: FontFamilySans.semiBold,
		fontSize: FontSizes.uiHeader,
		lineHeight: FixedLineHeights.heading,
	},
	uiLabel: {
		fontFamily: FontFamilySans.medium,
		fontSize: FontSizes.uiLabel,
		lineHeight: FixedLineHeights.ui,
		letterSpacing: 0.2, // Reduced for Sans (was 0.4 for Mono)
	},
	meta: {
		fontFamily: FontFamilySans.regular,
		fontSize: FontSizes.meta,
		lineHeight: FixedLineHeights.ui,
	},
	// Micro (badges) use Sans with fixed 16px line height
	// (matches desktop --ui-badge-line-height: 1rem)
	micro: {
		fontFamily: FontFamilySans.regular,
		fontSize: FontSizes.micro,
		lineHeight: FixedLineHeights.ui,
		letterSpacing: 0.2, // Reduced for Sans (was 0.35 for Mono)
	},
	// Headings use Sans with tight line height
	// (matches desktop --h1-line-height: 1.25rem)
	h1: {
		fontFamily: FontFamilySans.bold,
		fontSize: FontSizes.h1,
		lineHeight: FontSizes.h1 * LineHeights.tight,
	},
	h2: {
		fontFamily: FontFamilySans.semiBold,
		fontSize: FontSizes.h2,
		lineHeight: FontSizes.h2 * LineHeights.tight,
	},
	h3: {
		fontFamily: FontFamilySans.semiBold,
		fontSize: FontSizes.h3,
		lineHeight: FontSizes.h3 * LineHeights.tight,
	},
	h4: {
		fontFamily: FontFamilySans.semiBold,
		fontSize: FontSizes.h4,
		lineHeight: FontSizes.h4 * LineHeights.tight,
	},
	body: {
		fontFamily: FontFamilySans.regular,
		fontSize: FontSizes.markdown,
		lineHeight: FixedLineHeights.body,
	},
	bodySmall: {
		fontFamily: FontFamilySans.regular,
		fontSize: FontSizes.uiLabel,
		lineHeight: FixedLineHeights.ui,
	},
	caption: {
		fontFamily: FontFamilySans.regular,
		fontSize: FontSizes.micro,
		lineHeight: FixedLineHeights.ui,
		letterSpacing: 0.2,
	},
	button: {
		fontFamily: FontFamilySans.medium,
		fontSize: FontSizes.uiLabel,
		lineHeight: FixedLineHeights.ui,
		letterSpacing: 0.15, // Reduced for Sans (was 0.28 for Mono)
	},
	buttonSmall: {
		fontFamily: FontFamilySans.medium,
		fontSize: FontSizes.micro,
		lineHeight: FixedLineHeights.ui,
		letterSpacing: 0.15,
	},
});

export default typography;
