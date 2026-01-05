import { MOBILE_TYPOGRAPHY } from "@openchamber/shared/typography";
import { StyleSheet, type TextStyle } from "react-native";

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

export const FontSizes = {
	markdown: remToPixels(MOBILE_TYPOGRAPHY.markdown),
	code: remToPixels(MOBILE_TYPOGRAPHY.code),
	uiHeader: remToPixels(MOBILE_TYPOGRAPHY.uiHeader),
	uiLabel: remToPixels(MOBILE_TYPOGRAPHY.uiLabel),
	meta: remToPixels(MOBILE_TYPOGRAPHY.meta),
	micro: remToPixels(MOBILE_TYPOGRAPHY.micro),
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
