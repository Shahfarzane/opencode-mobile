import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SplashScreen } from "../src/components/ui/SplashScreen";
import { useConnectionStore } from "../src/stores/useConnectionStore";
import { useDeepLinkAuth } from "../src/hooks/useDeepLinkAuth";
import { useTheme } from "../src/theme";

export default function Index() {
	const { initialize, isInitialized, isConnected } = useConnectionStore();
	const { colors } = useTheme();
	const [isLoading, setIsLoading] = useState(true);
	const [showSplash, setShowSplash] = useState(true);

	// Handle deep link authentication (URL with token parameter)
	const { isProcessing: isProcessingDeepLink } = useDeepLinkAuth({
		onAuthSuccess: (serverUrl) => {
			console.log(`[Index] Deep link auth successful for: ${serverUrl}`);
		},
		onAuthError: (error) => {
			console.error(`[Index] Deep link auth failed:`, error.message);
		},
	});

	useEffect(() => {
		async function init() {
			await initialize();
			setIsLoading(false);
		}
		init();
	}, [initialize]);

	// Wait for initialization and deep link processing before showing content
	const isReady = !isLoading && isInitialized && !isProcessingDeepLink;

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
