import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeftIcon } from "@/components/icons";
import { Button, Input } from "@/components/ui";
import { useServerConnection } from "@/hooks/useServerConnection";
import { Spacing, typography, useTheme } from "../../src/theme";

type ConnectionType = "local" | "tailscale" | "cloudflare";

const CONFIGS: Record<
	ConnectionType,
	{ label: string; placeholder: string; hint: string }
> = {
	local: {
		label: "Local",
		placeholder: "192.168.1.100:3000",
		hint: "Your computer's local IP and port",
	},
	tailscale: {
		label: "Tailscale",
		placeholder: "my-mac.tailnet.ts.net:3000",
		hint: "Tailscale hostname or 100.x.x.x IP",
	},
	cloudflare: {
		label: "Cloudflare",
		placeholder: "your-tunnel.trycloudflare.com",
		hint: "Tunnel URL (no port needed)",
	},
};

function BackButton() {
	const { colors } = useTheme();

	return (
		<Pressable
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				router.back();
			}}
			style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
			hitSlop={8}
		>
			<ChevronLeftIcon size={18} color={colors.foreground} />
			<Text style={[typography.uiLabel, { color: colors.foreground }]}>
				Back
			</Text>
		</Pressable>
	);
}

export default function ManualScreen() {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	const [connectionType, setConnectionType] = useState<ConnectionType>("local");
	const [serverUrl, setServerUrl] = useState("");
	const [password, setPassword] = useState("");
	const { connectWithPassword, isConnecting } = useServerConnection();

	const config = CONFIGS[connectionType];

	async function handleConnect() {
		if (!serverUrl.trim()) {
			Alert.alert("Error", "Please enter a server URL");
			return;
		}

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

		try {
			let url = serverUrl.trim();
			const hasProtocol =
				url.startsWith("http://") || url.startsWith("https://");
			const isCloudflare =
				connectionType === "cloudflare" || url.includes(".trycloudflare.com");

			if (!hasProtocol) {
				url = `${isCloudflare ? "https" : "http"}://${url}`;
			}

			await connectWithPassword(url, password);

			// Navigate to directory selection so user can choose their project directory
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			router.replace("/onboarding/directory");
		} catch (error) {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			Alert.alert(
				"Connection Failed",
				error instanceof Error ? error.message : "Could not connect to server",
			);
		}
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "position" : "height"}
			style={[styles.container, { backgroundColor: colors.background }]}
			keyboardVerticalOffset={insets.top + Spacing.sm}
		>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={{
					paddingTop: insets.top + Spacing.md,
					paddingBottom: insets.bottom + Spacing.xl,
					paddingHorizontal: Spacing.lg,
					flexGrow: 1,
				}}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<BackButton />

				<Text
					style={[
						typography.h2,
						{ color: colors.foreground, marginTop: Spacing.md },
					]}
				>
					Connect to Server
				</Text>
				<Text
					style={[
						typography.meta,
						{ color: colors.mutedForeground, marginTop: 8, lineHeight: 20 },
					]}
				>
					Enter your server details below
				</Text>

				{/* Connection type tabs */}
				<View style={[styles.tabs, { borderColor: colors.border + "66" }]}>
					{(Object.keys(CONFIGS) as ConnectionType[]).map((type) => {
						const isActive = connectionType === type;
						return (
							<Pressable
								key={type}
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									setConnectionType(type);
								}}
								style={[
									styles.tab,
									isActive && { backgroundColor: colors.primary + "1A" },
								]}
							>
								<Text
									style={[
										typography.meta,
										{
											color: isActive ? colors.primary : colors.mutedForeground,
											fontWeight: isActive ? "600" : "400",
										},
									]}
								>
									{CONFIGS[type].label}
								</Text>
							</Pressable>
						);
					})}
				</View>

				{/* Server URL */}
				<View style={styles.field}>
					<Input
						label="Server URL"
						value={serverUrl}
						onChangeText={setServerUrl}
						placeholder={config.placeholder}
						autoCapitalize="none"
						autoCorrect={false}
						keyboardType="url"
						helperText={config.hint}
					/>
				</View>

				{/* Password */}
				<View style={styles.field}>
					<Input
						label="Password (optional)"
						value={password}
						onChangeText={setPassword}
						placeholder="Enter UI password"
						autoCapitalize="none"
						autoCorrect={false}
						secureTextEntry
					/>
				</View>

				{/* Connect button */}
				<View style={styles.actionArea}>
					<Button
						variant="primary"
						size="lg"
						onPress={handleConnect}
						isDisabled={isConnecting}
						isLoading={isConnecting}
						style={{ width: "100%" }}
					>
						<Button.Label>{isConnecting ? "Connecting..." : "Connect"}</Button.Label>
					</Button>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	backBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		alignSelf: "flex-start",
		paddingVertical: 8,
		paddingRight: 12,
	},
	tabs: {
		flexDirection: "row",
		marginTop: 32,
		borderWidth: 1,
		borderRadius: 8,
		overflow: "hidden",
	},
	tab: {
		flex: 1,
		alignItems: "center",
		paddingVertical: 12,
	},
	field: {
		marginTop: 24,
	},
	input: {
		marginTop: 8,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	actionArea: {
		marginTop: "auto",
		paddingTop: 32,
	},
	connectBtn: {
		borderRadius: 8,
		paddingVertical: 14,
		alignItems: "center",
	},
});
