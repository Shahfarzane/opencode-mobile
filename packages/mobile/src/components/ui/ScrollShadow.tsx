import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useRef, useState } from "react";
import {
	Animated,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	ScrollView,
	type ScrollViewProps,
	StyleSheet,
	View,
	type ViewStyle,
} from "react-native";
import { TRANSITION_DURATION } from "@/lib/animations";
import { useTheme } from "@/theme";

interface ScrollShadowProps extends ScrollViewProps {
	/**
	 * Height of the shadow gradient in pixels
	 * @default 40
	 */
	shadowHeight?: number;
	/**
	 * Whether to show the top shadow when scrolled
	 * @default true
	 */
	showTopShadow?: boolean;
	/**
	 * Whether to show the bottom shadow when more content below
	 * @default true
	 */
	showBottomShadow?: boolean;
	/**
	 * Container style for the wrapper View
	 */
	containerStyle?: ViewStyle;
}

/**
 * ScrollView with gradient shadow overlays indicating scrollable content
 * Matches desktop scroll shadow behavior
 */
export function ScrollShadow({
	shadowHeight = 40,
	showTopShadow = true,
	showBottomShadow = true,
	containerStyle,
	onScroll,
	children,
	...scrollViewProps
}: ScrollShadowProps) {
	const { colors } = useTheme();
	const topOpacity = useRef(new Animated.Value(0)).current;
	const bottomOpacity = useRef(new Animated.Value(0)).current;
	const [scrollViewHeight, setScrollViewHeight] = useState(0);

	const handleScroll = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			const { contentOffset, contentSize, layoutMeasurement } =
				event.nativeEvent;
			const scrollY = contentOffset.y;
			const maxScrollY = contentSize.height - layoutMeasurement.height;

			// Calculate shadow opacities based on scroll position
			const topShadowOpacity = Math.min(scrollY / 50, 1);
			const bottomShadowOpacity = Math.min((maxScrollY - scrollY) / 50, 1);

			// Animate to new opacity values
			Animated.parallel([
				Animated.timing(topOpacity, {
					toValue: showTopShadow ? topShadowOpacity : 0,
					duration: TRANSITION_DURATION.fast,
					useNativeDriver: true,
				}),
				Animated.timing(bottomOpacity, {
					toValue: showBottomShadow ? bottomShadowOpacity : 0,
					duration: TRANSITION_DURATION.fast,
					useNativeDriver: true,
				}),
			]).start();

			// Call original onScroll if provided
			onScroll?.(event);
		},
		[topOpacity, bottomOpacity, showTopShadow, showBottomShadow, onScroll],
	);

	const handleContentSizeChange = useCallback(
		(_width: number, height: number) => {
			// Check if content overflows initially
			if (height > scrollViewHeight && scrollViewHeight > 0) {
				Animated.timing(bottomOpacity, {
					toValue: showBottomShadow ? 1 : 0,
					duration: TRANSITION_DURATION.fast,
					useNativeDriver: true,
				}).start();
			}
		},
		[scrollViewHeight, bottomOpacity, showBottomShadow],
	);

	const handleLayout = useCallback(
		(event: { nativeEvent: { layout: { height: number } } }) => {
			setScrollViewHeight(event.nativeEvent.layout.height);
		},
		[],
	);

	// Create gradient colors from theme background
	const backgroundColor = colors.background;
	const transparentColor = backgroundColor + "00"; // Fully transparent

	return (
		<View style={[styles.container, containerStyle]}>
			<ScrollView
				{...scrollViewProps}
				onScroll={handleScroll}
				onContentSizeChange={handleContentSizeChange}
				onLayout={handleLayout}
				scrollEventThrottle={16}
			>
				{children}
			</ScrollView>

			{/* Top shadow gradient */}
			{showTopShadow && (
				<Animated.View
					style={[
						styles.shadowTop,
						{ height: shadowHeight, opacity: topOpacity },
					]}
					pointerEvents="none"
				>
					<LinearGradient
						colors={[backgroundColor, transparentColor]}
						style={StyleSheet.absoluteFill}
					/>
				</Animated.View>
			)}

			{/* Bottom shadow gradient */}
			{showBottomShadow && (
				<Animated.View
					style={[
						styles.shadowBottom,
						{ height: shadowHeight, opacity: bottomOpacity },
					]}
					pointerEvents="none"
				>
					<LinearGradient
						colors={[transparentColor, backgroundColor]}
						style={StyleSheet.absoluteFill}
					/>
				</Animated.View>
			)}
		</View>
	);
}

