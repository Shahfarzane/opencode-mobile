export const SEMANTIC_TYPOGRAPHY = {
	markdown: "0.9375rem",
	code: "0.9063rem",
	uiHeader: "0.9375rem",
	uiLabel: "0.8750rem",
	meta: "0.875rem",
	micro: "0.875rem",
} as const;

export const FONT_SIZE_SCALES = {
	small: {
		markdown: "0.875rem",
		code: "0.8125rem",
		uiHeader: "0.875rem",
		uiLabel: "0.8125rem",
		meta: "0.8125rem",
		micro: "0.75rem",
	},
	medium: SEMANTIC_TYPOGRAPHY,
	large: {
		markdown: "1rem",
		code: "0.9375rem",
		uiHeader: "1rem",
		uiLabel: "0.9375rem",
		meta: "0.9375rem",
		micro: "0.9375rem",
	},
} as const;

export const VSCODE_TYPOGRAPHY = {
	markdown: "0.9063rem",
	code: "0.8750rem",
	uiHeader: "0.9063rem",
	uiLabel: "0.8438rem",
	meta: "0.8438rem",
	micro: "0.7813rem",
} as const;

export const MOBILE_TYPOGRAPHY = {
	markdown: "1rem",
	code: "0.9375rem",
	uiHeader: "1rem",
	uiLabel: "0.9375rem",
	meta: "0.9375rem",
	micro: "0.875rem",
} as const;

export type FontSizeOption = keyof typeof FONT_SIZE_SCALES;
export type SemanticTypographyKey = keyof typeof SEMANTIC_TYPOGRAPHY;
export type SemanticTypographyValues = typeof SEMANTIC_TYPOGRAPHY;

export const TYPOGRAPHY_CLASSES = {
	markdown: "typography-markdown",
	code: "typography-code",
	uiHeader: "typography-ui-header",
	uiLabel: "typography-ui-label",
	meta: "typography-meta",
	micro: "typography-micro",
} as const;

export type TypographyClassKey = keyof typeof TYPOGRAPHY_CLASSES;
