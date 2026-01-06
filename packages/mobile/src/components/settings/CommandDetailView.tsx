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
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import {
	type Agent,
	agentsApi,
	type Command,
	type CommandConfig,
	commandsApi,
	isCommandBuiltIn,
} from "@/api";
import { typography, useTheme } from "@/theme";
import { SettingsSection } from "./SettingsSection";
import {
	SettingsSelect,
	type SelectOption,
	SettingsSwitch,
	SettingsTextArea,
	SettingsTextField,
} from "./shared";

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

	const agentOptions: SelectOption[] = [
		{ value: "", label: "None", description: "No specific agent" },
		...agents.map((a) => ({
			value: a.name,
			label: a.name,
			description: a.description,
		})),
	];

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
				Alert.alert("Success", isNewCommand ? "Command created" : "Command updated");
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
					{isNewCommand ? "New Command" : `/${commandName}`}
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
							This is a built-in command and cannot be edited.
						</Text>
					</View>
				)}

				<SettingsSection title="Basic Information" showDivider={false}>
					<View style={styles.formGroup}>
						<SettingsTextField
							label="Name"
							value={name}
							onChangeText={setName}
							placeholder="my-command"
							editable={!isBuiltIn && isNewCommand}
							required
						/>
					</View>
					<View style={styles.formGroup}>
						<SettingsTextArea
							label="Description"
							value={description}
							onChangeText={setDescription}
							placeholder="Describe what this command does..."
							editable={!isBuiltIn}
							rows={2}
						/>
					</View>
				</SettingsSection>

				<SettingsSection title="Configuration">
					<View style={styles.formGroup}>
						<SettingsTextArea
							label="Template"
							description="The prompt template. Use {{input}} for user input."
							value={template}
							onChangeText={setTemplate}
							placeholder="Do something with {{input}}..."
							editable={!isBuiltIn}
							rows={4}
						/>
					</View>
					<View style={styles.formGroup}>
						<SettingsSelect
							label="Agent"
							description="Which agent should execute this command"
							options={agentOptions}
							value={agentName}
							onChange={setAgentName}
							placeholder="Select agent..."
						/>
					</View>
					<View style={styles.formGroup}>
						<SettingsSwitch
							label="Run as Subtask"
							description="Execute in a separate context"
							value={subtask}
							onChange={setSubtask}
							disabled={isBuiltIn}
						/>
					</View>
				</SettingsSection>

				{!isBuiltIn && !isNewCommand && (
					<SettingsSection title="Danger Zone">
						<Pressable
							onPress={handleDelete}
							style={[styles.deleteButton, { borderColor: colors.destructive }]}
						>
							<Text style={[typography.uiLabel, { color: colors.destructive }]}>
								Delete Command
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