/**
 * Horizontal ScrollView with shadow indicators
 */
export function ScrollShadowHorizontal({
	shadowWidth = 40,
	showLeftShadow = true,
	showRightShadow = true,
	containerStyle,
	onScroll,
	children,
	...scrollViewProps
}: Omit<
	ScrollShadowProps,
	"shadowHeight" | "showTopShadow" | "showBottomShadow"
> & {
	shadowWidth?: number;
	showLeftShadow?: boolean;
	showRightShadow?: boolean;
}) {
	const { colors } = useTheme();
	const leftOpacity = useRef(new Animated.Value(0)).current;
	const rightOpacity = useRef(new Animated.Value(0)).current;
	const [scrollViewWidth, setScrollViewWidth] = useState(0);

	const handleScroll = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			const { contentOffset, contentSize, layoutMeasurement } =
				event.nativeEvent;
			const scrollX = contentOffset.x;
			const maxScrollX = contentSize.width - layoutMeasurement.width;

			const leftShadowOpacity = Math.min(scrollX / 50, 1);
			const rightShadowOpacity = Math.min((maxScrollX - scrollX) / 50, 1);

			Animated.parallel([
				Animated.timing(leftOpacity, {
					toValue: showLeftShadow ? leftShadowOpacity : 0,
					duration: TRANSITION_DURATION.fast,
					useNativeDriver: true,
				}),
				Animated.timing(rightOpacity, {
					toValue: showRightShadow ? rightShadowOpacity : 0,
					duration: TRANSITION_DURATION.fast,
					useNativeDriver: true,
				}),
			]).start();

			onScroll?.(event);
		},
		[leftOpacity, rightOpacity, showLeftShadow, showRightShadow, onScroll],
	);

	const handleContentSizeChange = useCallback(
		(width: number) => {
			if (width > scrollViewWidth && scrollViewWidth > 0) {
				Animated.timing(rightOpacity, {
					toValue: showRightShadow ? 1 : 0,
					duration: TRANSITION_DURATION.fast,
					useNativeDriver: true,
				}).start();
			}
		},
		[scrollViewWidth, rightOpacity, showRightShadow],
	);

	const handleLayout = useCallback(
		(event: { nativeEvent: { layout: { width: number } } }) => {
			setScrollViewWidth(event.nativeEvent.layout.width);
		},
		[],
	);

	const backgroundColor = colors.background;
	const transparentColor = backgroundColor + "00";

	return (
		<View style={[styles.container, containerStyle]}>
			<ScrollView
				{...scrollViewProps}
				horizontal
				onScroll={handleScroll}
				onContentSizeChange={handleContentSizeChange}
				onLayout={handleLayout}
				scrollEventThrottle={16}
			>
				{children}
			</ScrollView>

			{/* Left shadow gradient */}
			{showLeftShadow && (
				<Animated.View
					style={[
						styles.shadowLeft,
						{ width: shadowWidth, opacity: leftOpacity },
					]}
					pointerEvents="none"
				>
					<LinearGradient
						colors={[backgroundColor, transparentColor]}
						start={{ x: 0, y: 0.5 }}
						end={{ x: 1, y: 0.5 }}
						style={StyleSheet.absoluteFill}
					/>
				</Animated.View>
			)}

			{/* Right shadow gradient */}
			{showRightShadow && (
				<Animated.View
					style={[
						styles.shadowRight,
						{ width: shadowWidth, opacity: rightOpacity },
					]}
					pointerEvents="none"
				>
					<LinearGradient
						colors={[transparentColor, backgroundColor]}
						start={{ x: 0, y: 0.5 }}
						end={{ x: 1, y: 0.5 }}
						style={StyleSheet.absoluteFill}
					/>
				</Animated.View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: "relative",
	},
	shadowTop: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
	},
	shadowBottom: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
	},
	shadowLeft: {
		position: "absolute",
		top: 0,
		bottom: 0,
		left: 0,
	},
	shadowRight: {
		position: "absolute",
		top: 0,
		bottom: 0,
		right: 0,
	},
});
