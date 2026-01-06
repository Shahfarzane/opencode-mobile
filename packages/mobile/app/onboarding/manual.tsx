import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useServerConnection } from "@/hooks/useServerConnection";

type ConnectionType = "local" | "tailscale" | "cloudflare";

interface ConnectionTypeConfig {
	id: ConnectionType;
	label: string;
	placeholder: string;
	hint: string;
	icon: React.ReactNode;
	helpSteps: string[];
}

const CONNECTION_CONFIGS: Record<ConnectionType, ConnectionTypeConfig> = {
	local: {
		id: "local",
		label: "Local Network",
		placeholder: "192.168.1.100:3000",
		hint: "Your computer's local IP address and port",
		icon: (
			<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
				<Path
					d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
					stroke="currentColor"
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</Svg>
		),
		helpSteps: [
			"Make sure your phone is on the same WiFi as your computer",
			"Find your computer's IP address (e.g., 192.168.1.x)",
			"OpenChamber runs on port 3000 by default",
		],
	},
	tailscale: {
		id: "tailscale",
		label: "Tailscale",
		placeholder: "my-macbook.tailnet-name.ts.net:3000",
		hint: "Your device's Tailscale hostname or 100.x.x.x IP",
		icon: (
			<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
				<Path
					d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
					stroke="currentColor"
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</Svg>
		),
		helpSteps: [
			"Install the Tailscale app on your iPhone and computer",
			"Sign in to both devices with the same Tailscale account",
			"Make sure Tailscale VPN is active on your iPhone",
			"Use the Tailscale IP (100.x.x.x) or MagicDNS hostname",
		],
	},
	cloudflare: {
		id: "cloudflare",
		label: "Cloudflare Tunnel",
		placeholder: "your-tunnel.trycloudflare.com",
		hint: "Your Cloudflare tunnel URL (no port needed)",
		icon: (
			<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
				<Path
					d="M22 12h-4l-3 9L9 3l-3 9H2"
					stroke="currentColor"
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</Svg>
		),
		helpSteps: [
			"Start OpenChamber with --try-cf-tunnel flag",
			"Copy the generated tunnel URL from the terminal",
			"No port number needed - HTTPS is handled automatically",
		],
	},
};

const CONNECTION_TYPES = Object.values(CONNECTION_CONFIGS);

