import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function Index() {
	const [isLoading, setIsLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		async function checkAuth() {
			try {
				const token = await SecureStore.getItemAsync("auth_token");
				const serverUrl = await SecureStore.getItemAsync("server_url");
				setIsAuthenticated(!!token && !!serverUrl);
			} catch {
				setIsAuthenticated(false);
			} finally {
				setIsLoading(false);
			}
		}
		checkAuth();
	}, []);

	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<ActivityIndicator size="large" color="#EC8B49" />
			</View>
		);
	}

	if (isAuthenticated) {
		return <Redirect href="/(tabs)/chat" />;
	}

	return <Redirect href="/onboarding" />;
}
