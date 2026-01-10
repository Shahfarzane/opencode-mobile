import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import {
	Modal,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { fontStyle, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";

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
				className="flex-1"
				style={{ backgroundColor: colors.background, paddingTop: insets.top }}
			>
				<View
					className="flex-row items-center justify-between border-b px-4 py-3"
					style={{ borderBottomColor: colors.border }}
				>
					<Text style={[typography.uiHeader, { color: colors.foreground }]}>
						Select Agent
					</Text>
					<Button variant="muted" size="sm" onPress={onClose}>
						<Button.Label>Done</Button.Label>
					</Button>
				</View>

				<ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
					{primaryAgents.map((agent) => {
						const isSelected = agent.name === currentAgentName;
						const agentColor = getAgentColor(agent.name);

						return (
							<Pressable
								key={agent.name}
								onPress={() => handleAgentSelect(agent.name)}
								className="flex-row items-center justify-between p-3.5 rounded-xl border"
								style={{
									backgroundColor: isSelected
										? withOpacity(agentColor, OPACITY.active)
										: colors.card,
									borderColor: isSelected ? agentColor : colors.border,
								}}
							>
								<View className="flex-1 mr-3">
									<View className="flex-row items-center gap-2">
										<View
											className="w-2 h-2 rounded-full"
											style={{ backgroundColor: agentColor }}
										/>
										<Text
											style={[
												typography.uiLabel,
												{
													color: isSelected
														? agentColor
														: colors.foreground,
												},
												fontStyle("600"),
											]}
										>
											{agent.name.charAt(0).toUpperCase() + agent.name.slice(1)}
										</Text>
									</View>
									{agent.description && (
										<Text
											className="mt-1"
											style={[
												typography.micro,
												{ color: colors.mutedForeground },
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