function ConnectionTypeSelector({
	selected,
	onSelect,
}: {
	selected: ConnectionType;
	onSelect: (type: ConnectionType) => void;
}) {
	return (
		<View className="flex-row gap-2">
			{CONNECTION_TYPES.map((type) => {
				const isSelected = selected === type.id;
				return (
					<Pressable
						key={type.id}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							onSelect(type.id);
						}}
						className={`flex-1 items-center rounded-lg border px-2 py-3 ${
							isSelected
								? "border-primary bg-primary/10"
								: "border-border bg-muted/50"
						}`}
					>
						<View className={isSelected ? "text-primary" : "text-muted-foreground"}>
							<View style={{ opacity: isSelected ? 1 : 0.5 }}>
								{type.icon}
							</View>
						</View>
						<Text
							className={`mt-1 text-center font-mono text-xs ${
								isSelected
									? "font-medium text-primary"
									: "text-muted-foreground"
							}`}
						>
							{type.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

function HelpSection({ config }: { config: ConnectionTypeConfig }) {
	const [expanded, setExpanded] = useState(false);

	return (
		<View className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
			<Pressable
				onPress={() => {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					setExpanded(!expanded);
				}}
				className="flex-row items-center justify-between"
			>
				<View className="flex-row items-center gap-2">
					<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
						<Path
							d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01"
							stroke="#878580"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</Svg>
					<Text className="font-mono text-sm font-medium text-foreground">
						How to connect via {config.label}
					</Text>
				</View>
				<Svg
					width={16}
					height={16}
					viewBox="0 0 24 24"
					fill="none"
					style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
				>
					<Path
						d="M6 9l6 6 6-6"
						stroke="#878580"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</Svg>
			</Pressable>

			{expanded && (
				<View className="mt-3 gap-2">
					{config.helpSteps.map((step, stepIndex) => (
						<View key={`${config.id}-step-${stepIndex}`} className="flex-row items-start gap-2">
							<Text className="font-mono text-xs text-primary">
								{stepIndex + 1}.
							</Text>
							<Text className="flex-1 font-mono text-xs text-muted-foreground">
								{step}
							</Text>
						</View>
					))}

					{config.id === "tailscale" && (
						<View className="mt-2 rounded-md bg-primary/10 p-2">
							<Text className="font-mono text-xs text-primary">
								Tip: Find your Tailscale IP in the Tailscale app under "This device"
							</Text>
						</View>
					)}
				</View>
			)}
		</View>
	);
}

export default function ManualScreen() {
	const insets = useSafeAreaInsets();
	const [connectionType, setConnectionType] = useState<ConnectionType>("local");
	const [serverUrl, setServerUrl] = useState("");
	const [password, setPassword] = useState("");
	const { connectWithPassword, isConnecting } = useServerConnection();

	const selectedConfig = CONNECTION_CONFIGS[connectionType];

	async function handleConnect() {
		if (!serverUrl.trim()) {
			Alert.alert("Error", "Please enter a server URL");
			return;
		}

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

		try {
			let normalizedUrl = serverUrl.trim();

			const hasProtocol = normalizedUrl.startsWith("http://") || normalizedUrl.startsWith("https://");
			const isCloudflareUrl = connectionType === "cloudflare" || normalizedUrl.includes(".trycloudflare.com");

			if (!hasProtocol) {
				const protocol = isCloudflareUrl ? "https" : "http";
				normalizedUrl = `${protocol}://${normalizedUrl}`;
			}

			await connectWithPassword(normalizedUrl, password);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			router.push("/onboarding/directory");
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
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			className="flex-1 bg-background"
		>
			<ScrollView
				className="flex-1"
				contentContainerStyle={{
					paddingTop: insets.top + 16,
					paddingBottom: insets.bottom + 20,
					paddingHorizontal: 24,
					flexGrow: 1,
				}}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<Pressable onPress={() => router.back()} className="self-start py-2">
					<Text className="font-mono text-primary">← Back</Text>
				</Pressable>

				<View className="mt-6">
					<Text className="font-mono text-2xl font-semibold text-foreground">
						Connect to Server
					</Text>

					<Text className="mt-2 font-mono text-sm text-muted-foreground">
						Choose your connection method and enter server details
					</Text>
				</View>

				<View className="mt-6">
					<Text className="mb-3 font-mono text-xs font-medium uppercase text-muted-foreground">
						Connection Type
					</Text>
					<ConnectionTypeSelector
						selected={connectionType}
						onSelect={setConnectionType}
					/>
				</View>

				<View className="mt-6 gap-4">
					<View>
						<Text className="mb-2 font-mono text-sm text-muted-foreground">
							Server URL
						</Text>
						<TextInput
							value={serverUrl}
							onChangeText={setServerUrl}
							placeholder={selectedConfig.placeholder}
							placeholderTextColor="#878580"
							autoCapitalize="none"
							autoCorrect={false}
							keyboardType="url"
							className="rounded-lg border border-border bg-input px-4 py-3 font-mono text-foreground"
						/>
						<Text className="mt-1.5 font-mono text-xs text-muted-foreground">
							{selectedConfig.hint}
						</Text>
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

				<HelpSection config={selectedConfig} />

				<View className="mt-auto pt-6">
					<Pressable
						onPress={handleConnect}
						disabled={isConnecting}
						className="rounded-lg bg-primary px-6 py-4 active:opacity-80 disabled:opacity-50"
					>
						<Text className="text-center font-mono text-base font-semibold text-primary-foreground">
							{isConnecting ? "Connecting..." : "Connect"}
						</Text>
					</Pressable>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
