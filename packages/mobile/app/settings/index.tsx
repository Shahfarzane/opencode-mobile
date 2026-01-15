import * as Linking from "expo-linking";
import { router } from "expo-router";
import { Alert } from "react-native";
import {
	SettingsGroup,
	SettingsRow,
	SettingsScreen,
} from "@/components/settings";
import { useConnectionStore } from "@/stores/useConnectionStore";
import packageJson from "../../package.json";

export default function SettingsIndexScreen() {
	const { disconnect } = useConnectionStore();

	const handleDisconnect = () => {
		Alert.alert(
			"Disconnect",
			"Are you sure you want to disconnect from the server?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Disconnect",
					style: "destructive",
					onPress: async () => {
						await disconnect();
						router.replace("/onboarding");
					},
				},
			],
		);
	};

	const handleOpenGitHub = () => {
		Linking.openURL("https://github.com/Shahfarzane/opencode-mobile");
	};

	return (
		<SettingsScreen title="Settings" showClose>
			<SettingsGroup>
				<SettingsRow
					title="Connection"
					onPress={() => router.push("/settings/connection")}
				/>
				<SettingsRow
					title="Agents"
					onPress={() => router.push("/settings/agents")}
				/>
				<SettingsRow
					title="Commands"
					onPress={() => router.push("/settings/commands")}
				/>
				<SettingsRow
					title="Skills"
					onPress={() => router.push("/settings/skills")}
				/>
				<SettingsRow
					title="Providers"
					onPress={() => router.push("/settings/providers")}
				/>
				<SettingsRow
					title="Git Identities"
					onPress={() => router.push("/settings/git")}
				/>
				<SettingsRow
					title="Appearance"
					onPress={() => router.push("/settings/appearance")}
				/>
				<SettingsRow
					title="Preferences"
					onPress={() => router.push("/settings/preferences")}
				/>
			</SettingsGroup>

			<SettingsGroup>
				<SettingsRow title="Version" value={packageJson.version} />
				<SettingsRow title="GitHub" onPress={handleOpenGitHub} />
			</SettingsGroup>

			<SettingsGroup>
				<SettingsRow
					title="Disconnect"
					destructive
					onPress={handleDisconnect}
				/>
			</SettingsGroup>
		</SettingsScreen>
	);
}
