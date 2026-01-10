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
import {
	AiAgentFillIcon,
	AiAgentIcon,
	ChevronLeft,
	PlusIcon,
	RobotIcon,
} from "@/components/icons";
import { SettingsListItem } from "@/components/settings";
import { IconButton } from "@/components/ui";
import { Fonts, FontSizes, Spacing, useTheme } from "@/theme";

/**
 * Returns the appropriate mode icon for an agent based on its mode
 * Matches desktop AgentsSidebar.tsx:getAgentModeIcon
 */
function getAgentModeIcon(mode: string | undefined, primaryColor: string) {
	switch (mode) {
		case "primary":
			return <AiAgentIcon size={12} color={primaryColor} />;
		case "all":
			return <AiAgentFillIcon size={12} color={primaryColor} />;
		case "subagent":
			return <RobotIcon size={12} color={primaryColor} />;
		default:
			return null;
	}
}

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
				<IconButton
					icon={<PlusIcon size={16} color={colors.mutedForeground} />}
					variant="ghost"
					size="icon-sm"
					accessibilityLabel="Add new agent"
					onPress={() => handleSelectAgent("__new__")}
				/>
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
					{/* Total count header - matches desktop */}
					<View
						style={[
							styles.countHeader,
							{ borderBottomColor: colors.border },
						]}
					>
						<Text style={[styles.countText, { color: colors.mutedForeground }]}>
							Total {agents.length}
						</Text>
					</View>

					{builtInAgents.length > 0 && (
						<View style={styles.section}>
							<Text
								style={[styles.sectionTitle, { color: colors.mutedForeground }]}
							>
								Built-in Agents
							</Text>
							{builtInAgents.map((agent) => (
								<SettingsListItem
									key={agent.name}
									title={agent.name}
									subtitle={agent.description}
									badge="system"
									modeIcon={getAgentModeIcon(agent.mode, colors.primary)}
									onPress={() => handleSelectAgent(agent.name)}
								/>
							))}
						</View>
					)}

					{customAgents.length > 0 && (
						<View style={styles.section}>
							<Text
								style={[styles.sectionTitle, { color: colors.mutedForeground }]}
							>
								Custom Agents
							</Text>
							{customAgents.map((agent) => (
								<SettingsListItem
									key={agent.name}
									title={agent.name}
									subtitle={agent.description}
									badge={(agent as { scope?: string }).scope}
									modeIcon={getAgentModeIcon(agent.mode, colors.primary)}
									onPress={() => handleSelectAgent(agent.name)}
								/>
							))}
						</View>
					)}

					{agents.length === 0 && (
						<View style={styles.emptyContainer}>
							<RobotIcon size={40} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
							<Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
								No agents configured
							</Text>
							<Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
								Use the + button above to create one
							</Text>
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
		fontSize: FontSizes.h2,
		fontFamily: Fonts.semiBold,
		textAlign: "center",
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
		paddingTop: 0,
	},
	countHeader: {
		paddingHorizontal: Spacing[4],
		paddingVertical: Spacing[3],
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	countText: {
		fontSize: FontSizes.meta,
		fontFamily: Fonts.regular,
	},
	section: {
		paddingTop: Spacing[2],
		paddingBottom: Spacing[1],
	},
	sectionTitle: {
		fontSize: FontSizes.micro,
		fontFamily: Fonts.semiBold,
		letterSpacing: 0.5,
		textTransform: "uppercase",
		marginBottom: Spacing[1.5],
		paddingHorizontal: Spacing[4],
	},
	emptyContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 48,
		paddingHorizontal: Spacing[4],
		gap: 8,
	},
	emptyTitle: {
		fontSize: FontSizes.uiLabel,
		fontFamily: Fonts.medium,
		marginTop: Spacing[3],
	},
	emptySubtitle: {
		fontSize: FontSizes.meta,
		fontFamily: Fonts.regular,
		opacity: 0.75,
	},
});
