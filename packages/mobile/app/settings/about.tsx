import * as Linking from "expo-linking";
import {
	SettingsGroup,
	SettingsRow,
	SettingsScreen,
} from "@/components/settings";
import { InfoIcon, GithubIcon } from "@/components/icons";
import { useTheme } from "@/theme";

export default function AboutScreen() {
	const { colors } = useTheme();

	const handleOpenGitHub = () => {
		Linking.openURL("https://github.com/btriapitsyn/openchamber");
	};

	return (
		<SettingsScreen title="About">
			<SettingsGroup header="App Info">
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

			<SettingsGroup
				header="Legal"
				footer="OpenChamber is open-source software."
			>
				<SettingsRow
					title="Privacy Policy"
					onPress={() =>
						Linking.openURL("https://github.com/btriapitsyn/openchamber")
					}
				/>
				<SettingsRow
					title="Terms of Service"
					onPress={() =>
						Linking.openURL("https://github.com/btriapitsyn/openchamber")
					}
				/>
			</SettingsGroup>
		</SettingsScreen>
	);
}
