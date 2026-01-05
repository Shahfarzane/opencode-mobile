import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import {
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { typography, useTheme } from "@/theme";

export interface Agent {
	name: string;
	description?: string;
	mode?: "primary" | "subagent" | "all";
}

interface AgentPickerProps {
	agents: Agent[];
	currentAgentName?: string;
	onAgentChange: (agentName: string) => void;
	visible: boolean;
	onClose: () => void;
}

function RobotIcon({ color, size = 16 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M12 8V4m0 0a2 2 0 100-4 2 2 0 000 4zM5 12h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M9 16h.01M15 16h.01"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

function CheckIcon({ color, size = 16 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M20 6L9 17l-5-5"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

const AGENT_COLORS = [
	"#3B82F6",
	"#10B981",
	"#F59E0B",
	"#EF4444",
	"#8B5CF6",
	"#EC4899",
	"#06B6D4",
	"#84CC16",
];

function getAgentColor(name: string): string {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	return AGENT_COLORS[Math.abs(hash) % AGENT_COLORS.length];
}

export function AgentPicker({
	agents,
	currentAgentName,
	onAgentChange,
	visible,
	onClose,
}: AgentPickerProps) {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	const primaryAgents = agents.filter(
		(agent) =>
			agent.mode === "primary" || agent.mode === "all" || !agent.mode,
	);

	const handleAgentSelect = useCallback(
		(agentName: string) => {
			Haptics.selectionAsync();
			onAgentChange(agentName);
			onClose();
		},
		[onAgentChange, onClose],
	);

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<View
				style={[
					styles.modalContainer,
					{
						backgroundColor: colors.background,
						paddingTop: insets.top,
					},
				]}
			>
				<View
					style={[styles.modalHeader, { borderBottomColor: colors.border }]}
				>
					<Text style={[typography.uiHeader, { color: colors.foreground }]}>
						Select Agent
					</Text>
					<Pressable
						onPress={onClose}
						style={[styles.closeButton, { backgroundColor: colors.muted }]}
					>
						<Text style={[typography.uiLabel, { color: colors.foreground }]}>
							Done
						</Text>
					</Pressable>
				</View>

				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
				>
					{primaryAgents.map((agent) => {
						const isSelected = agent.name === currentAgentName;
						const agentColor = getAgentColor(agent.name);

						return (
							<Pressable
								key={agent.name}
								onPress={() => handleAgentSelect(agent.name)}
								style={[
									styles.agentItem,
									{
										backgroundColor: isSelected
											? `${agentColor}15`
											: colors.card,
										borderColor: isSelected ? agentColor : colors.border,
									},
								]}
							>
								<View style={styles.agentInfo}>
									<View style={styles.agentHeader}>
										<View
											style={[
												styles.agentDot,
												{ backgroundColor: agentColor },
											]}
										/>
										<Text
											style={[
												typography.uiLabel,
												{
													color: isSelected
														? agentColor
														: colors.foreground,
													fontWeight: "600",
												},
											]}
										>
											{agent.name.charAt(0).toUpperCase() + agent.name.slice(1)}
										</Text>
									</View>
									{agent.description && (
										<Text
											style={[
												typography.micro,
												{
													color: colors.mutedForeground,
													marginTop: 4,
												},
											]}
											numberOfLines={2}
										>
											{agent.description}
										</Text>
									)}
								</View>
								{isSelected && (
									<CheckIcon size={18} color={agentColor} />
								)}
							</Pressable>
						);
					})}
				</ScrollView>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderBottomWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	closeButton: {
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		gap: 12,
	},
	agentItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 14,
		borderRadius: 12,
		borderWidth: 1,
	},
	agentInfo: {
		flex: 1,
		marginRight: 12,
	},
	agentHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	agentDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
});
