import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type SettingsItemProps = {
	icon: React.ReactNode;
	title: string;
	subtitle?: string;
	onPress?: () => void;
	danger?: boolean;
};

function SettingsItem({
	icon,
	title,
	subtitle,
	onPress,
	danger,
}: SettingsItemProps) {
	return (
		<Pressable
			onPress={onPress}
			className="flex-row items-center gap-4 px-4 py-4 active:bg-muted"
		>
			<View className="h-10 w-10 items-center justify-center rounded-lg bg-muted">
				{icon}
			</View>
			<View className="flex-1">
				<Text
					className={`font-mono text-base ${danger ? "text-destructive" : "text-foreground"}`}
				>
					{title}
				</Text>
				{subtitle && (
					<Text className="font-mono text-sm text-muted-foreground">
						{subtitle}
					</Text>
				)}
			</View>
			<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
				<Path
					d="M9 18l6-6-6-6"
					stroke="#878580"
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</Svg>
		</Pressable>
	);
}

function SectionDivider({ title }: { title: string }) {
	return (
		<View className="bg-muted px-4 py-2">
			<Text className="font-mono text-xs font-medium uppercase text-muted-foreground">
				{title}
			</Text>
		</View>
	);
}

export default function SettingsScreen() {
	const insets = useSafeAreaInsets();

	async function handleDisconnect() {
		Alert.alert(
			"Disconnect",
			"Are you sure you want to disconnect from the server?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Disconnect",
					style: "destructive",
					onPress: async () => {
						await SecureStore.deleteItemAsync("auth_token");
						await SecureStore.deleteItemAsync("server_url");
						router.replace("/onboarding");
					},
				},
			],
		);
	}

	return (
		<View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
			<View className="border-b border-border px-4 py-3">
				<Text className="font-mono text-lg font-semibold text-foreground">
					Settings
				</Text>
			</View>

			<ScrollView className="flex-1">
				<SectionDivider title="Connection" />
				<SettingsItem
					icon={
						<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
							<Circle cx="12" cy="12" r="10" stroke="#EC8B49" strokeWidth={2} />
							<Path
								d="M12 6v6l4 2"
								stroke="#EC8B49"
								strokeWidth={2}
								strokeLinecap="round"
							/>
						</Svg>
					}
					title="Server"
					subtitle="192.168.1.100:3000"
					onPress={() => {}}
				/>
				<SettingsItem
					icon={
						<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
							<Rect
								x="3"
								y="11"
								width="18"
								height="11"
								rx="2"
								stroke="#EC8B49"
								strokeWidth={2}
							/>
							<Path
								d="M7 11V7a5 5 0 0110 0v4"
								stroke="#EC8B49"
								strokeWidth={2}
							/>
						</Svg>
					}
					title="Security"
					subtitle="Biometric unlock enabled"
					onPress={() => {}}
				/>

				<SectionDivider title="Appearance" />
				<SettingsItem
					icon={
						<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
							<Circle cx="12" cy="12" r="4" stroke="#EC8B49" strokeWidth={2} />
							<Path
								d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
								stroke="#EC8B49"
								strokeWidth={2}
								strokeLinecap="round"
							/>
						</Svg>
					}
					title="Theme"
					subtitle="System"
					onPress={() => {}}
				/>
				<SettingsItem
					icon={
						<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
							<Path
								d="M4 7V4h16v3M9 20h6M12 4v16"
								stroke="#EC8B49"
								strokeWidth={2}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</Svg>
					}
					title="Text Size"
					subtitle="Medium"
					onPress={() => {}}
				/>

				<SectionDivider title="About" />
				<SettingsItem
					icon={
						<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
							<Circle cx="12" cy="12" r="10" stroke="#EC8B49" strokeWidth={2} />
							<Path
								d="M12 16v-4M12 8h.01"
								stroke="#EC8B49"
								strokeWidth={2}
								strokeLinecap="round"
							/>
						</Svg>
					}
					title="Version"
					subtitle="1.4.0 (build 1)"
					onPress={() => {}}
				/>
				<SettingsItem
					icon={
						<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
							<Path
								d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
								stroke="#EC8B49"
								strokeWidth={2}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</Svg>
					}
					title="GitHub"
					subtitle="openchamber/openchamber"
					onPress={() => {}}
				/>

				<View className="h-4" />

				<SettingsItem
					icon={
						<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
							<Path
								d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
								stroke="#D14D41"
								strokeWidth={2}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</Svg>
					}
					title="Disconnect"
					onPress={handleDisconnect}
					danger
				/>

				<View style={{ height: insets.bottom + 20 }} />
			</ScrollView>
		</View>
	);
}
