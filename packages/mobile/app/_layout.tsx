import "../src/styles/index.css";

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "../src/theme";

// Keep the splash screen visible until we explicitly hide it
// This MUST be called at module level (not inside components) to work reliably in preview builds
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
	const { colors, isDark } = useTheme();

	return (
		<>
			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: {
						backgroundColor: colors.background,
					},
					animation: "slide_from_right",
				}}
			>
				<Stack.Screen name="index" />
				<Stack.Screen name="onboarding" />
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
				<Stack.Screen
					name="settings"
					options={{
						presentation: "fullScreenModal",
						animation: "slide_from_bottom",
					}}
				/>
			</Stack>
			<StatusBar style={isDark ? "light" : "dark"} />
		</>
	);
}

export default function RootLayout() {
	/* eslint-disable @typescript-eslint/no-require-imports -- Metro bundler requires static require() for assets */
	const [fontsLoaded, fontError] = useFonts({
		// Sans fonts - for UI text (headers, labels, buttons, settings)
		"IBMPlexSans-Regular": require("../assets/fonts/IBMPlexSans-Regular.ttf"),
		"IBMPlexSans-Medium": require("../assets/fonts/IBMPlexSans-Medium.ttf"),
		"IBMPlexSans-SemiBold": require("../assets/fonts/IBMPlexSans-SemiBold.ttf"),
		"IBMPlexSans-Bold": require("../assets/fonts/IBMPlexSans-Bold.ttf"),
		// Mono fonts - for code blocks and technical content
		"IBMPlexMono-Regular": require("../assets/fonts/IBMPlexMono-Regular.ttf"),
		"IBMPlexMono-Medium": require("../assets/fonts/IBMPlexMono-Medium.ttf"),
		"IBMPlexMono-SemiBold": require("../assets/fonts/IBMPlexMono-SemiBold.ttf"),
		"IBMPlexMono-Bold": require("../assets/fonts/IBMPlexMono-Bold.ttf"),
	});
	/* eslint-enable @typescript-eslint/no-require-imports */

	useEffect(() => {
		if (fontError) {
			console.error("Font loading error:", fontError);
		}
		if (fontsLoaded) {
			console.log("Fonts loaded successfully");
		}
		if (fontsLoaded || fontError) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded, fontError]);

	// Don't render until fonts are loaded
	if (!fontsLoaded && !fontError) {
		return null;
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<BottomSheetModalProvider>
				<SafeAreaProvider>
					<ThemeProvider>
						<RootLayoutContent />
					</ThemeProvider>
				</SafeAreaProvider>
			</BottomSheetModalProvider>
		</GestureHandlerRootView>
	);
}
