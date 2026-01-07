import { router } from "expo-router";
import { Alert } from "react-native";
import {
	SettingsGroup,
	SettingsRow,
	SettingsScreen,
} from "@/components/settings";
import { settingsApi } from "@/api";
import { useConnectionStore } from "@/stores/useConnectionStore";

function getConnectionType(url: string | null): {
	type: string;
	label: string;
} {
	if (!url) return { type: "unknown", label: "Not connected" };

	const isTailscale = url.includes(".ts.net") || /100\.\d+\.\d+\.\d+/.test(url);
	const isCloudflare =
		url.includes(".trycloudflare.com") || url.includes("cloudflare");

	if (isTailscale) return { type: "tailscale", label: "via Tailscale" };
	if (isCloudflare) return { type: "cloudflare", label: "via Cloudflare" };
	return { type: "local", label: "Local Network" };
}

export default function ConnectionScreen() {
	const { serverUrl, directory } = useConnectionStore();

	const serverHost = serverUrl ? new URL(serverUrl).host : "Not connected";
	const connectionInfo = getConnectionType(serverUrl);
	const directoryDisplay = directory
		? directory.split("/").slice(-2).join("/")
		: "Not selected";

	const handleRestartOpenCode = async () => {
		Alert.alert(
			"Restart OpenCode",
			"This will restart the OpenCode server. Continue?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Restart",
					onPress: async () => {
						try {
							await settingsApi.restartOpenCode();
							Alert.alert("Success", "OpenCode is restarting...");
						} catch (err) {
							Alert.alert(
								"Error",
								err instanceof Error ? err.message : "Failed to restart"
							);
						}
					},
				},
			]
		);
	};

	return (
		<SettingsScreen title="Connection">
			<SettingsGroup footer={`Connected ${connectionInfo.label}`}>
				<SettingsRow
					title="Server"
					value={serverHost}
				/>
			</SettingsGroup>

			<SettingsGroup>
				<SettingsRow
					title="Directory"
					value={directoryDisplay}
					onPress={() => router.push("/onboarding/directory")}
				/>
			</SettingsGroup>

			<SettingsGroup footer="Restart the backend server if you encounter issues.">
				<SettingsRow
					title="Restart OpenCode"
					onPress={handleRestartOpenCode}
				/>
			</SettingsGroup>
		</SettingsScreen>
	);
}
