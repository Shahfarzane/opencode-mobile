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
import { type Agent, agentsApi, isAgentBuiltIn, isAgentHidden } from "@/api";
import { PlusIcon, RobotIcon } from "@/components/icons";
import { typography, useTheme } from "@/theme";
import { SettingsListItem } from "./SettingsListItem";

export interface AgentsListRef {
	refresh: () => Promise<void>;
}

interface AgentsListProps {
	selectedAgent?: string | null;
	onSelectAgent: (agentName: string) => void;
}

export const AgentsList = forwardRef<AgentsListRef, AgentsListProps>(
	function AgentsList({ selectedAgent, onSelectAgent }, ref) {
	const { colors } = useTheme();
	const [agents, setAgents] = useState<Agent[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const loadAgents = useCallback(async () => {
		setIsLoading(true);
		try {
			const data = await agentsApi.list();
			setAgents(data.filter((a) => !isAgentHidden(a)));
		} catch (error) {
			console.error("Failed to load agents:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useImperativeHandle(ref, () => ({
		refresh: loadAgents,
	}), [loadAgents]);

	useEffect(() => {
		loadAgents();
	}, [loadAgents]);

	const builtInAgents = agents.filter(isAgentBuiltIn);
	const customAgents = agents.filter((a) => !isAgentBuiltIn(a));

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
					Total {agents.length}
				</Text>
				<Pressable
					onPress={() => onSelectAgent("__new__")}
					style={[styles.addButton, { backgroundColor: colors.primary }]}
				>
					<PlusIcon size={14} color={colors.background} />
					<Text style={[typography.micro, { color: colors.background, fontWeight: "600" }]}>
						Add
					</Text>
				</Pressable>
			</View>

			{builtInAgents.length > 0 && (
				<View style={styles.section}>
					<Text
						style={[
							typography.micro,
							styles.sectionTitle,
							{ color: colors.mutedForeground },
						]}
					>
						BUILT-IN AGENTS
					</Text>
					{builtInAgents.map((agent) => (
						<SettingsListItem
							key={agent.name}
							title={agent.name}
							subtitle={agent.description}
							badge={agent.mode}
							isSelected={selectedAgent === agent.name}
							onPress={() => onSelectAgent(agent.name)}
							icon={<RobotIcon color={colors.primary} size={18} />}
						/>
					))}
				</View>
			)}

			{customAgents.length > 0 && (
				<View style={styles.section}>
					<Text
						style={[
							typography.micro,
							styles.sectionTitle,
							{ color: colors.mutedForeground },
						]}
					>
						CUSTOM AGENTS
					</Text>
					{customAgents.map((agent) => (
						<SettingsListItem
							key={agent.name}
							title={agent.name}
							subtitle={agent.description}
							badge={agent.mode}
							isSelected={selectedAgent === agent.name}
							onPress={() => onSelectAgent(agent.name)}
							icon={<RobotIcon color={colors.primary} size={18} />}
						/>
					))}
				</View>
			)}

			{agents.length === 0 && (
				<View style={styles.emptyContainer}>
					<RobotIcon color={colors.mutedForeground} size={40} />
					<Text style={[typography.uiLabel, { color: colors.mutedForeground }]}>
						No agents configured
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
