import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useState,
} from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { type Command, commandsApi, isCommandBuiltIn } from "@/api";
import { CommandIcon, PlusIcon } from "@/components/icons";
import { typography, useTheme } from "@/theme";
import { SettingsListItem } from "./SettingsListItem";

export interface CommandsListRef {
	refresh: () => Promise<void>;
}

interface CommandsListProps {
	selectedCommand?: string | null;
	onSelectCommand: (commandName: string) => void;
}

export const CommandsList = forwardRef<CommandsListRef, CommandsListProps>(
	function CommandsList({ selectedCommand, onSelectCommand }, ref) {
		const { colors } = useTheme();
		const [commands, setCommands] = useState<Command[]>([]);
		const [isLoading, setIsLoading] = useState(true);

		const loadCommands = useCallback(async () => {
			setIsLoading(true);
			try {
				const data = await commandsApi.list();
				setCommands(data.filter((c) => !c.hidden));
			} catch (error) {
				console.error("Failed to load commands:", error);
			} finally {
				setIsLoading(false);
			}
		}, []);

		useImperativeHandle(ref, () => ({
			refresh: loadCommands,
		}), [loadCommands]);

		useEffect(() => {
			loadCommands();
		}, [loadCommands]);

	const builtInCommands = commands.filter(isCommandBuiltIn);
	const customCommands = commands.filter((c) => !isCommandBuiltIn(c));

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
		<ScrollView style={styles.container}>
			<View style={[styles.header, { borderBottomColor: colors.border }]}>
				<Text style={[typography.meta, { color: colors.mutedForeground }]}>
					Total {commands.length}
				</Text>
				<Pressable
					onPress={() => onSelectCommand("__new__")}
					style={[styles.addButton, { backgroundColor: colors.primary }]}
				>
					<PlusIcon size={14} color={colors.background} />
					<Text style={[typography.micro, { color: colors.background, fontWeight: "600" }]}>
						Add
					</Text>
				</Pressable>
			</View>

			{builtInCommands.length > 0 && (
				<View style={styles.section}>
					<Text
						style={[
							typography.micro,
							styles.sectionTitle,
							{ color: colors.mutedForeground },
						]}
					>
						BUILT-IN COMMANDS
					</Text>
					{builtInCommands.map((command) => (
						<SettingsListItem
							key={command.name}
							title={`/${command.name}`}
							subtitle={command.description}
							isSelected={selectedCommand === command.name}
							onPress={() => onSelectCommand(command.name)}
							icon={<CommandIcon color={colors.primary} size={18} />}
						/>
					))}
				</View>
			)}

			{customCommands.length > 0 && (
				<View style={styles.section}>
					<Text
						style={[
							typography.micro,
							styles.sectionTitle,
							{ color: colors.mutedForeground },
						]}
					>
						CUSTOM COMMANDS
					</Text>
					{customCommands.map((command) => (
						<SettingsListItem
							key={command.name}
							title={`/${command.name}`}
							subtitle={command.description}
							isSelected={selectedCommand === command.name}
							onPress={() => onSelectCommand(command.name)}
							icon={<CommandIcon color={colors.primary} size={18} />}
						/>
					))}
				</View>
			)}

			{commands.length === 0 && (
				<View style={styles.emptyContainer}>
					<CommandIcon color={colors.mutedForeground} size={40} />
					<Text style={[typography.uiLabel, { color: colors.mutedForeground }]}>
						No commands configured
					</Text>
				</View>
			)}
		</ScrollView>
		);
	},
);

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
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	addButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 6,
	},
	section: {
		paddingTop: 12,
	},
	sectionTitle: {
		paddingHorizontal: 16,
		paddingBottom: 8,
		fontWeight: "600",
		letterSpacing: 0.5,
	},
	emptyContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 48,
		gap: 12,
	},
});
