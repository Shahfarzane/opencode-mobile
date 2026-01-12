import type BottomSheet from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { CheckIcon, XIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { Sheet, SheetScrollView } from "@/components/ui/sheet";
import { Spacing, fontStyle, typography, useTheme } from "@/theme";
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

function getAgentColor(name: string, palette: string[]): string {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	return palette[Math.abs(hash) % palette.length];
}

export function AgentPicker({
	agents,
	currentAgentName,
	onAgentChange,
	visible,
	onClose,
}: AgentPickerProps) {
	const { colors } = useTheme();
	const sheetRef = useRef<BottomSheet>(null);
	const snapPoints = useMemo(() => ["68%", "92%"], []);
	const agentPalette = [
		colors.info,
		colors.success,
		colors.warning,
		colors.destructive,
		colors.primary,
		colors.infoForeground,
		colors.successForeground,
		colors.warningForeground,
	];

	const primaryAgents = agents.filter(
		(agent) => agent.mode === "primary" || agent.mode === "all" || !agent.mode,
	);

	useEffect(() => {
		if (visible) {
			sheetRef.current?.snapToIndex(0);
		} else {
			sheetRef.current?.close();
		}
	}, [visible]);

	const handleAgentSelect = useCallback(
		(agentName: string) => {
			Haptics.selectionAsync();
			onAgentChange(agentName);
			sheetRef.current?.close();
		},
		[onAgentChange],
	);

	return (
		<Sheet ref={sheetRef} snapPoints={snapPoints} onClose={onClose} contentPadding={0}>
			<View className="px-4 pt-2 pb-3 flex-row items-center justify-between">
				<Text style={[typography.uiHeader, { color: colors.foreground }]}>Select agent</Text>
				<Button variant="muted" size="sm" onPress={() => sheetRef.current?.close()}>
					<Button.Label>Done</Button.Label>
				</Button>
			</View>

			<SheetScrollView
				contentContainerStyle={{ paddingHorizontal: Spacing[4], paddingBottom: Spacing[6], gap: Spacing[3] }}
			>
				{primaryAgents.map((agent) => {
					const isSelected = agent.name === currentAgentName;
					const agentColor = getAgentColor(agent.name, agentPalette);

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
							accessibilityRole="button"
						>
							<View className="flex-1 mr-3">
								<View className="flex-row items-center gap-2">
									<View className="w-2 h-2 rounded-full" style={{ backgroundColor: agentColor }} />
									<Text
										style={[
											typography.uiLabel,
											{
												color: isSelected ? agentColor : colors.foreground,
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
										style={[typography.micro, { color: colors.mutedForeground }]}
										numberOfLines={2}
									>
										{agent.description}
									</Text>
								)}
							</View>
							{isSelected && <CheckIcon size={18} color={agentColor} />}
						</Pressable>
					);
				})}
			</SheetScrollView>
		</Sheet>
	);
}
