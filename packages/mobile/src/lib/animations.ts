import { Animated, Easing } from "react-native";

/**
 * Animation utilities matching desktop transition timings
 */

// Duration constants (matching desktop index.css)
export const TRANSITION_DURATION = {
	fast: 150,    // Match desktop 150ms ease
	normal: 250,  // Match desktop 250ms ease
	slow: 350,    // Match desktop 350ms ease
} as const;

/**
 * Shimmer animation for loading states
 * Returns a looping animation that oscillates opacity
 */
export function shimmer(animatedValue: Animated.Value): Animated.CompositeAnimation {
	return Animated.loop(
		Animated.sequence([
			Animated.timing(animatedValue, {
				toValue: 1,
				duration: 1000,
				easing: Easing.linear,
				useNativeDriver: true,
			}),
			Animated.timing(animatedValue, {
				toValue: 0.3,
				duration: 1000,
				easing: Easing.linear,
				useNativeDriver: true,
			}),
		]),
	);
}
