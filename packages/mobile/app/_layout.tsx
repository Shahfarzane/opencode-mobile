import "../global.css";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import IBMPlexMonoBold from "../assets/fonts/IBMPlexMono-Bold.ttf";
import IBMPlexMonoMedium from "../assets/fonts/IBMPlexMono-Medium.ttf";
import IBMPlexMonoRegular from "../assets/fonts/IBMPlexMono-Regular.ttf";
import IBMPlexMonoSemiBold from "../assets/fonts/IBMPlexMono-SemiBold.ttf";
import { ThemeProvider, useTheme } from "../src/theme";

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
			</Stack>
			<StatusBar style={isDark ? "light" : "dark"} />
		</>
	);
}

export default function RootLayout() {
	const [fontsLoaded, fontError] = useFonts({
		"IBMPlexMono-Regular": IBMPlexMonoRegular,
		"IBMPlexMono-Medium": IBMPlexMonoMedium,
		"IBMPlexMono-SemiBold": IBMPlexMonoSemiBold,
		"IBMPlexMono-Bold": IBMPlexMonoBold,
	});

	useEffect(() => {
		if (fontsLoaded || fontError) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded, fontError]);

	if (!fontsLoaded && !fontError) {
		return null;
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<ThemeProvider>
					<RootLayoutContent />
				</ThemeProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
