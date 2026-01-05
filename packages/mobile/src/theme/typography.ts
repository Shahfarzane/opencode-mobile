import { MOBILE_TYPOGRAPHY } from "@openchamber/shared/typography";

function remToPixels(rem: string): number {
	const value = parseFloat(rem);
	return Math.round(value * 16);
}

export const FontFamily = {
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
	h1: 24,
	h2: 20,
	h3: 18,
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
