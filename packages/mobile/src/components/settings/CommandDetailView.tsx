import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	View,
} from "react-native";
import * as Haptics from "expo-haptics";
import {
	type Agent,
	agentsApi,
	type Command,
	type CommandConfig,
	commandsApi,
	isCommandBuiltIn,
} from "@/api";
import { ChevronLeft } from "@/components/icons";
import { Spacing, typography, useTheme } from "@/theme";

interface CommandDetailViewProps {
	commandName: string;
	onBack: () => void;
	onDeleted?: () => void;
}

export function CommandDetailView({
	commandName,
	onBack,
	onDeleted,
}: CommandDetailViewProps) {
	const { colors } = useTheme();
	const [command, setCommand] = useState<Command | null>(null);
	const [agents, setAgents] = useState<Agent[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [template, setTemplate] = useState("");
	const [agentName, setAgentName] = useState("");
	const [subtask, setSubtask] = useState(false);

	const isBuiltIn = command ? isCommandBuiltIn(command) : false;
	const isNewCommand = commandName === "__new__";

	const loadData = useCallback(async () => {
		setIsLoading(true);
		try {
			const [commandsList, agentsList] = await Promise.all([
				commandsApi.list(),
				agentsApi.list(),
			]);

			setAgents(agentsList.filter((a) => !a.hidden));

			if (!isNewCommand) {
				const foundCommand = commandsList.find((c) => c.name === commandName);
				if (foundCommand) {
					setCommand(foundCommand);
					setName(foundCommand.name);
					setDescription(foundCommand.description ?? "");
					setTemplate(foundCommand.template ?? "");
					setAgentName(foundCommand.agent ?? "");
					setSubtask(foundCommand.subtask ?? false);
				}
			}
		} catch (error) {
			console.error("Failed to load command:", error);
			Alert.alert("Error", "Failed to load command details");
		} finally {
			setIsLoading(false);
		}
	}, [commandName, isNewCommand]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const handleSave = async () => {
		if (!name.trim()) {
			Alert.alert("Error", "Command name is required");
			return;
		}

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setIsSaving(true);
		try {
			const config: CommandConfig = {
				name: name.trim(),
				description: description.trim() || undefined,
				template: template.trim() || undefined,
				agent: agentName || undefined,
				subtask: subtask || undefined,
			};

			let success: boolean;
			if (isNewCommand) {
				success = await commandsApi.create(config);
			} else {
				success = await commandsApi.update(commandName, config);
			}

			if (success) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				onBack();
			} else {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
				Alert.alert("Error", "Failed to save command");
			}
		} catch (error) {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to save command",
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
		Alert.alert(
			"Delete Command",
			`Are you sure you want to delete "/${commandName}"?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						setIsSaving(true);
						try {
							const success = await commandsApi.delete(commandName);
							if (success) {
								Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
								onDeleted?.();
								onBack();
							} else {
								Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
								Alert.alert("Error", "Failed to delete command");
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

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
					<ChevronLeft size={18} color={colors.foreground} />
					<Text style={[typography.uiLabel, { color: colors.foreground, fontWeight: "600" }]}>
						{isNewCommand ? "New Command" : `/${commandName}`}
					</Text>
				</Pressable>
				{!isBuiltIn && (
					<Pressable
						onPress={handleSave}
						disabled={isSaving}
						style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isSaving ? 0.6 : 1 }]}
					>
						{isSaving ? (
							<ActivityIndicator size="small" color={colors.primaryForeground} />
						) : (
							<Text style={[typography.meta, { color: colors.primaryForeground, fontWeight: "500" }]}>
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
					<Text style={[typography.meta, { color: colors.mutedForeground, marginBottom: Spacing.md }]}>
						Built-in command (read-only)
					</Text>
				)}

				{/* Name */}
				<View style={styles.field}>
					<Text style={[typography.uiLabel, { color: colors.foreground, fontWeight: "600" }]}>
						Name
					</Text>
					<TextInput
						style={[typography.uiLabel, styles.input, { color: colors.foreground, borderColor: colors.border }]}
						value={name}
						onChangeText={setName}
						placeholder="my-command"
						placeholderTextColor={colors.mutedForeground}
						editable={!isBuiltIn && isNewCommand}
					/>
				</View>

				{/* Description */}
				<View style={styles.field}>
					<Text style={[typography.uiLabel, { color: colors.foreground, fontWeight: "600" }]}>
						Description
					</Text>
					<TextInput
						style={[typography.uiLabel, styles.input, { color: colors.foreground, borderColor: colors.border }]}
						value={description}
						onChangeText={setDescription}
						placeholder="What this command does..."
						placeholderTextColor={colors.mutedForeground}
						editable={!isBuiltIn}
					/>
				</View>

				{/* Template */}
				<View style={[styles.section, { borderTopColor: colors.border + "66" }]}>
					<Text style={[typography.uiLabel, { color: colors.foreground, fontWeight: "600", marginBottom: 4 }]}>
						Template
					</Text>
					<Text style={[typography.micro, { color: colors.mutedForeground, marginBottom: 8 }]}>
						Use {"{{input}}"} for user input
					</Text>
					<TextInput
						style={[typography.meta, styles.textarea, { color: colors.foreground, borderColor: colors.border }]}
						value={template}
						onChangeText={setTemplate}
						placeholder="Do something with {{input}}..."
						placeholderTextColor={colors.mutedForeground}
						editable={!isBuiltIn}
						multiline
						textAlignVertical="top"
					/>
				</View>

				{/* Agent */}
				<View style={[styles.section, { borderTopColor: colors.border + "66" }]}>
					<Text style={[typography.uiLabel, { color: colors.foreground, fontWeight: "600", marginBottom: 8 }]}>
						Agent
					</Text>
					<View style={[styles.selectList, { borderColor: colors.border + "66" }]}>
						<Pressable
							onPress={() => !isBuiltIn && setAgentName("")}
							style={[
								styles.selectItem,
								!agentName && { backgroundColor: colors.primary + "15" },
							]}
						>
							<Text
								style={[
									typography.meta,
									{ color: !agentName ? colors.primary : colors.mutedForeground },
								]}
							>
								None
							</Text>
						</Pressable>
						{agents.map((agent, index) => (
							<Pressable
								key={agent.name}
								onPress={() => !isBuiltIn && setAgentName(agent.name)}
								style={[
									styles.selectItem,
									{ borderTopWidth: 1, borderTopColor: colors.border + "66" },
									agentName === agent.name && { backgroundColor: colors.primary + "15" },
								]}
							>
								<Text
									style={[
										typography.meta,
										{
											color: agentName === agent.name ? colors.primary : colors.foreground,
											fontWeight: agentName === agent.name ? "600" : "400",
										},
									]}
								>
									{agent.name}
								</Text>
							</Pressable>
						))}
					</View>
				</View>

				{/* Subtask toggle */}
				<View style={[styles.section, { borderTopColor: colors.border + "66" }]}>
					<View style={styles.switchRow}>
						<View style={{ flex: 1 }}>
							<Text style={[typography.uiLabel, { color: colors.foreground, fontWeight: "600" }]}>
								Run as subtask
							</Text>
							<Text style={[typography.micro, { color: colors.mutedForeground }]}>
								Execute in a separate context
							</Text>
						</View>
						<Switch
							value={subtask}
							onValueChange={setSubtask}
							disabled={isBuiltIn}
							trackColor={{ false: colors.muted, true: colors.primary }}
							thumbColor={colors.background}
						/>
					</View>
				</View>

				{/* Delete */}
				{!isBuiltIn && !isNewCommand && (
					<View style={[styles.section, { borderTopColor: colors.border + "66" }]}>
						<Pressable onPress={handleDelete}>
							<Text style={[typography.meta, { color: colors.destructive }]}>
								Delete command
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
		paddingHorizontal: Spacing.md,
		paddingVertical: Spacing.sm,
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
		paddingHorizontal: Spacing.md,
		paddingBottom: Spacing.xl,
		gap: Spacing.md,
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
		minHeight: 100,
	},
	section: {
		paddingTop: Spacing.md,
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
	switchRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
});
