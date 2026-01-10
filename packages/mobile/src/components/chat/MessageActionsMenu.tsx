import * as Haptics from "expo-haptics";
import { Modal, Pressable, Text, View } from "react-native";
import { CopyIcon, GitForkIcon, UndoIcon } from "@/components/icons";
import { getShadowColor, MenuPositioning, ShadowTokens, typography, useTheme } from "@/theme";
import { OVERLAYS } from "@/utils/colors";

interface MessageActionsMenuProps {
	visible: boolean;
	onClose: () => void;
	onCopy: () => void;
	onBranchSession?: () => void;
	onRevert?: () => void;
	isAssistantMessage: boolean;
}

export function MessageActionsMenu({
	visible,
	onClose,
	onCopy,
	onBranchSession,
	onRevert,
}: MessageActionsMenuProps) {
	const { colors, isDark } = useTheme();

	const handleCopy = async () => {
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		onCopy();
		onClose();
	};

	const handleBranch = async () => {
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		onBranchSession?.();
		onClose();
	};

	const handleRevert = async () => {
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		onRevert?.();
		onClose();
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<Pressable
				className="flex-1 justify-center items-center"
				style={{ backgroundColor: OVERLAYS.scrimMedium }}
				onPress={onClose}
			>
				<View
					className="rounded-xl border overflow-hidden"
					style={{
						backgroundColor: colors.card,
						borderColor: colors.border,
						minWidth: MenuPositioning.width,
						shadowColor: getShadowColor(isDark),
						...ShadowTokens.menu,
					}}
				>
					<Pressable
						onPress={handleCopy}
						className="flex-row items-center gap-3 px-4 py-3.5"
						style={({ pressed }) => ({
							backgroundColor: pressed ? colors.muted : "transparent",
						})}
					>
						<CopyIcon size={18} color={colors.foreground} />
						<Text style={[typography.uiLabel, { color: colors.foreground }]}>
							Copy Text
						</Text>
					</Pressable>

					{onRevert && (
						<>
							<View className="h-px" style={{ backgroundColor: colors.border }} />
							<Pressable
								onPress={handleRevert}
								className="flex-row items-center gap-3 px-4 py-3.5"
								style={({ pressed }) => ({
									backgroundColor: pressed ? colors.muted : "transparent",
								})}
							>
								<UndoIcon size={18} color={colors.foreground} />
								<Text
									style={[typography.uiLabel, { color: colors.foreground }]}
								>
									Revert to Here
								</Text>
							</Pressable>
						</>
					)}

					{onBranchSession && (
						<>
							<View className="h-px" style={{ backgroundColor: colors.border }} />
							<Pressable
								onPress={handleBranch}
								className="flex-row items-center gap-3 px-4 py-3.5"
								style={({ pressed }) => ({
									backgroundColor: pressed ? colors.muted : "transparent",
								})}
							>
								<GitForkIcon size={18} color={colors.foreground} />
								<Text
									style={[typography.uiLabel, { color: colors.foreground }]}
								>
									Fork from Here
								</Text>
							</Pressable>
						</>
					)}
				</View>
			</Pressable>
		</Modal>
	);
}


