import { StyleSheet, type TextStyle } from "react-native";

// Font sizes matching PWA mobile CSS overrides (index.css @media max-width: 1024px)
// These values match the actual CSS custom properties used by the PWA on mobile screens
const PWA_MOBILE_TYPOGRAPHY = {
	markdown: "1rem", // 16px
	code: "0.875rem", // 14px - matches --text-code in PWA mobile CSS
	uiHeader: "0.9375rem", // 15px - matches --text-ui-header in PWA mobile CSS
	uiLabel: "0.875rem", // 14px - matches --text-ui-label in PWA mobile CSS
	meta: "0.875rem", // 14px - matches --text-meta in PWA mobile CSS
	micro: "0.8125rem", // 13px - matches --text-micro in PWA mobile CSS
} as const;

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
	markdown: remToPixels(PWA_MOBILE_TYPOGRAPHY.markdown), // 16px
	code: remToPixels(PWA_MOBILE_TYPOGRAPHY.code), // 14px
	uiHeader: remToPixels(PWA_MOBILE_TYPOGRAPHY.uiHeader), // 15px
	uiLabel: remToPixels(PWA_MOBILE_TYPOGRAPHY.uiLabel), // 14px
	meta: remToPixels(PWA_MOBILE_TYPOGRAPHY.meta), // 14px
	micro: remToPixels(PWA_MOBILE_TYPOGRAPHY.micro), // 13px
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
	markdown: {
		fontFamily: FontFamily.regular,
		fontSize: FontSizes.markdown,
		lineHeight: FontSizes.markdown * LineHeights.normal,
	},
	code: {
		fontFamily: FontFamily.regular,
		fontSize: FontSizes.code,
		lineHeight: FontSizes.code * LineHeights.tight,
	},
	uiHeader: {
		fontFamily: FontFamily.semiBold,
		fontSize: FontSizes.uiHeader,
		lineHeight: FontSizes.uiHeader * LineHeights.tight,
	},
	uiLabel: {
		fontFamily: FontFamily.medium,
		fontSize: FontSizes.uiLabel,
		lineHeight: FontSizes.uiLabel * LineHeights.normal,
	},
	meta: {
		fontFamily: FontFamily.regular,
		fontSize: FontSizes.meta,
		lineHeight: FontSizes.meta * LineHeights.normal,
	},
	micro: {
		fontFamily: FontFamily.regular,
		fontSize: FontSizes.micro,
		lineHeight: FontSizes.micro * LineHeights.normal,
	},
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
		lineHeight: FontSizes.markdown * LineHeights.normal,
	},
	bodySmall: {
		fontFamily: FontFamily.regular,
		fontSize: FontSizes.uiLabel,
		lineHeight: FontSizes.uiLabel * LineHeights.normal,
	},
	caption: {
		fontFamily: FontFamily.regular,
		fontSize: FontSizes.micro,
		lineHeight: FontSizes.micro * LineHeights.normal,
	},
	button: {
		fontFamily: FontFamily.medium,
		fontSize: FontSizes.uiLabel,
		lineHeight: FontSizes.uiLabel * LineHeights.tight,
	},
	buttonSmall: {
		fontFamily: FontFamily.medium,
		fontSize: FontSizes.micro,
		lineHeight: FontSizes.micro * LineHeights.tight,
	},
});

export default typography;
