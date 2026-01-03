export const FontFamily = {
  mono: "IBMPlexMono-Regular",
  monoMedium: "IBMPlexMono-Medium",
  monoSemiBold: "IBMPlexMono-SemiBold",
  monoBold: "IBMPlexMono-Bold",
} as const;

export const FontSize = {
  micro: 13,
  meta: 14,
  uiLabel: 14,
  uiHeader: 15,
  markdown: 15,
  code: 14.5,
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
