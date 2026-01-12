import * as Haptics from "expo-haptics";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	type ElementRef,
} from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckIcon, XIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { Sheet } from "@/components/ui/sheet";
import { OPACITY, withOpacity } from "@/utils/colors";
import { Spacing, fontStyle, typography, useTheme } from "@/theme";

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

const ITEM_HEIGHT = 52;

export function AgentPicker({
	agents,
	currentAgentName,
	onAgentChange,
	visible,
	onClose,
}: AgentPickerProps) {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const sheetRef = useRef<ElementRef<typeof Sheet>>(null);

	const snapPoints = useMemo(() => ["55%", "80%"], []);
	const agentPalette = useMemo(
		() => [
			colors.info,
			colors.success,
			colors.warning,
			colors.destructive,
			colors.primary,
			colors.infoForeground,
			colors.successForeground,
			colors.warningForeground,
		],
		[
			colors.destructive,
			colors.info,
			colors.infoForeground,
			colors.primary,
			colors.success,
			colors.successForeground,
			colors.warning,
			colors.warningForeground,
		],
	);

	useEffect(() => {
		if (visible) {
			sheetRef.current?.snapToIndex(0);
		} else {
			sheetRef.current?.close();
		}
	}, [visible]);

	const handleSheetChange = useCallback(
		(index: number) => {
			if (index === -1) {
				onClose();
			}
		},
		[onClose],
	);

	const handleClose = useCallback(() => {
		sheetRef.current?.close();
	}, []);

	const primaryAgents = useMemo(
		() =>
			agents.filter(
				(agent) => agent.mode === "primary" || agent.mode === "all" || !agent.mode,
			),
		[agents],
	);

	const getAgentColor = useCallback(
		(name: string) => {
			let hash = 0;
			for (let i = 0; i < name.length; i++) {
				hash = name.charCodeAt(i) + ((hash << 5) - hash);
			}
			return agentPalette[Math.abs(hash) % agentPalette.length];
		},
		[agentPalette],
	);

	const handleAgentSelect = useCallback(
		(agentName: string) => {
			Haptics.selectionAsync();
			onAgentChange(agentName);
			sheetRef.current?.close();
		},
		[onAgentChange],
	);

	return (
		<Sheet
			ref={sheetRef}
			snapPoints={snapPoints}
			onChange={handleSheetChange}
			contentPadding={16}
			bottomInset={Math.max(insets.bottom, 12)}
		>
			<View className="flex-row items-center justify-between mb-3">
				<View>
					<Text style={[typography.uiHeader, { color: colors.foreground }]}>Select Agent</Text>
					<Text style={[typography.micro, { color: colors.mutedForeground }]}>Tap to switch active agent</Text>
				</View>
				<Pressable
					onPress={handleClose}
					hitSlop={12}
					style={({ pressed }) => ({
						backgroundColor: pressed ? withOpacity(colors.muted, 0.7) : "transparent",
						borderRadius: 999,
						padding: 8,
					})}
					accessibilityRole="button"
					accessibilityLabel="Close agent picker"
				>
					<XIcon size={18} color={colors.mutedForeground} />
				</Pressable>
			</View>

			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: insets.bottom + 8, gap: Spacing[3] }}
				showsVerticalScrollIndicator={false}
			>
				{primaryAgents.map((agent) => {
					const isSelected = agent.name === currentAgentName;
					const agentColor = getAgentColor(agent.name);

					return (
						<Pressable
							key={agent.name}
							onPress={() => handleAgentSelect(agent.name)}
							className="flex-row items-center justify-between px-3.5"
							style={({ pressed }) => ({
								height: ITEM_HEIGHT,
								borderRadius: 14,
								backgroundColor: pressed
									? withOpacity(agentColor, 0.18)
									: isSelected
										? withOpacity(agentColor, OPACITY.active)
										: colors.card,
								borderWidth: 1,
								borderColor: isSelected ? agentColor : colors.border,
								shadowColor: withOpacity(agentColor, 0.22),
								shadowOpacity: isSelected ? 0.35 : 0.18,
								shadowRadius: isSelected ? 10 : 6,
								elevation: isSelected ? 6 : 2,
							})}
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
										numberOfLines={1}
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
			</ScrollView>

			<Button variant="muted" size="sm" onPress={handleClose} className="mt-1">
				<Button.Label>Close</Button.Label>
			</Button>
		</Sheet>
	);
}
