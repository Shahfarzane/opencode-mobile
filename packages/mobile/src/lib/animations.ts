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
 * Fade in animation
 */
export function fadeIn(
	animatedValue: Animated.Value,
	duration: number = TRANSITION_DURATION.fast,
): Animated.CompositeAnimation {
	return Animated.timing(animatedValue, {
		toValue: 1,
		duration,
		easing: Easing.out(Easing.ease),
		useNativeDriver: true,
	});
}

/**
 * Fade out animation
 */
export function fadeOut(
	animatedValue: Animated.Value,
	duration: number = TRANSITION_DURATION.fast,
): Animated.CompositeAnimation {
	return Animated.timing(animatedValue, {
		toValue: 0,
		duration,
		easing: Easing.out(Easing.ease),
		useNativeDriver: true,
	});
}

/**
 * Slide in from bottom animation
 */
export function slideInFromBottom(
	animatedValue: Animated.Value,
	initialOffset: number = 20,
): Animated.CompositeAnimation {
	animatedValue.setValue(initialOffset);
	return Animated.timing(animatedValue, {
		toValue: 0,
		duration: TRANSITION_DURATION.normal,
		easing: Easing.out(Easing.cubic),
		useNativeDriver: true,
	});
}

/**
 * Scale in animation (like zoom-in-95 in desktop)
 */
export function scaleIn(
	animatedValue: Animated.Value,
	fromScale: number = 0.95,
): Animated.CompositeAnimation {
	animatedValue.setValue(fromScale);
	return Animated.timing(animatedValue, {
		toValue: 1,
		duration: TRANSITION_DURATION.fast,
		easing: Easing.out(Easing.cubic),
		useNativeDriver: true,
	});
}

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

/**
 * Combined fade and slide animation (common for modals/popovers)
 */
export function fadeSlideIn(
	fadeValue: Animated.Value,
	slideValue: Animated.Value,
	slideOffset: number = 10,
): Animated.CompositeAnimation {
	fadeValue.setValue(0);
	slideValue.setValue(slideOffset);

	return Animated.parallel([
		Animated.timing(fadeValue, {
			toValue: 1,
			duration: TRANSITION_DURATION.fast,
			easing: Easing.out(Easing.ease),
			useNativeDriver: true,
		}),
		Animated.timing(slideValue, {
			toValue: 0,
			duration: TRANSITION_DURATION.fast,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: true,
		}),
	]);
}

/**
 * Combined fade and slide out animation
 */
export function fadeSlideOut(
	fadeValue: Animated.Value,
	slideValue: Animated.Value,
	slideOffset: number = 10,
): Animated.CompositeAnimation {
	return Animated.parallel([
		Animated.timing(fadeValue, {
			toValue: 0,
			duration: TRANSITION_DURATION.fast,
			easing: Easing.out(Easing.ease),
			useNativeDriver: true,
		}),
		Animated.timing(slideValue, {
			toValue: -slideOffset,
			duration: TRANSITION_DURATION.fast,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: true,
		}),
	]);
}

/**
 * Pulse animation (useful for attention-grabbing effects)
 */
export function pulse(animatedValue: Animated.Value): Animated.CompositeAnimation {
	return Animated.loop(
		Animated.sequence([
			Animated.timing(animatedValue, {
				toValue: 1.05,
				duration: 500,
				easing: Easing.inOut(Easing.ease),
				useNativeDriver: true,
			}),
			Animated.timing(animatedValue, {
				toValue: 1,
				duration: 500,
				easing: Easing.inOut(Easing.ease),
				useNativeDriver: true,
			}),
		]),
	);
}

/**
 * Spin animation (for loading indicators)
 */
export function spin(animatedValue: Animated.Value): Animated.CompositeAnimation {
	return Animated.loop(
		Animated.timing(animatedValue, {
			toValue: 1,
			duration: 1000,
			easing: Easing.linear,
			useNativeDriver: true,
		}),
	);
}

/**
 * Create a spring animation
 */
export function spring(
	animatedValue: Animated.Value,
	toValue: number,
	config?: Partial<Animated.SpringAnimationConfig>,
): Animated.CompositeAnimation {
	return Animated.spring(animatedValue, {
		toValue,
		tension: 100,
		friction: 12,
		useNativeDriver: true,
		...config,
	});
}
