import * as Linking from "expo-linking";
import { router } from "expo-router";
import { Alert } from "react-native";
import {
	GlobeIcon,
	RobotIcon,
	CommandIcon,
	KeyIcon,
	UsersIcon,
	MoonIcon,
	SettingsIcon,
	InfoIcon,
	GithubIcon,
	LogoutIcon,
} from "@/components/icons";
import {
	SettingsGroup,
	SettingsRow,
	SettingsScreen,
} from "@/components/settings";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { useTheme } from "@/theme";

export default function SettingsIndexScreen() {
	const { colors } = useTheme();
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
			]
		);
	};

	const handleOpenGitHub = () => {
		Linking.openURL("https://github.com/btriapitsyn/openchamber");
	};

	return (
		<SettingsScreen title="Settings" showClose>
			{/* Connection */}
			<SettingsGroup>
				<SettingsRow
					icon={<GlobeIcon size={20} color={colors.primary} />}
					title="Connection"
					subtitle="Server, project directory"
					onPress={() => router.push("/settings/connection")}
				/>
			</SettingsGroup>

			{/* Configuration */}
			<SettingsGroup header="Configuration">
				<SettingsRow
					icon={<RobotIcon size={20} color={colors.primary} />}
					title="Agents"
					subtitle="Manage AI agents"
					onPress={() => router.push("/settings/agents")}
				/>
				<SettingsRow
					icon={<CommandIcon size={20} color={colors.primary} />}
					title="Commands"
					subtitle="Custom commands"
					onPress={() => router.push("/settings/commands")}
				/>
				<SettingsRow
					icon={<KeyIcon size={20} color={colors.primary} />}
					title="Providers"
					subtitle="API providers"
					onPress={() => router.push("/settings/providers")}
				/>
				<SettingsRow
					icon={<UsersIcon size={20} color={colors.primary} />}
					title="Git Identities"
					subtitle="Git commit profiles"
					onPress={() => router.push("/settings/git")}
				/>
			</SettingsGroup>

			{/* Customize */}
			<SettingsGroup header="Customize">
				<SettingsRow
					icon={<MoonIcon size={20} color={colors.primary} />}
					title="Appearance"
					subtitle="Theme settings"
					onPress={() => router.push("/settings/appearance")}
				/>
				<SettingsRow
					icon={<SettingsIcon size={20} color={colors.primary} />}
					title="Preferences"
					subtitle="Reasoning, sessions, queue"
					onPress={() => router.push("/settings/preferences")}
				/>
			</SettingsGroup>

			{/* About */}
			<SettingsGroup header="About">
				<SettingsRow
					icon={<InfoIcon size={20} color={colors.primary} />}
					title="Version"
					value="1.4.0"
				/>
				<SettingsRow
					icon={<GithubIcon size={20} color={colors.primary} />}
					title="GitHub"
					subtitle="btriapitsyn/openchamber"
					onPress={handleOpenGitHub}
				/>
			</SettingsGroup>

			{/* Disconnect */}
			<SettingsGroup>
				<SettingsRow
					icon={<LogoutIcon size={20} color={colors.destructive} />}
					title="Disconnect"
					destructive
					onPress={handleDisconnect}
				/>
			</SettingsGroup>
		</SettingsScreen>
	);
}
