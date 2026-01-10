import * as Haptics from "expo-haptics";
import { Dimensions, Modal, Pressable, Text, View } from "react-native";
import { CopyIcon, GitForkIcon, UndoIcon } from "@/components/icons";
import { getShadowColor, ShadowTokens, typography, useTheme } from "@/theme";
import { OVERLAYS } from "@/utils/colors";

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
	/** Layout of the message bubble for positioning */
	messageLayout?: MessageLayout;
}

const MENU_ITEM_HEIGHT = 44;
const SCREEN_PADDING = 16;

export function MessageActionsMenu({
	visible,
	onClose,
	onCopy,
	onBranchSession,
	onRevert,
	isAssistantMessage,
	messageLayout,
}: MessageActionsMenuProps) {
	const { colors, isDark } = useTheme();
	const screenHeight = Dimensions.get("window").height;

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

	// Calculate number of menu items
	const menuItemCount = 1 + (onRevert ? 1 : 0) + (onBranchSession ? 1 : 0);
	const menuHeight = menuItemCount * MENU_ITEM_HEIGHT;

	// Calculate menu position based on message layout
	const getMenuStyle = () => {
		if (!messageLayout) {
			// Fallback: center the menu
			return {
				alignSelf: "center" as const,
				top: screenHeight * 0.4,
			};
		}

		const { y, height } = messageLayout;

		// Determine if menu should go above or below the message
		const spaceBelow = screenHeight - (y + height) - 80;
		const spaceAbove = y - 120;
		const menuGoesBelow = spaceBelow >= menuHeight || spaceBelow > spaceAbove;

		const menuTop = menuGoesBelow
			? y + height + 8
			: y - menuHeight - 8;

		return {
			position: "absolute" as const,
			top: Math.max(100, Math.min(menuTop, screenHeight - menuHeight - 50)),
			right: isAssistantMessage ? undefined : SCREEN_PADDING,
			left: isAssistantMessage ? SCREEN_PADDING : undefined,
		};
	};

	const menuStyle = getMenuStyle();

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<Pressable
				className="flex-1"
				style={{ backgroundColor: OVERLAYS.scrimMedium }}
				onPress={onClose}
			>
				{/* Action menu */}
				<View
					className="rounded-xl overflow-hidden"
					style={[
						{
							backgroundColor: colors.card,
							shadowColor: getShadowColor(isDark),
							minWidth: 140,
							...ShadowTokens.menu,
						},
						menuStyle,
					]}
				>
					<Pressable
						onPress={handleCopy}
						className="flex-row items-center gap-3 px-4"
						style={({ pressed }) => ({
							backgroundColor: pressed ? colors.muted : "transparent",
							height: MENU_ITEM_HEIGHT,
						})}
					>
						<CopyIcon size={18} color={colors.foreground} />
						<Text style={[typography.uiLabel, { color: colors.foreground }]}>
							Copy
						</Text>
					</Pressable>

					{onRevert && (
						<>
							<View className="h-px" style={{ backgroundColor: colors.border }} />
							<Pressable
								onPress={handleRevert}
								className="flex-row items-center gap-3 px-4"
								style={({ pressed }) => ({
									backgroundColor: pressed ? colors.muted : "transparent",
									height: MENU_ITEM_HEIGHT,
								})}
							>
								<UndoIcon size={18} color={colors.foreground} />
								<Text style={[typography.uiLabel, { color: colors.foreground }]}>
									Revert
								</Text>
							</Pressable>
						</>
					)}

					{onBranchSession && (
						<>
							<View className="h-px" style={{ backgroundColor: colors.border }} />
							<Pressable
								onPress={handleBranch}
								className="flex-row items-center gap-3 px-4"
								style={({ pressed }) => ({
									backgroundColor: pressed ? colors.muted : "transparent",
									height: MENU_ITEM_HEIGHT,
								})}
							>
								<GitForkIcon size={18} color={colors.foreground} />
								<Text style={[typography.uiLabel, { color: colors.foreground }]}>
									Fork
								</Text>
							</Pressable>
						</>
					)}
				</View>
			</Pressable>
		</Modal>
	);
}


