import { router } from "expo-router";
import { Alert } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import {
	SettingsGroup,
	SettingsRow,
	SettingsScreen,
} from "@/components/settings";
import { FolderIcon, RefreshIcon } from "@/components/icons";
import { settingsApi } from "@/api";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { useTheme } from "@/theme";

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

function ServerIcon({ color }: { color: string }) {
	return (
		<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
			<Path
				d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export default function ConnectionScreen() {
	const { colors } = useTheme();
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
			<SettingsGroup header="Server" footer={`Connected ${connectionInfo.label}`}>
				<SettingsRow
					icon={<ServerIcon color={colors.primary} />}
					title="Server"
					value={serverHost}
				/>
			</SettingsGroup>

			<SettingsGroup header="Project">
				<SettingsRow
					icon={<FolderIcon size={20} color={colors.primary} />}
					title="Project Directory"
					subtitle={directoryDisplay}
					onPress={() => router.push("/onboarding/directory")}
				/>
			</SettingsGroup>

			<SettingsGroup footer="Restart the backend server if you encounter issues.">
				<SettingsRow
					icon={<RefreshIcon size={20} color={colors.primary} />}
					title="Restart OpenCode"
					onPress={handleRestartOpenCode}
				/>
			</SettingsGroup>
		</SettingsScreen>
	);
}
