import * as Linking from "expo-linking";
import {
	SettingsGroup,
	SettingsRow,
	SettingsScreen,
} from "@/components/settings";

export default function AboutScreen() {
	const handleOpenGitHub = () => {
		Linking.openURL("https://github.com/btriapitsyn/openchamber");
	};

	return (
		<SettingsScreen title="About">
			<SettingsGroup>
				<SettingsRow
					title="Version"
					value="1.4.0"
				/>
				<SettingsRow
					title="GitHub"
					value="btriapitsyn/openchamber"
					onPress={handleOpenGitHub}
				/>
			</SettingsGroup>

			<SettingsGroup footer="OpenChamber is open-source software.">
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
