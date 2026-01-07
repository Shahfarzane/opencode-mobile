import * as ExpoSplashScreen from "expo-splash-screen";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";
import { useTheme } from "../../theme";
import { splashScreenStyles } from "./SplashScreen.styles";

// Note: preventAutoHideAsync() is called in app/_layout.tsx at module level
// to ensure it runs early enough in the app lifecycle for preview builds

interface SplashScreenProps {
	isReady: boolean;
	onComplete?: () => void;
}

// Desktop-matching coordinates for the isometric cube
const TOP = { x: 50, y: 2 };
const LEFT = { x: 8.432, y: 26 };
const RIGHT = { x: 91.568, y: 26 };
const CENTER = { x: 50, y: 50 };
const BOTTOM_LEFT = { x: 8.432, y: 74 };
const BOTTOM_RIGHT = { x: 91.568, y: 74 };
const BOTTOM = { x: 50, y: 98 };

// Logo position on top face (same as desktop)
const ISO_MATRIX = "matrix(0.866, 0.5, -0.866, 0.5, 50, 26)";

// Left face grid cells with desktop-matching opacities (4x4 grid, row by row from top)
const LEFT_FACE_CELLS = [
	{ path: "M50 50 L39.608 44 L39.608 56 L50 62 Z", opacity: 0.2 },
	{ path: "M39.608 44 L29.216 38 L29.216 50 L39.608 56 Z", opacity: 0.45 },
	{ path: "M29.216 38 L18.824 32 L18.824 44 L29.216 50 Z", opacity: 0.15 },
	{ path: "M18.824 32 L8.432 26 L8.432 38 L18.824 44 Z", opacity: 0.55 },
	{ path: "M50 62 L39.608 56 L39.608 68 L50 74 Z", opacity: 0.35 },
	{ path: "M39.608 56 L29.216 50 L29.216 62 L39.608 68 Z", opacity: 0.1 },
	{ path: "M29.216 50 L18.824 44 L18.824 56 L29.216 62 Z", opacity: 0.5 },
	{ path: "M18.824 44 L8.432 38 L8.432 50 L18.824 56 Z", opacity: 0.25 },
	{ path: "M50 74 L39.608 68 L39.608 80 L50 86 Z", opacity: 0.4 },
	{ path: "M39.608 68 L29.216 62 L29.216 74 L39.608 80 Z", opacity: 0.3 },
	{ path: "M29.216 62 L18.824 56 L18.824 68 L29.216 74 Z", opacity: 0.45 },
	{ path: "M18.824 56 L8.432 50 L8.432 62 L18.824 68 Z", opacity: 0.15 },
	{ path: "M50 86 L39.608 80 L39.608 92 L50 98 Z", opacity: 0.55 },
	{ path: "M39.608 80 L29.216 74 L29.216 86 L39.608 92 Z", opacity: 0.2 },
	{ path: "M29.216 74 L18.824 68 L18.824 80 L29.216 86 Z", opacity: 0.35 },
	{ path: "M18.824 68 L8.432 62 L8.432 74 L18.824 80 Z", opacity: 0.1 },
];

