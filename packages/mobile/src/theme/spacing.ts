import { RADII } from '@openchamber/shared/spacing';

function remToPixels(rem: string): number {
	if (rem === '0') return 0;
	if (rem === '9999px') return 9999;
	const value = parseFloat(rem);
	return Math.round(value * 16);
}

export const Spacing = {
	0: 0,
	0.5: 2,
	1: 4,
	1.5: 6,
	2: 8,
	2.5: 10,
	3: 12,
	3.5: 14,
	4: 16,
	5: 20,
	6: 24,
	7: 28,
	8: 32,
	9: 36,
	10: 40,
	11: 44,
	12: 48,
	14: 56,
	16: 64,
	20: 80,
	24: 96,
	28: 112,
	32: 128,
} as const;

export const Radius = {
	none: remToPixels(RADII.none),
	sm: remToPixels(RADII.sm),
	md: remToPixels(RADII.md),
	lg: remToPixels(RADII.lg),
	xl: remToPixels(RADII.xl),
	"2xl": remToPixels(RADII['2xl']),
	"3xl": remToPixels(RADII['3xl']),
	full: remToPixels(RADII.full),
} as const;
