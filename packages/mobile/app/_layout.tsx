import "../global.css";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const colorScheme = useColorScheme();

	const [fontsLoaded, fontError] = useFonts({
		// eslint-disable-next-line @typescript-eslint/no-require-imports -- require() is necessary for Expo font asset loading
		"IBMPlexMono-Regular": require("../assets/fonts/IBMPlexMono-Regular.ttf"),
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		"IBMPlexMono-Medium": require("../assets/fonts/IBMPlexMono-Medium.ttf"),
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		"IBMPlexMono-SemiBold": require("../assets/fonts/IBMPlexMono-SemiBold.ttf"),
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		"IBMPlexMono-Bold": require("../assets/fonts/IBMPlexMono-Bold.ttf"),
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
		<GestureHandlerRootView className="flex-1">
			<SafeAreaProvider>
				<Stack
					screenOptions={{
						headerShown: false,
						contentStyle: {
							backgroundColor: colorScheme === "dark" ? "#100F0F" : "#FFFCF0",
						},
						animation: "slide_from_right",
					}}
				>
					<Stack.Screen name="index" />
					<Stack.Screen name="onboarding" />
					<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
				</Stack>
				<StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
