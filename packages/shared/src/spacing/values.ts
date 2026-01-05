export const SPACING = {
	0: "0",
	0.5: "0.125rem",
	1: "0.25rem",
	1.5: "0.375rem",
	2: "0.5rem",
	2.5: "0.625rem",
	3: "0.75rem",
	3.5: "0.875rem",
	4: "1rem",
	5: "1.25rem",
	6: "1.5rem",
	7: "1.75rem",
	8: "2rem",
	9: "2.25rem",
	10: "2.5rem",
	11: "2.75rem",
	12: "3rem",
	14: "3.5rem",
	16: "4rem",
	20: "5rem",
	24: "6rem",
	28: "7rem",
	32: "8rem",
	36: "9rem",
	40: "10rem",
	44: "11rem",
	48: "12rem",
	52: "13rem",
	56: "14rem",
	60: "15rem",
	64: "16rem",
	72: "18rem",
	80: "20rem",
	96: "24rem",
} as const;

export const SEMANTIC_SPACING = {
	xs: SPACING[1],
	sm: SPACING[2],
	md: SPACING[4],
	lg: SPACING[6],
	xl: SPACING[8],
	"2xl": SPACING[12],
} as const;

export const RADII = {
	none: "0",
	sm: "0.125rem",
	DEFAULT: "0.25rem",
	md: "0.375rem",
	lg: "0.5rem",
	xl: "0.75rem",
	"2xl": "1rem",
	"3xl": "1.5rem",
	full: "9999px",
} as const;

export const GAPS = {
	xs: SPACING[1],
	sm: SPACING[2],
	md: SPACING[3],
	lg: SPACING[4],
	xl: SPACING[6],
} as const;

export type SpacingKey = keyof typeof SPACING;
export type SemanticSpacingKey = keyof typeof SEMANTIC_SPACING;
export type RadiiKey = keyof typeof RADII;
export type GapKey = keyof typeof GAPS;
