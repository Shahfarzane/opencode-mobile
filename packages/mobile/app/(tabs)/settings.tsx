import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { type SettingsPayload, settingsApi } from "../../src/api";
import {
	CommandIcon,
	KeyIcon,
	RobotIcon,
	UsersIcon,
} from "../../src/components/icons";
import {
	AgentDetailView,
	AgentsList,
	type AgentsListRef,
	CommandDetailView,
	CommandsList,
	type CommandsListRef,
	GitIdentityDetailView,
	GitIdentitiesList,
	type GitIdentitiesListRef,
	ProviderDetailView,
	ProvidersList,
} from "../../src/components/settings";
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { type ThemeMode, useThemeMode } from "../../src/theme/ThemeProvider";
import { typography, useTheme } from "../../src/theme";

type SettingsTab = "general" | "agents" | "commands" | "providers" | "git";

interface TabConfig {
	id: SettingsTab;
	label: string;
	icon: React.ReactNode;
}

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
	const { colors } = useTheme();

	return (
		<Pressable
			onPress={onPress}
			disabled={!onPress}
			style={({ pressed }) => [
				styles.settingsItem,
				pressed && { backgroundColor: colors.muted },
			]}
		>
			{icon}
			<View style={styles.itemContent}>
				<Text
					style={[
						typography.uiLabel,
						{ color: danger ? colors.destructive : colors.foreground },
					]}
				>
					{title}
				</Text>
				{subtitle && (
					<Text style={[typography.meta, { color: colors.mutedForeground }]}>
						{subtitle}
					</Text>
				)}
			</View>
			{rightElement || (
				<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
					<Path
						d="M9 18l6-6-6-6"
						stroke={colors.mutedForeground}
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
	const { colors } = useTheme();

	return (
		<View style={[styles.sectionDivider, { backgroundColor: colors.muted }]}>
			<Text
				style={[
					typography.micro,
					styles.sectionTitle,
					{ color: colors.mutedForeground },
				]}
			>
				{title}
			</Text>
		</View>
	);
}

interface ThemeModeOption {
	value: ThemeMode;
	label: string;
}

const THEME_MODE_OPTIONS: ThemeModeOption[] = [
	{ value: "system", label: "System" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
];

function ThemeModeSelector() {
	const { colors } = useTheme();
	const { themeMode, setThemeMode } = useThemeMode();

	return (
		<View style={[themeSelectorStyles.container, { backgroundColor: colors.muted }]}>
			{THEME_MODE_OPTIONS.map((option) => {
				const isSelected = themeMode === option.value;
				return (
					<Pressable
						key={option.value}
						onPress={() => setThemeMode(option.value)}
						style={[
							themeSelectorStyles.option,
							isSelected && {
								backgroundColor: colors.background,
								shadowColor: "#000",
								shadowOffset: { width: 0, height: 1 },
								shadowOpacity: 0.1,
								shadowRadius: 2,
								elevation: 2,
							},
						]}
					>
						<Text
							style={[
								typography.uiLabel,
								{
									color: isSelected ? colors.foreground : colors.mutedForeground,
									fontWeight: isSelected ? "600" : "400",
								},
							]}
						>
							{option.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

const themeSelectorStyles = StyleSheet.create({
	container: {
		flexDirection: "row",
		borderRadius: 8,
		padding: 3,
	},
	option: {
		flex: 1,
		paddingVertical: 8,
		alignItems: "center",
		borderRadius: 6,
	},
});

function GeneralSettings() {
	const { colors } = useTheme();
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

	const serverHost = serverUrl ? new URL(serverUrl).host : "Not connected";

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
		<ScrollView style={styles.scrollView}>
			<SectionDivider title="Connection" />
			<SettingsItem
				icon={
					<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
						<Circle
							cx="12"
							cy="12"
							r="10"
							stroke={colors.primary}
							strokeWidth={2}
						/>
						<Path
							d="M12 6v6l4 2"
							stroke={colors.primary}
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
					<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
						<Path
							d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
							stroke={colors.primary}
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</Svg>
				}
				title="Project Directory"
				subtitle={
					directory ? directory.split("/").slice(-2).join("/") : "Not selected"
				}
				onPress={() => router.push("/onboarding/directory")}
			/>
			<SettingsItem
				icon={
					<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
						<Path
							d="M23 4v6h-6M1 20v-6h6"
							stroke={colors.primary}
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<Path
							d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
							stroke={colors.primary}
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

			<SectionDivider title="Appearance" />
			<View style={styles.appearanceSection}>
				<View style={styles.appearanceHeader}>
					<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
						<Circle
							cx="12"
							cy="12"
							r="5"
							stroke={colors.primary}
							strokeWidth={2}
						/>
						<Path
							d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
							stroke={colors.primary}
							strokeWidth={2}
							strokeLinecap="round"
						/>
					</Svg>
					<Text style={[typography.uiLabel, { color: colors.foreground }]}>
						Theme
					</Text>
				</View>
				<ThemeModeSelector />
			</View>

			<SectionDivider title="Preferences" />
			<SettingsItem
				icon={
					<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
						<Path
							d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"
							stroke={colors.primary}
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
						trackColor={{ false: colors.muted, true: colors.primary }}
						thumbColor={colors.background}
					/>
				}
			/>
			<SettingsItem
				icon={
					<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
						<Path
							d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
							stroke={colors.primary}
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
						trackColor={{ false: colors.muted, true: colors.primary }}
						thumbColor={colors.background}
					/>
				}
			/>
			<SettingsItem
				icon={
					<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
						<Rect
							x="3"
							y="3"
							width="18"
							height="18"
							rx="2"
							stroke={colors.primary}
							strokeWidth={2}
						/>
						<Path
							d="M9 3v18M15 3v18M3 9h18M3 15h18"
							stroke={colors.primary}
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
						trackColor={{ false: colors.muted, true: colors.primary }}
						thumbColor={colors.background}
					/>
				}
			/>

			<SectionDivider title="About" />
			<SettingsItem
				icon={
					<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
						<Circle
							cx="12"
							cy="12"
							r="10"
							stroke={colors.primary}
							strokeWidth={2}
						/>
						<Path
							d="M12 16v-4M12 8h.01"
							stroke={colors.primary}
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
					<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
						<Path
							d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
							stroke={colors.primary}
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

			<View style={styles.spacer} />

			<SettingsItem
				icon={
					<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
						<Path
							d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
							stroke={colors.destructive}
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

			<View style={{ height: 20 }} />
		</ScrollView>
	);
}

export default function SettingsScreen() {
	const { colors } = useTheme();
	const [activeTab, setActiveTab] = useState<SettingsTab>("general");
	const [selectedItem, setSelectedItem] = useState<string | null>(null);
	const [showDetail, setShowDetail] = useState(false);

	const agentsListRef = useRef<AgentsListRef>(null);
	const commandsListRef = useRef<CommandsListRef>(null);
	const gitIdentitiesListRef = useRef<GitIdentitiesListRef>(null);

	const tabs: TabConfig[] = [
		{
			id: "general",
			label: "General",
			icon: (
				<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
					<Path
						d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
						stroke={
							activeTab === "general"
								? colors.foreground
								: colors.mutedForeground
						}
						strokeWidth={2}
					/>
					<Path
						d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
						stroke={
							activeTab === "general"
								? colors.foreground
								: colors.mutedForeground
						}
						strokeWidth={2}
					/>
				</Svg>
			),
		},
		{
			id: "agents",
			label: "Agents",
			icon: (
				<RobotIcon
					size={18}
					color={
						activeTab === "agents" ? colors.foreground : colors.mutedForeground
					}
				/>
			),
		},
		{
			id: "commands",
			label: "Commands",
			icon: (
				<CommandIcon
					size={18}
					color={
						activeTab === "commands"
							? colors.foreground
							: colors.mutedForeground
					}
				/>
			),
		},
		{
			id: "providers",
			label: "Providers",
			icon: (
				<KeyIcon
					size={18}
					color={
						activeTab === "providers"
							? colors.foreground
							: colors.mutedForeground
					}
				/>
			),
		},
		{
			id: "git",
			label: "Git",
			icon: (
				<UsersIcon
					size={18}
					color={
						activeTab === "git" ? colors.foreground : colors.mutedForeground
					}
				/>
			),
		},
	];

	const handleTabChange = (tab: SettingsTab) => {
		setActiveTab(tab);
		setShowDetail(false);
		setSelectedItem(null);
	};

	const handleSelectItem = (itemId: string) => {
		setSelectedItem(itemId);
		setShowDetail(true);
	};

	const handleBack = useCallback(() => {
		setShowDetail(false);
		setSelectedItem(null);

		if (activeTab === "agents") {
			agentsListRef.current?.refresh();
		} else if (activeTab === "commands") {
			commandsListRef.current?.refresh();
		} else if (activeTab === "git") {
			gitIdentitiesListRef.current?.refresh();
		}
	}, [activeTab]);

	const renderContent = () => {
		if (activeTab === "general") {
			return <GeneralSettings />;
		}

		if (activeTab === "agents") {
			return (
				<AgentsList
					ref={agentsListRef}
					selectedAgent={selectedItem}
					onSelectAgent={handleSelectItem}
				/>
			);
		}

		if (activeTab === "commands") {
			return (
				<CommandsList
					ref={commandsListRef}
					selectedCommand={selectedItem}
					onSelectCommand={handleSelectItem}
				/>
			);
		}

		if (activeTab === "providers") {
			return (
				<ProvidersList
					selectedProvider={selectedItem}
					onSelectProvider={handleSelectItem}
				/>
			);
		}

		if (activeTab === "git") {
			return (
				<GitIdentitiesList
					ref={gitIdentitiesListRef}
					selectedProfile={selectedItem}
					onSelectProfile={handleSelectItem}
				/>
			);
		}

		return null;
	};

	const renderDetailView = () => {
		if (activeTab === "agents" && selectedItem) {
			return (
				<AgentDetailView
					agentName={selectedItem}
					onBack={handleBack}
					onDeleted={handleBack}
				/>
			);
		}

		if (activeTab === "commands" && selectedItem) {
			return (
				<CommandDetailView
					commandName={selectedItem}
					onBack={handleBack}
					onDeleted={handleBack}
				/>
			);
		}

		if (activeTab === "providers" && selectedItem) {
			return (
				<ProviderDetailView
					providerId={selectedItem}
					onBack={handleBack}
				/>
			);
		}

		if (activeTab === "git" && selectedItem) {
			return (
				<GitIdentityDetailView
					profileId={selectedItem}
					onBack={handleBack}
					onDeleted={handleBack}
				/>
			);
		}

		return (
			<View style={styles.detailContent}>
				<Text
					style={[
						typography.meta,
						{
							color: colors.mutedForeground,
							textAlign: "center",
							padding: 32,
						},
					]}
				>
					Select an item to view details.
				</Text>
			</View>
		);
	};

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: colors.background },
			]}
		>
			{showDetail && activeTab === "general" && (
				<View style={[styles.header, { borderBottomColor: colors.border }]}>
					<Pressable onPress={handleBack} style={styles.backButton}>
						<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
							<Path
								d="M15 18l-6-6 6-6"
								stroke={colors.foreground}
								strokeWidth={2}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</Svg>
					</Pressable>
					<Text style={[typography.uiLabel, { color: colors.foreground }]}>
						{selectedItem}
					</Text>
				</View>
			)}

			{!showDetail && (
				<View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.tabBarContent}
					>
						{tabs.map((tab) => (
							<Pressable
								key={tab.id}
								onPress={() => handleTabChange(tab.id)}
								style={[
									styles.tab,
									activeTab === tab.id && {
										borderBottomColor: colors.foreground,
									},
								]}
							>
								{tab.icon}
								<Text
									style={[
										typography.micro,
										{
											color:
												activeTab === tab.id
													? colors.foreground
													: colors.mutedForeground,
										},
									]}
								>
									{tab.label}
								</Text>
							</Pressable>
						))}
					</ScrollView>
				</View>
			)}

			<View style={styles.content}>
				{showDetail ? renderDetailView() : renderContent()}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		borderBottomWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 12,
		flexDirection: "row",
		alignItems: "center",
	},
	backButton: {
		padding: 4,
		marginRight: 12,
		marginLeft: -4,
	},
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	scrollView: {
		flex: 1,
	},
	settingsItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		paddingHorizontal: 16,
		paddingVertical: 16,
	},
	itemContent: {
		flex: 1,
	},
	sectionDivider: {
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	sectionTitle: {
		textTransform: "uppercase",
		fontWeight: "500",
	},
	appearanceSection: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		gap: 12,
	},
	appearanceHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
	},
	spacer: {
		height: 16,
	},
	tabBar: {
		borderBottomWidth: 1,
	},
	tabBarContent: {
		paddingHorizontal: 12,
	},
	tab: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 12,
		borderBottomWidth: 2,
		borderBottomColor: "transparent",
	},
	content: {
		flex: 1,
	},
	detailContent: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
});
