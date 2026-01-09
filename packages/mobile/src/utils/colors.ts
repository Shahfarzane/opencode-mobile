/**
 * Color Utilities
 * Provides type-safe opacity handling for theme colors
 */

/**
 * Applies opacity to a hex color, returning an rgba string
 * @param hexColor - Hex color string (e.g., "#edb449" or "#fff")
 * @param opacity - Opacity value from 0 to 1
 * @returns rgba color string
 */
export function withOpacity(hexColor: string, opacity: number): string {
	// Handle shorthand hex colors (#fff -> #ffffff)
	let hex = hexColor.replace("#", "");
	if (hex.length === 3) {
		hex = hex
			.split("")
			.map((c) => c + c)
			.join("");
	}

	// If the hex already has alpha, strip it
	if (hex.length === 8) {
		hex = hex.slice(0, 6);
	}

	const r = Number.parseInt(hex.slice(0, 2), 16);
	const g = Number.parseInt(hex.slice(2, 4), 16);
	const b = Number.parseInt(hex.slice(4, 6), 16);

	return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Common opacity presets matching the hex suffixes used in the codebase
 * Hex opacity suffixes: 08=0.03, 0A=0.04, 0F=0.06, 10=0.06, 14=0.08, 15=0.08,
 * 1A=0.1, 1F=0.12, 20=0.13, 30=0.19, 33=0.2, 40=0.25, 4D=0.3, 50=0.31,
 * 66=0.4, 80=0.5, 99=0.6, B0=0.69, B3=0.7, CC=0.8
 */
export const OPACITY = {
	/** 3% opacity - very subtle */
	subtle: 0.03,
	/** 5% opacity - hover states */
	hover: 0.05,
	/** 8% opacity - light backgrounds */
	light: 0.08,
	/** 10% opacity - selected states */
	selected: 0.1,
	/** 15% opacity - active states */
	active: 0.15,
	/** 20% opacity - emphasized backgrounds */
	emphasized: 0.2,
	/** 25% opacity - borders */
	border: 0.25,
	/** 30% opacity - overlays */
	overlay: 0.3,
	/** 40% opacity - scrim/backdrop */
	scrim: 0.4,
	/** 50% opacity - half transparent */
	half: 0.5,
	/** 60% opacity - muted text */
	muted: 0.6,
	/** 70% opacity - secondary text */
	secondary: 0.7,
	/** 80% opacity - near opaque */
	strong: 0.8,
} as const;

/**
 * Overlay colors for modals and scrims
 * Use these instead of hardcoded rgba values
 */
export const OVERLAYS = {
	/** Dark scrim for modals (black at 50%) */
	scrimDark: "rgba(0, 0, 0, 0.5)",
	/** Medium scrim (black at 40%) */
	scrimMedium: "rgba(0, 0, 0, 0.4)",
	/** Light scrim (black at 30%) */
	scrimLight: "rgba(0, 0, 0, 0.3)",
	/** Very light scrim (black at 20%) */
	scrimSubtle: "rgba(0, 0, 0, 0.2)",
} as const;

/**
 * Theme-aware overlay that returns appropriate color based on dark mode
 */
export function getThemeOverlay(
	isDark: boolean,
	intensity: "subtle" | "light" | "medium" | "strong" = "light",
): string {
	const darkOpacities = {
		subtle: 0.03,
		light: 0.08,
		medium: 0.1,
		strong: 0.15,
	};
	const lightOpacities = {
		subtle: 0.02,
		light: 0.05,
		medium: 0.08,
		strong: 0.1,
	};

	const opacity = isDark
		? darkOpacities[intensity]
		: lightOpacities[intensity];

	return isDark
		? `rgba(255, 255, 255, ${opacity})`
		: `rgba(0, 0, 0, ${opacity})`;
}

/**
 * Get SVG stroke/fill colors for theme-aware graphics
 */
export function getSvgColor(isDark: boolean): {
	stroke: string;
	fill: string;
	fillSubtle: string;
	fillHighlight: string;
} {
	return isDark
		? {
				stroke: "white",
				fill: "white",
				fillSubtle: "rgba(255, 255, 255, 0.15)",
				fillHighlight: "rgba(255, 255, 255, 0.35)",
			}
		: {
				stroke: "black",
				fill: "black",
				fillSubtle: "rgba(0, 0, 0, 0.15)",
				fillHighlight: "rgba(0, 0, 0, 0.4)",
			};
}
