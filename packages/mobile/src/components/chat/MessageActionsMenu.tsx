import type BottomSheet from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { CopyIcon, GitForkIcon, UndoIcon } from "@/components/icons";
import { Sheet } from "@/components/ui/sheet";
import { typography, useTheme } from "@/theme";

interface MessageLayout {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface MessageActionsMenuProps {
	visible: boolean;
	onClose: () => void;
	onCopy: () => void;
	onBranchSession?: () => void;
	onRevert?: () => void;
	isAssistantMessage: boolean;
	messageLayout?: MessageLayout;
}

export function MessageActionsMenu({
	visible,
	onClose,
	onCopy,
	onBranchSession,
	onRevert,
}: MessageActionsMenuProps) {
	const { colors } = useTheme();
	const sheetRef = useRef<BottomSheet>(null);
	const snapPoints = useMemo(() => ["28%"], []);

	useEffect(() => {
		if (visible) {
			sheetRef.current?.snapToIndex(0);
		} else {
			sheetRef.current?.close();
		}
	}, [visible]);

	const handleCopy = async () => {
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		onCopy();
		sheetRef.current?.close();
	};

	const handleBranch = async () => {
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		onBranchSession?.();
		sheetRef.current?.close();
	};

	const handleRevert = async () => {
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		onRevert?.();
		sheetRef.current?.close();
	};

	const actions = [
		{
			key: "copy",
			label: "Copy",
			icon: CopyIcon,
			onPress: handleCopy,
		},
		...(onRevert
			? [
				{
					key: "revert",
					label: "Revert",
					icon: UndoIcon,
					onPress: handleRevert,
				},
			]
			: []),
		...(onBranchSession
			? [
				{
					key: "branch",
					label: "Fork",
					icon: GitForkIcon,
					onPress: handleBranch,
				},
			]
			: []),
	];

	return (
		<Sheet ref={sheetRef} snapPoints={snapPoints} onClose={onClose} contentPadding={0}>
			<View className="pb-2">
				<View className="px-4 pt-2 pb-1">
					<Text style={[typography.uiHeader, { color: colors.foreground }]}>Message actions</Text>
				</View>
				<View className="border-t" style={{ borderTopColor: colors.border }} />
				{actions.map((action, index) => (
					<View key={action.key}>
						<Pressable
							onPress={action.onPress}
							className="flex-row items-center gap-3 px-4 py-3"
							style={({ pressed }) => ({ backgroundColor: pressed ? colors.muted : "transparent" })}
							accessibilityRole="menuitem"
						>
							<action.icon size={18} color={colors.mutedForeground} />
							<Text style={[typography.uiLabel, { color: colors.foreground }]}>{action.label}</Text>
						</Pressable>
						{index < actions.length - 1 && <View className="h-px" style={{ backgroundColor: colors.border }} />}
					</View>
				))}
			</View>
		</Sheet>
	);
}
