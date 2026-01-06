import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import {
	type Agent,
	type AgentConfig,
	agentsApi,
	isAgentBuiltIn,
	type Provider,
	providersApi,
} from "@/api";
import { typography, useTheme } from "@/theme";
import { SettingsSection } from "./SettingsSection";
import {
	SettingsSelect,
	type SelectOption,
	SettingsTextArea,
	SettingsTextField,
} from "./shared";

interface AgentDetailViewProps {
	agentName: string;
	onBack: () => void;
	onDeleted?: () => void;
}

const MODE_OPTIONS: SelectOption[] = [
	{ value: "primary", label: "Primary", description: "Main agent for user tasks" },
	{ value: "subagent", label: "Subagent", description: "Called by other agents" },
	{ value: "all", label: "All", description: "Both primary and subagent" },
];

export function AgentDetailView({
	agentName,
	onBack,
	onDeleted,
}: AgentDetailViewProps) {
	const { colors } = useTheme();
	const [agent, setAgent] = useState<Agent | null>(null);
	const [providers, setProviders] = useState<Provider[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [prompt, setPrompt] = useState("");
	const [mode, setMode] = useState<string>("primary");
	const [providerId, setProviderId] = useState<string>("");
	const [modelId, setModelId] = useState<string>("");
	const [temperature, setTemperature] = useState("");
	const [topP, setTopP] = useState("");

	const isBuiltIn = agent ? isAgentBuiltIn(agent) : false;
	const isNewAgent = agentName === "__new__";

	const loadData = useCallback(async () => {
		setIsLoading(true);
		try {
			const [agentsList, providersList] = await Promise.all([
				agentsApi.list(),
				providersApi.list(),
			]);

			setProviders(providersList);

			if (!isNewAgent) {
				const foundAgent = agentsList.find((a) => a.name === agentName);
				if (foundAgent) {
					setAgent(foundAgent);
					setName(foundAgent.name);
					setDescription(foundAgent.description ?? "");
					setPrompt(foundAgent.prompt ?? "");
					setMode(foundAgent.mode ?? "primary");
					setProviderId(foundAgent.model?.providerID ?? "");
					setModelId(foundAgent.model?.modelID ?? "");
					setTemperature(foundAgent.temperature?.toString() ?? "");
					setTopP(foundAgent.topP?.toString() ?? "");
				}
			}
		} catch (error) {
			console.error("Failed to load agent:", error);
			Alert.alert("Error", "Failed to load agent details");
		} finally {
			setIsLoading(false);
		}
	}, [agentName, isNewAgent]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const providerOptions: SelectOption[] = providers.map((p) => ({
		value: p.id,
		label: p.name,
	}));

	const modelOptions: SelectOption[] = providerId
		? (providers.find((p) => p.id === providerId)?.models ?? []).map((m) => ({
				value: m.id,
				label: m.name || m.id,
			}))
		: [];

	const handleSave = async () => {
		if (!name.trim()) {
			Alert.alert("Error", "Agent name is required");
			return;
		}

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setIsSaving(true);
		try {
			const config: AgentConfig = {
				name: name.trim(),
				description: description.trim() || undefined,
				prompt: prompt.trim() || undefined,
				mode: mode as AgentConfig["mode"],
				model: providerId && modelId ? `${providerId}/${modelId}` : undefined,
				temperature: temperature ? Number.parseFloat(temperature) : undefined,
				top_p: topP ? Number.parseFloat(topP) : undefined,
			};

			let success: boolean;
			if (isNewAgent) {
				success = await agentsApi.create(config);
			} else {
				success = await agentsApi.update(agentName, config);
			}

			if (success) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				Alert.alert("Success", isNewAgent ? "Agent created" : "Agent updated");
				onBack();
			} else {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
				Alert.alert("Error", "Failed to save agent");
			}
		} catch (error) {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to save agent",
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
		Alert.alert(
			"Delete Agent",
			`Are you sure you want to delete "${agentName}"?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						setIsSaving(true);
						try {
							const success = await agentsApi.delete(agentName);
							if (success) {
								Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
								onDeleted?.();
								onBack();
							} else {
								Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
								Alert.alert("Error", "Failed to delete agent");
							}
						} catch (error) {
							Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
							Alert.alert(
								"Error",
								error instanceof Error ? error.message : "Failed to delete",
							);
						} finally {
							setIsSaving(false);
						}
					},
				},
			],
		);
	};

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={[styles.header, { borderBottomColor: colors.border }]}>
				<Pressable onPress={onBack} style={styles.backButton}>
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
				<Text style={[typography.uiLabel, styles.headerTitle, { color: colors.foreground }]}>
					{isNewAgent ? "New Agent" : agentName}
				</Text>
				{!isBuiltIn && (
					<Pressable
						onPress={handleSave}
						disabled={isSaving}
						style={[styles.saveButton, { backgroundColor: colors.primary }]}
					>
						{isSaving ? (
							<ActivityIndicator size="small" color={colors.background} />
						) : (
							<Text style={[typography.uiLabel, { color: colors.background }]}>
								Save
							</Text>
						)}
					</Pressable>
				)}
			</View>

			<ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
				{isBuiltIn && (
					<View style={[styles.builtInBanner, { backgroundColor: colors.muted }]}>
						<Text style={[typography.meta, { color: colors.mutedForeground }]}>
							This is a built-in agent and cannot be edited.
						</Text>
					</View>
				)}

				<SettingsSection title="Basic Information" showDivider={false}>
					<View style={styles.formGroup}>
						<SettingsTextField
							label="Name"
							value={name}
							onChangeText={setName}
							placeholder="my-agent"
							editable={!isBuiltIn && isNewAgent}
							required
						/>
					</View>
					<View style={styles.formGroup}>
						<SettingsTextArea
							label="Description"
							value={description}
							onChangeText={setDescription}
							placeholder="Describe what this agent does..."
							editable={!isBuiltIn}
							rows={2}
						/>
					</View>
					<View style={styles.formGroup}>
						<SettingsSelect
							label="Mode"
							options={MODE_OPTIONS}
							value={mode}
							onChange={setMode}
						/>
					</View>
				</SettingsSection>

				<SettingsSection title="Model Configuration">
					<View style={styles.formGroup}>
						<SettingsSelect
							label="Provider"
							options={providerOptions}
							value={providerId}
							onChange={(value) => {
								setProviderId(value);
								setModelId("");
							}}
							placeholder="Select provider..."
						/>
					</View>
					{providerId && (
						<View style={styles.formGroup}>
							<SettingsSelect
								label="Model"
								options={modelOptions}
								value={modelId}
								onChange={setModelId}
								placeholder="Select model..."
							/>
						</View>
					)}
					<View style={styles.formRow}>
						<View style={styles.formHalf}>
							<SettingsTextField
								label="Temperature"
								value={temperature}
								onChangeText={setTemperature}
								placeholder="0.7"
								keyboardType="decimal-pad"
								editable={!isBuiltIn}
							/>
						</View>
						<View style={styles.formHalf}>
							<SettingsTextField
								label="Top P"
								value={topP}
								onChangeText={setTopP}
								placeholder="1.0"
								keyboardType="decimal-pad"
								editable={!isBuiltIn}
							/>
						</View>
					</View>
				</SettingsSection>

				<SettingsSection title="System Prompt">
					<View style={styles.formGroup}>
						<SettingsTextArea
							label="Prompt"
							value={prompt}
							onChangeText={setPrompt}
							placeholder="Enter the system prompt for this agent..."
							editable={!isBuiltIn}
							rows={6}
						/>
					</View>
				</SettingsSection>

				{!isBuiltIn && !isNewAgent && (
					<SettingsSection title="Danger Zone">
						<Pressable
							onPress={handleDelete}
							style={[styles.deleteButton, { borderColor: colors.destructive }]}
						>
							<Text style={[typography.uiLabel, { color: colors.destructive }]}>
								Delete Agent
							</Text>
						</Pressable>
					</SettingsSection>
				)}

				<View style={styles.bottomSpacer} />
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		borderBottomWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	backButton: {
		padding: 4,
		marginRight: 12,
		marginLeft: -4,
	},
	headerTitle: {
		flex: 1,
		fontWeight: "600",
	},
	saveButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 6,
		minWidth: 60,
		alignItems: "center",
	},
	scrollView: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
	builtInBanner: {
		padding: 12,
		borderRadius: 8,
		marginBottom: 16,
	},
	formGroup: {
		marginBottom: 16,
	},
	formRow: {
		flexDirection: "row",
		gap: 12,
	},
	formHalf: {
		flex: 1,
	},
	deleteButton: {
		borderWidth: 1,
		borderRadius: 8,
		paddingVertical: 12,
		alignItems: "center",
	},
	bottomSpacer: {
		height: 40,
	},
});
