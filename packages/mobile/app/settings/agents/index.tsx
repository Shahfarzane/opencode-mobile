import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type Agent, agentsApi, isAgentBuiltIn, isAgentHidden } from "@/api";
import { ChevronLeft, PlusIcon, RobotIcon } from "@/components/icons";
import { SettingsListItem } from "@/components/settings";
import { Fonts, Spacing, typography, useTheme } from "@/theme";

export default function AgentsListScreen() {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
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

	useEffect(() => {
		loadAgents(false);
	}, [loadAgents]);

	const handleRefresh = useCallback(() => {
		loadAgents(true);
	}, [loadAgents]);

	const handleSelectAgent = (agentName: string) => {
		router.push(`/settings/agents/${encodeURIComponent(agentName)}`);
	};

	const builtInAgents = agents.filter(isAgentBuiltIn);
	const customAgents = agents.filter((a) => !isAgentBuiltIn(a));

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* Header */}
			<View
				style={[
					styles.header,
					{
						paddingTop: insets.top + Spacing[2],
						borderBottomColor: colors.border,
					},
				]}
			>
				<Pressable
					onPress={() => router.back()}
					style={styles.headerButton}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<ChevronLeft size={24} color={colors.foreground} />
				</Pressable>
				<Text style={[styles.title, { color: colors.foreground }]}>Agents</Text>
				<Pressable
					onPress={() => handleSelectAgent("__new__")}
					style={[styles.addButton, { backgroundColor: colors.primary }]}
				>
					<PlusIcon size={14} color={colors.background} />
				</Pressable>
			</View>

			{isLoading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={colors.primary} />
				</View>
			) : (
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={[
						styles.scrollContent,
						{ paddingBottom: insets.bottom + Spacing[4] },
					]}
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing}
							onRefresh={handleRefresh}
							tintColor={colors.primary}
						/>
					}
				>
					{builtInAgents.length > 0 && (
						<View style={styles.section}>
							<Text
								style={[styles.sectionTitle, { color: colors.mutedForeground }]}
							>
								BUILT-IN AGENTS
							</Text>
							{builtInAgents.map((agent) => (
								<SettingsListItem
									key={agent.name}
									title={agent.name}
									subtitle={agent.description}
									badge={agent.mode}
									onPress={() => handleSelectAgent(agent.name)}
									icon={<RobotIcon color={colors.primary} size={18} />}
								/>
							))}
						</View>
					)}

					{customAgents.length > 0 && (
						<View style={styles.section}>
							<Text
								style={[styles.sectionTitle, { color: colors.mutedForeground }]}
							>
								CUSTOM AGENTS
							</Text>
							{customAgents.map((agent) => (
								<SettingsListItem
									key={agent.name}
									title={agent.name}
									subtitle={agent.description}
									badge={agent.mode}
									onPress={() => handleSelectAgent(agent.name)}
									icon={<RobotIcon color={colors.primary} size={18} />}
								/>
							))}
						</View>
					)}

					{agents.length === 0 && (
						<View style={styles.emptyContainer}>
							<RobotIcon color={colors.mutedForeground} size={40} />
							<Text
								style={[typography.uiLabel, { color: colors.mutedForeground }]}
							>
								No custom agents yet
							</Text>
							<Pressable
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									handleSelectAgent("__new__");
								}}
								style={[
									styles.createButton,
									{ backgroundColor: colors.primary },
								]}
							>
								<PlusIcon size={16} color={colors.background} />
								<Text
									style={[typography.uiLabel, { color: colors.background }]}
								>
									Create your first agent
								</Text>
							</Pressable>
						</View>
					)}
				</ScrollView>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: Spacing[4],
		paddingBottom: Spacing[3],
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	headerButton: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		fontSize: 17,
		fontFamily: Fonts.semiBold,
		textAlign: "center",
	},
	addButton: {
		width: 32,
		height: 32,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingTop: Spacing[4],
	},
	section: {
		marginBottom: Spacing[4],
	},
	sectionTitle: {
		fontSize: 12,
		fontFamily: Fonts.semiBold,
		letterSpacing: 0.5,
		paddingHorizontal: Spacing[4],
		marginBottom: Spacing[2],
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
