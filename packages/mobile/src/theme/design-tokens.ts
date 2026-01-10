/**
 * Design Tokens - Single Source of Truth
 *
 * This file contains all design tokens that match the desktop PWA design system.
 * These values are derived from packages/ui/src/index.css and component styles.
 *
 * @see packages/ui/src/components/ui/button.tsx - Desktop button sizes
 * @see packages/ui/src/components/ui/input.tsx - Desktop input sizes
 * @see packages/ui/src/index.css - OKLCH color variables
 */

/**
 * Size tokens matching desktop PWA sizes
 *
 * Desktop button sizes:
 * - default: h-9 (36px)
 * - sm: h-8 (32px)
 * - lg: h-10 (40px)
 * - icon: size-9 (36px)
 *
 * Mobile touch targets require larger sizes (44px minimum),
 * so we provide both desktop-equivalent and mobile-optimized sizes.
 */
export const DesktopSizes = {
	// Button heights (matching desktop exactly)
	buttonDefault: 36, // h-9 - desktop default
	buttonSm: 32, // h-8 - desktop small
	buttonLg: 40, // h-10 - desktop large
	buttonIcon: 36, // size-9 - desktop icon button

	// Input height (matching desktop exactly)
	inputDefault: 36, // h-9 - desktop input

	// Padding
	buttonPaddingX: 16, // px-4 - desktop default
	buttonPaddingXSm: 12, // px-3 - desktop small
	buttonPaddingXLg: 24, // px-6 - desktop large

	inputPaddingX: 12, // px-3 - desktop input
	inputPaddingY: 4, // py-1 - desktop input
} as const;

/**
 * Mobile-optimized sizes (touch-friendly)
 *
 * iOS Human Interface Guidelines recommend a minimum touch target of 44x44 points.
 * These sizes are optimized for touch interaction.
 */
export const MobileSizes = {
	// Button heights (mobile-optimized for touch)
	buttonXs: 28, // Extra small (compact UI)
	buttonSm: 36, // Small - matches desktop default
	buttonMd: 44, // Medium - iOS minimum touch target
	buttonLg: 56, // Large - prominent actions

	// Icon button sizes
	buttonIconSm: 32, // Small icon button
	buttonIconMd: 40, // Medium icon button
	buttonIconLg: 48, // Large icon button

	// Input heights
	inputSm: 36, // Small - matches desktop
	inputMd: 44, // Medium - iOS minimum
	inputLg: 56, // Large

	// Input padding
	inputPaddingX: 12, // px-3
	inputPaddingY: 8, // py-2

	// Gap sizes
	gapXs: 4, // gap-1
	gapSm: 6, // gap-1.5
	gapMd: 8, // gap-2
	gapLg: 12, // gap-3
	gapXl: 16, // gap-4
} as const;

/**
 * Border radius tokens matching desktop
 *
 * Desktop uses:
 * - rounded-lg: 0.5rem (8px)
 * - rounded-xl: 0.75rem (12px)
 * - rounded-md: 0.375rem (6px)
 */
export const RadiusTokens = {
	none: 0,
	sm: 2, // rounded-sm
	md: 6, // rounded-md
	lg: 8, // rounded-lg
	xl: 12, // rounded-xl
	"2xl": 16, // rounded-2xl
	"3xl": 24, // rounded-3xl
	full: 9999, // rounded-full
} as const;

/**
 * Animation tokens matching desktop
 *
 * Desktop uses 150ms transitions for most interactive elements.
 * iOS-native animations use spring physics with specific values.
 */
export const AnimationTokens = {
	// Duration (ms)
	durationFast: 100,
	durationDefault: 150, // Desktop default
	durationSlow: 250,
	durationSlowest: 350,

	// Spring config for menus (iOS-native feel)
	// iOS typically uses ~500 stiffness and ~30 damping for bouncy animations
	menuSpring: {
		damping: 28, // Slightly higher damping for smoother settle
		mass: 0.9, // Lighter mass for snappier response
		stiffness: 420, // Higher stiffness for quicker animation
	},

	// Spring config for subtle animations (less bounce)
	subtleSpring: {
		damping: 32,
		mass: 1,
		stiffness: 350,
	},

	// Spring config for iOS sheet-like animations
	sheetSpring: {
		damping: 35,
		mass: 1.2,
		stiffness: 300,
	},

	// Menu animation - matches PWA zoom-in-95/zoom-out-95
	menuCloseDuration: 150, // Match PWA duration
	menuScaleFrom: 0.95, // PWA: zoom-out-95 / zoom-in-95
	menuScaleTo: 1,
} as const;

/**
 * Shadow tokens matching desktop
 *
 * Desktop uses subtle shadows for elevated surfaces.
 */
export const ShadowTokens = {
	menu: {
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
	},
	card: {
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
} as const;

/**
 * Focus ring tokens matching desktop
 *
 * Desktop uses: focus-visible:ring-ring/50 focus-visible:ring-[3px]
 * This is implemented as a shadow in React Native.
 */
export const FocusRingTokens = {
	width: 3, // ring-[3px]
	opacity: 0.5, // ring-ring/50
} as const;

/**
 * Input styling tokens matching desktop PWA
 *
 * Desktop input styles from packages/ui/src/components/ui/input.tsx:
 * - dark:bg-input/30 - 30% opacity background in dark mode
 * - placeholder:text-muted-foreground - placeholder color
 * - transition-[color,box-shadow,border-color] - transition properties
 */
export const InputTokens = {
	darkBackgroundOpacity: 0.3, // dark:bg-input/30
	borderWidth: 1, // border
	height: {
		sm: 36, // h-9 - desktop size
		md: 44, // iOS minimum touch target
		lg: 56, // Large inputs
	},
	padding: {
		x: 12, // px-3
		y: 4, // py-1 (desktop), py-2 (mobile)
	},
} as const;

/**
 * Opacity tokens matching desktop
 */
export const OpacityTokens = {
	disabled: 0.5, // disabled:opacity-50
	loading: 0.7, // Loading state
	hover: 0.9, // hover:bg-primary/90
	muted: 0.6,
	backdrop: 0.4, // Scrim/overlay
	subtle: 0.3,
	faint: 0.1,
} as const;

/**
 * Context menu positioning constants
 */
export const MenuPositioning = {
	width: 180, // min-w-[180px]
	margin: 8, // Margin from anchor
	itemPaddingX: 16, // px-4
	itemPaddingY: 14, // py-3.5
	itemGap: 12, // gap-3
	iconSize: 18, // Menu item icons
} as const;

/**
 * Icon size tokens matching desktop
 *
 * Desktop uses [&_svg:not([class*='size-'])]:size-4 for buttons
 */
export const IconSizes = {
	xs: 12,
	sm: 14, // size-3.5
	md: 16, // size-4 - default
	lg: 20, // size-5
	xl: 24, // size-6
} as const;

/**
 * Z-index tokens for layering
 */
export const ZIndexTokens = {
	base: 0,
	dropdown: 50, // z-50 - dropdowns, menus
	modal: 100,
	toast: 200,
} as const;

/**
 * Get shadow color based on theme
 */
export function getShadowColor(isDark: boolean): string {
	return isDark ? "#000" : "#666";
}

/**
 * Type exports
 */
export type DesktopSizeKey = keyof typeof DesktopSizes;
export type MobileSizeKey = keyof typeof MobileSizes;
export type RadiusKey = keyof typeof RadiusTokens;
