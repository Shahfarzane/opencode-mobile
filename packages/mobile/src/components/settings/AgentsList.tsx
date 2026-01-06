import * as Haptics from "expo-haptics";
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
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { type Agent, agentsApi, isAgentBuiltIn, isAgentHidden } from "@/api";
import { PlusIcon, RobotIcon } from "@/components/icons";
import { Fonts, fontStyle, typography, useTheme } from "@/theme";
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
		const [isRefreshing, setIsRefreshing] = useState(false);

		const loadAgents = useCallback(async (showRefresh = false) => {
			if (showRefresh) {
				setIsRefreshing(true);
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			} else {
				setIsLoading(true);
			}
			try {
				const data = await agentsApi.list();
				setAgents(data.filter((a) => !isAgentHidden(a)));
			} catch (error) {
				console.error("Failed to load agents:", error);
			} finally {
				setIsLoading(false);
				setIsRefreshing(false);
			}
		}, []);

		useImperativeHandle(ref, () => ({
			refresh: () => loadAgents(false),
		}), [loadAgents]);

		useEffect(() => {
			loadAgents(false);
		}, [loadAgents]);

		const handleRefresh = useCallback(() => {
			loadAgents(true);
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
		<ScrollView
			style={styles.container}
			refreshControl={
				<RefreshControl
					refreshing={isRefreshing}
					onRefresh={handleRefresh}
					tintColor={colors.primary}
				/>
			}
		>
			<View style={[styles.header, { borderBottomColor: colors.border }]}>
				<Text style={[typography.meta, { color: colors.mutedForeground }]}>
					Total {agents.length}
				</Text>
				<Pressable
					onPress={() => onSelectAgent("__new__")}
					style={[styles.addButton, { backgroundColor: colors.primary }]}
				>
					<PlusIcon size={14} color={colors.background} />
					<Text style={[typography.micro, fontStyle("600"), { color: colors.background }]}>
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
						No custom agents yet
					</Text>
					<Pressable
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							onSelectAgent("__new__");
						}}
						style={[styles.createButton, { backgroundColor: colors.primary }]}
					>
						<PlusIcon size={16} color={colors.background} />
						<Text style={[typography.uiLabel, { color: colors.background }]}>
							Create your first agent
						</Text>
					</Pressable>
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
		fontFamily: Fonts.semiBold,
		letterSpacing: 0.5,
	},
	emptyContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 48,
		gap: 12,
	},
	createButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 8,
		marginTop: 8,
	},
});