// Right face grid cells with desktop-matching opacities (4x4 grid, row by row from top)
const RIGHT_FACE_CELLS = [
	{ path: "M50 50 L60.392 44 L60.392 56 L50 62 Z", opacity: 0.3 },
	{ path: "M60.392 44 L70.784 38 L70.784 50 L60.392 56 Z", opacity: 0.15 },
	{ path: "M70.784 38 L81.176 32 L81.176 44 L70.784 50 Z", opacity: 0.45 },
	{ path: "M81.176 32 L91.568 26 L91.568 38 L81.176 44 Z", opacity: 0.25 },
	{ path: "M50 62 L60.392 56 L60.392 68 L50 74 Z", opacity: 0.5 },
	{ path: "M60.392 56 L70.784 50 L70.784 62 L60.392 68 Z", opacity: 0.35 },
	{ path: "M70.784 50 L81.176 44 L81.176 56 L70.784 62 Z", opacity: 0.1 },
	{ path: "M81.176 44 L91.568 38 L91.568 50 L81.176 56 Z", opacity: 0.4 },
	{ path: "M50 74 L60.392 68 L60.392 80 L50 86 Z", opacity: 0.2 },
	{ path: "M60.392 68 L70.784 62 L70.784 74 L60.392 80 Z", opacity: 0.55 },
	{ path: "M70.784 62 L81.176 56 L81.176 68 L70.784 74 Z", opacity: 0.3 },
	{ path: "M81.176 56 L91.568 50 L91.568 62 L81.176 68 Z", opacity: 0.15 },
	{ path: "M50 86 L60.392 80 L60.392 92 L50 98 Z", opacity: 0.45 },
	{ path: "M60.392 80 L70.784 74 L70.784 86 L60.392 92 Z", opacity: 0.25 },
	{ path: "M70.784 74 L81.176 68 L81.176 80 L70.784 86 Z", opacity: 0.4 },
	{ path: "M81.176 68 L91.568 62 L91.568 74 L81.176 80 Z", opacity: 0.2 },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({
	isReady,
	onComplete,
}) => {
	const { colors, isDark } = useTheme();
	const [isAnimating, setIsAnimating] = useState(true);
	const logoOpacity = useSharedValue(1);

	const strokeColor = isDark ? "white" : "black";
	const fillColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
	const logoFillColor = isDark ? "white" : "black";
	const cellHighlightColor = isDark
		? "rgba(255,255,255,0.35)"
		: "rgba(0,0,0,0.4)";

	useEffect(() => {
		// Match desktop's 3s pulse animation
		logoOpacity.value = withRepeat(
			withTiming(0.4, {
				duration: 1500,
				easing: Easing.inOut(Easing.ease),
			}),
			-1,
			true,
		);
	}, [logoOpacity]);

	const logoAnimatedStyle = useAnimatedStyle(() => ({
		opacity: logoOpacity.value,
	}));

	const onLayoutRootView = useCallback(async () => {
		if (isReady) {
			setIsAnimating(false);
			await ExpoSplashScreen.hideAsync();
			onComplete?.();
		}
	}, [isReady, onComplete]);

	useEffect(() => {
		if (isReady) {
			onLayoutRootView();
		}
	}, [isReady, onLayoutRootView]);

	if (!isAnimating && isReady) {
		return null;
	}

	return (
		<View
			className={splashScreenStyles.container({})}
			style={{ backgroundColor: colors.background }}
			onLayout={onLayoutRootView}
		>
			<View className={splashScreenStyles.logoContainer({})}>
				<Svg width={180} height={180} viewBox="0 0 100 100" fill="none">
					<Path
						d={`M${CENTER.x} ${CENTER.y} L${LEFT.x} ${LEFT.y} L${BOTTOM_LEFT.x} ${BOTTOM_LEFT.y} L${BOTTOM.x} ${BOTTOM.y} Z`}
						fill={fillColor}
						stroke={strokeColor}
						strokeWidth={2}
						strokeLinejoin="round"
					/>

					{LEFT_FACE_CELLS.map((cell, index) => (
						<Path
							key={`left-${cell.path}-${index}`}
							d={cell.path}
							fill={cellHighlightColor}
							opacity={cell.opacity}
						/>
					))}

					<Path
						d={`M${CENTER.x} ${CENTER.y} L${RIGHT.x} ${RIGHT.y} L${BOTTOM_RIGHT.x} ${BOTTOM_RIGHT.y} L${BOTTOM.x} ${BOTTOM.y} Z`}
						fill={fillColor}
						stroke={strokeColor}
						strokeWidth={2}
						strokeLinejoin="round"
					/>

					{RIGHT_FACE_CELLS.map((cell, index) => (
						<Path
							key={`right-${cell.path}-${index}`}
							d={cell.path}
							fill={cellHighlightColor}
							opacity={cell.opacity}
						/>
					))}

					<Path
						d={`M${TOP.x} ${TOP.y} L${LEFT.x} ${LEFT.y} L${CENTER.x} ${CENTER.y} L${RIGHT.x} ${RIGHT.y} Z`}
						fill="none"
						stroke={strokeColor}
						strokeWidth={2}
						strokeLinejoin="round"
					/>
				</Svg>

				{/* @ts-expect-error - react-native-reanimated types incompatible with React 19 */}
				<Animated.View
					className={splashScreenStyles.logoOverlay({})}
					style={logoAnimatedStyle}
				>
					<Svg width={180} height={180} viewBox="0 0 100 100" fill="none">
						<G transform={`${ISO_MATRIX} scale(0.75)`}>
							<Path
								fillRule="evenodd"
								clipRule="evenodd"
								d="M-16 -20 L16 -20 L16 20 L-16 20 Z M-8 -12 L-8 12 L8 12 L8 -12 Z"
								fill={logoFillColor}
							/>
							<Path
								d="M-8 -4 L8 -4 L8 12 L-8 12 Z"
								fill={logoFillColor}
								fillOpacity={0.4}
							/>
						</G>
					</Svg>
				</Animated.View>
			</View>
		</View>
	);
};

export default SplashScreen;
