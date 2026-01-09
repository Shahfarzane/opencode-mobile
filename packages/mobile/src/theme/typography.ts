import { MOBILE_TYPOGRAPHY } from "@openchamber/shared/typography";

function remToPixels(rem: string): number {
	const value = parseFloat(rem);
	return Math.round(value * 16);
}

export const FontFamily = {
	// Sans fonts (for UI text)
	sans: "IBMPlexSans-Regular",
	sansMedium: "IBMPlexSans-Medium",
	sansSemiBold: "IBMPlexSans-SemiBold",
	sansBold: "IBMPlexSans-Bold",
	// Mono fonts (for code and technical content)
	mono: "IBMPlexMono-Regular",
	monoMedium: "IBMPlexMono-Medium",
	monoSemiBold: "IBMPlexMono-SemiBold",
	monoBold: "IBMPlexMono-Bold",
} as const;

export const FontSize = {
	micro: remToPixels(MOBILE_TYPOGRAPHY.micro),
	meta: remToPixels(MOBILE_TYPOGRAPHY.meta),
	uiLabel: remToPixels(MOBILE_TYPOGRAPHY.uiLabel),
	uiHeader: remToPixels(MOBILE_TYPOGRAPHY.uiHeader),
	markdown: remToPixels(MOBILE_TYPOGRAPHY.markdown),
	code: remToPixels(MOBILE_TYPOGRAPHY.code),
	// Headings use em-based scaling relative to markdown (16px base)
	// Matches PWA: h1 = 1.125em, h2 = 1.0625em, h3 = 1em
	h1: Math.round(remToPixels(MOBILE_TYPOGRAPHY.markdown) * 1.125), // 18px
	h2: Math.round(remToPixels(MOBILE_TYPOGRAPHY.markdown) * 1.0625), // 17px
	h3: remToPixels(MOBILE_TYPOGRAPHY.markdown), // 16px
} as const;

export const LineHeight = {
	tight: 1.25,
	normal: 1.5,
	relaxed: 1.625,
} as const;

export const FontWeight = {
	regular: "400" as const,
	medium: "500" as const,
	semibold: "600" as const,
	bold: "700" as const,
};
