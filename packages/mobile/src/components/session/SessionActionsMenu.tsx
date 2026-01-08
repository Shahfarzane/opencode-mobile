import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Dimensions, Modal, Pressable, Text, View } from "react-native";
import {
	CopyIcon,
	LinkOffIcon,
	PencilIcon,
	ShareIcon,
	TrashIcon,
} from "@/components/icons";
import { typography, useTheme } from "@/theme";
import { sessionActionsMenuStyles } from "./SessionActionsMenu.styles";

interface SessionActionsMenuProps {
	visible: boolean;
	onClose: () => void;
	onRename: () => void;
	onShare?: () => void;
	onCopyLink?: () => void;
	onUnshare?: () => void;
	onDelete: () => void;
	isShared?: boolean;
	shareUrl?: string;
	anchorPosition?: { x: number; y: number } | null;
}

const MENU_WIDTH = 180;
const MENU_MARGIN = 8;

export function SessionActionsMenu({
	visible,
	onClose,
	onRename,
	onShare,
	onCopyLink,
	onUnshare,
	onDelete,
	isShared = false,
	shareUrl,
	anchorPosition,
}: SessionActionsMenuProps) {
	const { colors, isDark } = useTheme();
	const screenWidth = Dimensions.get("window").width;
	
	const menuPosition = anchorPosition
		? {
				top: anchorPosition.y + MENU_MARGIN,
				right: screenWidth - anchorPosition.x,
			}
		: null;

	const handleRename = async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onRename();
		onClose();
	};

	const handleShare = async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onShare?.();
		onClose();
	};

	const handleCopyLink = async () => {
		if (shareUrl) {
			await Clipboard.setStringAsync(shareUrl);
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		}
		onCopyLink?.();
		onClose();
	};

	const handleUnshare = async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onUnshare?.();
		onClose();
	};

	const handleDelete = async () => {
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
		onDelete();
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
				className={sessionActionsMenuStyles.overlay({})}
				style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
				onPress={onClose}
			>
				<View
					className={sessionActionsMenuStyles.menu({})}
					style={[
						{
							backgroundColor: colors.card,
							borderColor: colors.border,
							borderWidth: 1,
							shadowColor: isDark ? "#000" : "#666",
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.15,
							shadowRadius: 12,
							elevation: 8,
							minWidth: MENU_WIDTH,
						},
						menuPosition && {
							position: "absolute",
							top: menuPosition.top,
							right: menuPosition.right,
						},
					]}
				>
					{/* Rename */}
					<Pressable
						onPress={handleRename}
						className={sessionActionsMenuStyles.menuItem({})}
						style={({ pressed }) => ({
							backgroundColor: pressed ? colors.muted : "transparent",
						})}
					>
						<PencilIcon color={colors.foreground} size={18} />
						<Text style={[typography.uiLabel, { color: colors.foreground }]}>
							Rename
						</Text>
					</Pressable>

					<View
						className={sessionActionsMenuStyles.divider({})}
						style={{ backgroundColor: colors.border }}
					/>

					{/* Share section */}
					{!isShared ? (
						<Pressable
							onPress={handleShare}
							className={sessionActionsMenuStyles.menuItem({})}
							style={({ pressed }) => ({
								backgroundColor: pressed ? colors.muted : "transparent",
							})}
						>
							<ShareIcon color={colors.foreground} size={18} />
							<Text style={[typography.uiLabel, { color: colors.foreground }]}>
								Share
							</Text>
						</Pressable>
					) : (
						<>
							<Pressable
								onPress={handleCopyLink}
								className={sessionActionsMenuStyles.menuItem({})}
								style={({ pressed }) => ({
									backgroundColor: pressed ? colors.muted : "transparent",
								})}
							>
								<CopyIcon color={colors.foreground} size={18} />
								<Text
									style={[typography.uiLabel, { color: colors.foreground }]}
								>
									Copy Link
								</Text>
							</Pressable>

							<Pressable
								onPress={handleUnshare}
								className={sessionActionsMenuStyles.menuItem({})}
								style={({ pressed }) => ({
									backgroundColor: pressed ? colors.muted : "transparent",
								})}
							>
								<LinkOffIcon color={colors.foreground} size={18} />
								<Text
									style={[typography.uiLabel, { color: colors.foreground }]}
								>
									Unshare
								</Text>
							</Pressable>
						</>
					)}

					<View
						className={sessionActionsMenuStyles.divider({})}
						style={{ backgroundColor: colors.border }}
					/>

					{/* Delete */}
					<Pressable
						onPress={handleDelete}
						className={sessionActionsMenuStyles.menuItem({})}
						style={({ pressed }) => ({
							backgroundColor: pressed ? colors.muted : "transparent",
						})}
					>
						<TrashIcon color={colors.destructive} size={18} />
						<Text style={[typography.uiLabel, { color: colors.destructive }]}>
							Delete
						</Text>
					</Pressable>
				</View>
			</Pressable>
		</Modal>
	);
}
