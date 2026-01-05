import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SplashScreen } from "../src/components/ui/SplashScreen";
import { useConnectionStore } from "../src/stores/useConnectionStore";
import { useTheme } from "../src/theme";

export default function Index() {
	const { initialize, isInitialized, isConnected } = useConnectionStore();
	const { colors } = useTheme();
	const [isLoading, setIsLoading] = useState(true);
	const [showSplash, setShowSplash] = useState(true);

	useEffect(() => {
		async function init() {
			await initialize();
			setIsLoading(false);
		}
		init();
	}, [initialize]);

	const isReady = !isLoading && isInitialized;

	// Show splash screen while loading
	if (showSplash) {
		return (
			<View style={{ flex: 1, backgroundColor: colors.background }}>
				<SplashScreen
					isReady={isReady}
					onComplete={() => setShowSplash(false)}
				/>
			</View>
		);
	}

	if (isConnected) {
		return <Redirect href="/(tabs)/chat" />;
	}

	return <Redirect href="/onboarding" />;
}
