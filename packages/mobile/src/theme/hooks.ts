import { useContext } from "react";
import {
	type ThemeColors,
	ThemeContext,
	type ThemeContextValue,
} from "./context";

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}

export function useColors(): ThemeColors {
	return useTheme().colors;
}
