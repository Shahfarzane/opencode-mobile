import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useConnectionStore } from "../src/stores/useConnectionStore";

export default function Index() {
	const { initialize, isInitialized, isConnected } = useConnectionStore();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function init() {
			await initialize();
			setIsLoading(false);
		}
		init();
	}, [initialize]);

	if (isLoading || !isInitialized) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<ActivityIndicator size="large" color="#EC8B49" />
			</View>
		);
	}

	if (isConnected) {
		return <Redirect href="/(tabs)/chat" />;
	}

	return <Redirect href="/onboarding" />;
}
