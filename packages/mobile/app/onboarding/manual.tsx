import { router } from "expo-router";
import { useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useServerConnection } from "@/hooks/useServerConnection";

export default function ManualScreen() {
	const insets = useSafeAreaInsets();
	const [serverUrl, setServerUrl] = useState("");
	const [password, setPassword] = useState("");
	const { connectWithPassword, isConnecting } = useServerConnection();

	async function handleConnect() {
		if (!serverUrl.trim()) {
			Alert.alert("Error", "Please enter a server URL");
			return;
		}

		try {
			const normalizedUrl = serverUrl.startsWith("http")
				? serverUrl.trim()
				: `http://${serverUrl.trim()}`;

			await connectWithPassword(normalizedUrl, password);
			router.push("/onboarding/directory");
		} catch (error) {
			Alert.alert(
				"Connection Failed",
				error instanceof Error ? error.message : "Could not connect to server",
			);
		}
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			className="flex-1 bg-background"
		>
			<View
				className="flex-1 px-6"
				style={{
					paddingTop: insets.top + 16,
					paddingBottom: insets.bottom + 20,
				}}
			>
				<Pressable onPress={() => router.back()} className="self-start py-2">
					<Text className="font-mono text-primary">← Back</Text>
				</Pressable>

				<View className="mt-8 flex-1">
					<Text className="font-mono text-2xl font-semibold text-foreground">
						Connect to Server
					</Text>

					<Text className="mt-2 font-mono text-muted-foreground">
						Enter your OpenCode server address
					</Text>

					<View className="mt-8 gap-4">
						<View>
							<Text className="mb-2 font-mono text-sm text-muted-foreground">
								Server URL
							</Text>
							<TextInput
								value={serverUrl}
								onChangeText={setServerUrl}
								placeholder="192.168.1.100:3000 or my-tunnel.trycloudflare.com"
								placeholderTextColor="#878580"
								autoCapitalize="none"
								autoCorrect={false}
								keyboardType="url"
								className="rounded-lg border border-border bg-input px-4 py-3 font-mono text-foreground"
							/>
						</View>

						<View>
							<Text className="mb-2 font-mono text-sm text-muted-foreground">
								Password (if required)
							</Text>
							<TextInput
								value={password}
								onChangeText={setPassword}
								placeholder="Enter UI password"
								placeholderTextColor="#878580"
								secureTextEntry
								autoCapitalize="none"
								autoCorrect={false}
								className="rounded-lg border border-border bg-input px-4 py-3 font-mono text-foreground"
							/>
						</View>
					</View>

					<View className="mt-auto">
						<Pressable
							onPress={handleConnect}
							disabled={isConnecting}
							className="rounded-lg bg-primary px-6 py-4 active:opacity-80 disabled:opacity-50"
						>
							<Text className="text-center font-mono text-base font-semibold text-primary-foreground">
								{isConnecting ? "Connecting..." : "Connect"}
							</Text>
						</Pressable>

						<Text className="mt-4 text-center font-mono text-xs text-muted-foreground">
							Make sure your device is on the same network as your computer, or
							use a Cloudflare tunnel URL
						</Text>
					</View>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
}
