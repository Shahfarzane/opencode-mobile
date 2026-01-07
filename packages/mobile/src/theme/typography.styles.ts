import { StyleSheet, type TextStyle } from "react-native";
import { MOBILE_TYPOGRAPHY } from "@openchamber/shared/typography";

function remToPixels(rem: string): number {
	const value = parseFloat(rem);
	return Math.round(value * 16);
}

export const FontFamily = {
	regular: "IBMPlexMono-Regular",
	medium: "IBMPlexMono-Medium",
	semiBold: "IBMPlexMono-SemiBold",
	bold: "IBMPlexMono-Bold",
} as const;

/**
 * Get the correct font family for a given weight.
 * In React Native, fontWeight style doesn't work with custom fonts -
 * you must use the specific fontFamily name for each weight variant.
 */
export function getFontFamily(
	weight: "400" | "500" | "600" | "700" | "regular" | "medium" | "semibold" | "bold" = "regular",
): string {
	switch (weight) {
		case "700":
		case "bold":
			return FontFamily.bold;
		case "600":
		case "semibold":
			return FontFamily.semiBold;
		case "500":
		case "medium":
			return FontFamily.medium;
		case "400":
		case "regular":
		default:
			return FontFamily.regular;
	}
}

/**
 * Helper to create a text style with the correct font family for the weight.
 * Use this instead of { fontWeight: "600" } which doesn't work in React Native.
 */
export function fontStyle(
	weight: "400" | "500" | "600" | "700" | "regular" | "medium" | "semibold" | "bold" = "regular",
) {
	return { fontFamily: getFontFamily(weight) };
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
	markdown: TextStyle;
	code: TextStyle;
	uiHeader: TextStyle;
	uiLabel: TextStyle;
	meta: TextStyle;
	micro: TextStyle;
	h1: TextStyle;
	h2: TextStyle;
	h3: TextStyle;
	h4: TextStyle;
	body: TextStyle;
	bodySmall: TextStyle;
	caption: TextStyle;
	button: TextStyle;
	buttonSmall: TextStyle;
}

export const typography = StyleSheet.create<TypographyStyles>({
	// Body text uses fixed 24px line height (matches desktop --markdown-body-line-height: 1.5rem)
	markdown: {
		fontFamily: FontFamily.regular,
		fontSize: FontSizes.markdown,
		lineHeight: FixedLineHeights.body,
	},
	// Code uses fixed 22px line height (matches desktop --code-block-line-height: 1.4rem)
	code: {
		fontFamily: FontFamily.regular,
		fontSize: FontSizes.code,
		lineHeight: FixedLineHeights.code,
	},
	// UI elements use fixed 16px line height (matches desktop --ui-label-line-height: 1rem)
	uiHeader: {
		fontFamily: FontFamily.semiBold,
		fontSize: FontSizes.uiHeader,
		lineHeight: FixedLineHeights.heading,
	},
	uiLabel: {
		fontFamily: FontFamily.medium,
		fontSize: FontSizes.uiLabel,
		lineHeight: FixedLineHeights.ui,
		letterSpacing: 0.4, // ~0.03em at 14px (desktop: --ui-label-letter-spacing: 0.03em)
	},
	meta: {
		fontFamily: FontFamily.regular,
		fontSize: FontSizes.meta,
		lineHeight: FixedLineHeights.ui,
	},
	// Micro (badges) use fixed 16px line height (matches desktop --ui-badge-line-height: 1rem)
	micro: {
		fontFamily: FontFamily.regular,
		fontSize: FontSizes.micro,
		lineHeight: FixedLineHeights.ui,
		letterSpacing: 0.35, // ~0.025em at 14px (desktop: --ui-badge-letter-spacing: 0.025em)
	},
	// Headings use fixed 20px line height (matches desktop --h1-line-height: 1.25rem)
	h1: {
		fontFamily: FontFamily.bold,
		fontSize: FontSizes.h1,
		lineHeight: FontSizes.h1 * LineHeights.tight,
	},
	h2: {
		fontFamily: FontFamily.semiBold,
		fontSize: FontSizes.h2,
		lineHeight: FontSizes.h2 * LineHeights.tight,
	},
	h3: {
		fontFamily: FontFamily.semiBold,
		fontSize: FontSizes.h3,
		lineHeight: FontSizes.h3 * LineHeights.tight,
	},
	h4: {
		fontFamily: FontFamily.semiBold,
		fontSize: FontSizes.h4,
		lineHeight: FontSizes.h4 * LineHeights.tight,
	},
	body: {
		fontFamily: FontFamily.regular,
		fontSize: FontSizes.markdown,
		lineHeight: FixedLineHeights.body,
	},
	bodySmall: {
		fontFamily: FontFamily.regular,
		fontSize: FontSizes.uiLabel,
		lineHeight: FixedLineHeights.ui,
	},
	caption: {
		fontFamily: FontFamily.regular,
		fontSize: FontSizes.micro,
		lineHeight: FixedLineHeights.ui,
		letterSpacing: 0.35,
	},
	button: {
		fontFamily: FontFamily.medium,
		fontSize: FontSizes.uiLabel,
		lineHeight: FixedLineHeights.ui,
		letterSpacing: 0.28, // ~0.02em at 14px (desktop: --ui-button-letter-spacing: 0.02em)
	},
	buttonSmall: {
		fontFamily: FontFamily.medium,
		fontSize: FontSizes.micro,
		lineHeight: FixedLineHeights.ui,
		letterSpacing: 0.28,
	},
});

export default typography;
