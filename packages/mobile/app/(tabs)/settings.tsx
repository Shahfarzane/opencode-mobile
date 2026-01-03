import { router } from "expo-router";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	Switch,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { settingsApi, type SettingsPayload } from "../../src/api";
import { useConnectionStore } from "../../src/stores/useConnectionStore";

type SettingsItemProps = {
	icon: React.ReactNode;
	title: string;
	subtitle?: string;
	onPress?: () => void;
	danger?: boolean;
	rightElement?: React.ReactNode;
};

function SettingsItem({
	icon,
	title,
	subtitle,
	onPress,
	danger,
	rightElement,
}: SettingsItemProps) {
	return (
		<Pressable
			onPress={onPress}
			disabled={!onPress}
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
			{rightElement || (
				<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
					<Path
						d="M9 18l6-6-6-6"
						stroke="#878580"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</Svg>
			)}
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
	const { serverUrl, disconnect, directory } = useConnectionStore();

	const [settings, setSettings] = useState<SettingsPayload | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	const loadSettings = useCallback(async () => {
		try {
			const result = await settingsApi.load();
			setSettings(result.settings);
		} catch {
			setSettings(null);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadSettings();
	}, [loadSettings]);

	const handleToggleSetting = async (
		key: keyof SettingsPayload,
		value: boolean,
	) => {
		if (isSaving) return;

		setIsSaving(true);
		try {
			const updated = await settingsApi.save({ [key]: value });
			setSettings(updated);
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "Failed to save setting",
			);
		} finally {
			setIsSaving(false);
		}
	};

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
								err instanceof Error ? err.message : "Failed to restart",
							);
						}
					},
				},
			],
		);
	};

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
		Linking.openURL("https://github.com/btriapitsyn/openchamber");
	};

	const serverHost = serverUrl
		? new URL(serverUrl).host
		: "Not connected";

	return (
		<View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
			<View className="border-b border-border px-4 py-3">
				<Text className="font-mono text-lg font-semibold text-foreground">
					Settings
				</Text>
			</View>

			{isLoading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" />
				</View>
			) : (
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
						subtitle={serverHost}
						rightElement={<View />}
					/>
					<SettingsItem
						icon={
							<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
								<Path
									d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
									stroke="#EC8B49"
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</Svg>
						}
						title="Directory"
						subtitle={directory || "Not selected"}
						rightElement={<View />}
					/>
					<SettingsItem
						icon={
							<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
								<Path
									d="M23 4v6h-6M1 20v-6h6"
									stroke="#EC8B49"
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<Path
									d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
									stroke="#EC8B49"
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</Svg>
						}
						title="Restart OpenCode"
						subtitle="Restart the backend server"
						onPress={handleRestartOpenCode}
					/>

					<SectionDivider title="Preferences" />
					<SettingsItem
						icon={
							<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
								<Path
									d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"
									stroke="#EC8B49"
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</Svg>
						}
						title="Show Reasoning Traces"
						subtitle="Display AI thinking process"
						rightElement={
							<Switch
								value={settings?.showReasoningTraces ?? true}
								onValueChange={(value) =>
									handleToggleSetting("showReasoningTraces", value)
								}
								trackColor={{ false: "#343331", true: "#EC8B49" }}
								thumbColor="#FFFCF0"
							/>
						}
					/>
					<SettingsItem
						icon={
							<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
								<Path
									d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
									stroke="#EC8B49"
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</Svg>
						}
						title="Auto-delete Sessions"
						subtitle={
							settings?.autoDeleteEnabled
								? `After ${settings?.autoDeleteAfterDays ?? 7} days`
								: "Disabled"
						}
						rightElement={
							<Switch
								value={settings?.autoDeleteEnabled ?? false}
								onValueChange={(value) =>
									handleToggleSetting("autoDeleteEnabled", value)
								}
								trackColor={{ false: "#343331", true: "#EC8B49" }}
								thumbColor="#FFFCF0"
							/>
						}
					/>
					<SettingsItem
						icon={
							<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
								<Rect
									x="3"
									y="3"
									width="18"
									height="18"
									rx="2"
									stroke="#EC8B49"
									strokeWidth={2}
								/>
								<Path
									d="M9 3v18M15 3v18M3 9h18M3 15h18"
									stroke="#EC8B49"
									strokeWidth={2}
									strokeLinecap="round"
								/>
							</Svg>
						}
						title="Queue Mode"
						subtitle="Queue messages while processing"
						rightElement={
							<Switch
								value={settings?.queueModeEnabled ?? false}
								onValueChange={(value) =>
									handleToggleSetting("queueModeEnabled", value)
								}
								trackColor={{ false: "#343331", true: "#EC8B49" }}
								thumbColor="#FFFCF0"
							/>
						}
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
						subtitle="1.4.0"
						rightElement={<View />}
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
						subtitle="btriapitsyn/openchamber"
						onPress={handleOpenGitHub}
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
			)}
		</View>
	);
}
