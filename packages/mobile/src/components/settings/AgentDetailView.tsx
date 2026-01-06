import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import {
	type Agent,
	type AgentConfig,
	agentsApi,
	isAgentBuiltIn,
	type Provider,
	providersApi,
} from "@/api";
import { ChevronLeft } from "@/components/icons";
import { Fonts, fontStyle, Spacing, typography, useTheme } from "@/theme";

interface AgentDetailViewProps {
	agentName: string;
	onBack: () => void;
	onDeleted?: () => void;
}

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
	const [providerId, setProviderId] = useState<string>("");
	const [modelId, setModelId] = useState<string>("");

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
					setProviderId(foundAgent.model?.providerID ?? "");
					setModelId(foundAgent.model?.modelID ?? "");
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
				model: providerId && modelId ? `${providerId}/${modelId}` : undefined,
			};

			let success: boolean;
			if (isNewAgent) {
				success = await agentsApi.create(config);
			} else {
				success = await agentsApi.update(agentName, config);
			}

			if (success) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
								Haptics.notificationAsync(
									Haptics.NotificationFeedbackType.Success,
								);
								onDeleted?.();
								onBack();
							} else {
								Haptics.notificationAsync(
									Haptics.NotificationFeedbackType.Error,
								);
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
			<View style={styles.centered}>
				<ActivityIndicator size="small" color={colors.primary} />
			</View>
		);
	}

	const selectedProvider = providers.find((p) => p.id === providerId);

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
					<ChevronLeft size={18} color={colors.foreground} />
					<Text
						style={[
							typography.uiLabel,
							fontStyle("600"),
							{ color: colors.foreground },
						]}
					>
						{isNewAgent ? "New Agent" : agentName}
					</Text>
				</Pressable>
				{!isBuiltIn && (
					<Pressable
						onPress={handleSave}
						disabled={isSaving}
						style={[
							styles.saveBtn,
							{ backgroundColor: colors.primary, opacity: isSaving ? 0.6 : 1 },
						]}
					>
						{isSaving ? (
							<ActivityIndicator
								size="small"
								color={colors.primaryForeground}
							/>
						) : (
							<Text
								style={[
									typography.meta,
									fontStyle("500"),
									{ color: colors.primaryForeground },
								]}
							>
								Save
							</Text>
						)}
					</Pressable>
				)}
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				{isBuiltIn && (
					<Text
						style={[
							typography.meta,
							{ color: colors.mutedForeground, marginBottom: Spacing[4] },
						]}
					>
						Built-in agent (read-only)
					</Text>
				)}

				{/* Name */}
				<View style={styles.field}>
					<Text
						style={[
							typography.uiLabel,
							fontStyle("600"),
							{ color: colors.foreground },
						]}
					>
						Name
					</Text>
					<TextInput
						style={[
							typography.uiLabel,
							styles.input,
							{ color: colors.foreground, borderColor: colors.border },
						]}
						value={name}
						onChangeText={setName}
						placeholder="my-agent"
						placeholderTextColor={colors.mutedForeground}
						editable={!isBuiltIn && isNewAgent}
					/>
				</View>

				{/* Description */}
				<View style={styles.field}>
					<Text
						style={[
							typography.uiLabel,
							fontStyle("600"),
							{ color: colors.foreground },
						]}
					>
						Description
					</Text>
					<TextInput
						style={[
							typography.uiLabel,
							styles.input,
							{ color: colors.foreground, borderColor: colors.border },
						]}
						value={description}
						onChangeText={setDescription}
						placeholder="What this agent does..."
						placeholderTextColor={colors.mutedForeground}
						editable={!isBuiltIn}
					/>
				</View>

				{/* Model */}
				<View
					style={[styles.section, { borderTopColor: colors.border + "66" }]}
				>
					<Text
						style={[
							typography.uiLabel,
							fontStyle("600"),
							{ color: colors.foreground, marginBottom: 8 },
						]}
					>
						Model
					</Text>
					<Text
						style={[
							typography.meta,
							{ color: colors.mutedForeground, marginBottom: 12 },
						]}
					>
						Select the provider and model for this agent.
					</Text>

					{/* Provider selector */}
					<View
						style={[styles.selectList, { borderColor: colors.border + "66" }]}
					>
						{providers.map((provider, index) => (
							<Pressable
								key={provider.id}
								onPress={() => {
									if (!isBuiltIn) {
										setProviderId(provider.id);
										setModelId("");
									}
								}}
								style={[
									styles.selectItem,
									index > 0 && {
										borderTopWidth: 1,
										borderTopColor: colors.border + "66",
									},
									providerId === provider.id && {
										backgroundColor: colors.primary + "15",
									},
								]}
							>
								<Text
									style={[
										typography.meta,
										{
											color:
												providerId === provider.id
													? colors.primary
													: colors.foreground,
										},
										fontStyle(providerId === provider.id ? "600" : "400"),
									]}
								>
									{provider.name}
								</Text>
							</Pressable>
						))}
					</View>

					{/* Model selector */}
					{selectedProvider &&
						selectedProvider.models &&
						selectedProvider.models.length > 0 && (
							<View style={{ marginTop: 12 }}>
								<Text
									style={[
										typography.meta,
										{ color: colors.mutedForeground, marginBottom: 8 },
									]}
								>
									Model
								</Text>
								<View
									style={[
										styles.selectList,
										{ borderColor: colors.border + "66" },
									]}
								>
									{selectedProvider.models.slice(0, 10).map((model, index) => (
										<Pressable
											key={model.id}
											onPress={() => !isBuiltIn && setModelId(model.id)}
											style={[
												styles.selectItem,
												index > 0 && {
													borderTopWidth: 1,
													borderTopColor: colors.border + "66",
												},
												modelId === model.id && {
													backgroundColor: colors.primary + "15",
												},
											]}
										>
											<Text
												style={[
													typography.meta,
													{
														color:
															modelId === model.id
																? colors.primary
																: colors.foreground,
													},
													fontStyle(modelId === model.id ? "600" : "400"),
												]}
												numberOfLines={1}
											>
												{model.name || model.id}
											</Text>
										</Pressable>
									))}
								</View>
							</View>
						)}
				</View>

				{/* System Prompt */}
				<View
					style={[styles.section, { borderTopColor: colors.border + "66" }]}
				>
					<Text
						style={[
							typography.uiLabel,
							fontStyle("600"),
							{ color: colors.foreground, marginBottom: 8 },
						]}
					>
						System prompt
					</Text>
					<TextInput
						style={[
							typography.meta,
							styles.textarea,
							{ color: colors.foreground, borderColor: colors.border },
						]}
						value={prompt}
						onChangeText={setPrompt}
						placeholder="Enter the system prompt..."
						placeholderTextColor={colors.mutedForeground}
						editable={!isBuiltIn}
						multiline
						textAlignVertical="top"
					/>
				</View>

				{/* Delete */}
				{!isBuiltIn && !isNewAgent && (
					<View
						style={[styles.section, { borderTopColor: colors.border + "66" }]}
					>
						<Pressable onPress={handleDelete}>
							<Text style={[typography.meta, { color: colors.destructive }]}>
								Delete agent
							</Text>
						</Pressable>
					</View>
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: Spacing[4],
		paddingVertical: Spacing[2],
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	saveBtn: {
		paddingHorizontal: 14,
		paddingVertical: 6,
		borderRadius: 6,
		minWidth: 50,
		alignItems: "center",
	},
	scroll: {
		flex: 1,
	},
	content: {
		paddingHorizontal: Spacing[4],
		paddingBottom: Spacing[8],
		gap: Spacing[4],
	},
	field: {
		gap: 6,
	},
	input: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderWidth: 1,
		borderRadius: 6,
	},
	textarea: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderWidth: 1,
		borderRadius: 6,
		minHeight: 120,
	},
	section: {
		paddingTop: Spacing[4],
		borderTopWidth: 1,
	},
	selectList: {
		borderWidth: 1,
		borderRadius: 6,
		overflow: "hidden",
	},
	selectItem: {
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
});
