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

/**
 * Semantic spacing constants for consistent component styling
 * Matches desktop design system with mobile-friendly touch targets
 */
export const SemanticSpacing = {
	// Card & Container padding
	cardPadding: 24,           // p-6
	cardPaddingSm: 16,         // p-4
	cardGap: 24,               // gap-6

	// Button heights (mobile touch-friendly)
	buttonHeightSm: 36,        // 36px
	buttonHeightMd: 44,        // 44px (iOS recommended minimum)
	buttonHeightLg: 56,        // 56px

	// Input sizing
	inputHeight: 44,           // Mobile touch-friendly
	inputPaddingH: 12,         // px-3
	inputPaddingV: 8,          // py-2

	// Icon sizes
	iconSize: 16,              // size-4
	iconSizeMd: 20,            // size-5
	iconSizeLg: 24,            // size-6

	// Gaps
	gapXs: 4,                  // gap-1
	gapSm: 6,                  // gap-1.5
	gap: 8,                    // gap-2
	gapMd: 12,                 // gap-3
	gapLg: 16,                 // gap-4
	gapXl: 24,                 // gap-6

	// Border radii (semantic)
	radiusButton: 8,           // rounded-lg
	radiusCard: 12,            // rounded-xl
	radiusInput: 8,            // rounded-lg
	radiusModal: 16,           // rounded-2xl
	radiusFull: 9999,          // rounded-full

	// Message bubbles
	messagePadding: 12,        // p-3
	messageRadius: 12,         // rounded-xl
	messageMaxWidthUser: 0.85, // 85% of container
	messageMaxWidthAssistant: 1, // full width

	// Toolbar/Footer
	toolbarPaddingH: 10,
	toolbarPaddingV: 6,
	toolbarGap: 6,
} as const;
