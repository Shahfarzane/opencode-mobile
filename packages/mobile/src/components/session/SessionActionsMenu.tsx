import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Dimensions, Modal, Pressable, Text, View } from "react-native";
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
	interpolate,
} from "react-native-reanimated";
import {
	CopyIcon,
	FolderIcon,
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
	worktreePath?: string;
	anchorPosition?: { x: number; y: number } | null;
}

const MENU_WIDTH = 180;
const MENU_HEIGHT = 180;
const MENU_MARGIN = 8;

const SPRING_CONFIG = {
	damping: 22,
	mass: 1,
	stiffness: 380,
};

const CLOSE_DURATION = 150;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
	worktreePath,
	anchorPosition,
}: SessionActionsMenuProps) {
	const { colors, isDark } = useTheme();
	const screenWidth = Dimensions.get("window").width;
	const [modalVisible, setModalVisible] = useState(false);
	
	const progress = useSharedValue(0);

	const menuPosition = anchorPosition
		? {
				top: anchorPosition.y + MENU_MARGIN,
				right: screenWidth - anchorPosition.x,
			}
		: null;

	useEffect(() => {
		if (visible) {
			setModalVisible(true);
			progress.value = withSpring(1, SPRING_CONFIG);
		} else {
			progress.value = withTiming(0, { duration: CLOSE_DURATION }, (finished) => {
				if (finished) {
					runOnJS(setModalVisible)(false);
				}
			});
		}
	}, [visible, progress]);

	const backdropStyle = useAnimatedStyle(() => ({
		opacity: interpolate(progress.value, [0, 1], [0, 0.4]),
	}));

	const menuStyle = useAnimatedStyle(() => {
		const halfWidth = MENU_WIDTH / 2;
		const halfHeight = MENU_HEIGHT / 2;

		return {
			opacity: interpolate(progress.value, [0, 0.3, 1], [0, 0.8, 1]),
			transform: [
				{ translateX: halfWidth },
				{ translateY: -halfHeight },
				{ scale: interpolate(progress.value, [0, 1], [0.85, 1]) },
				{ translateX: -halfWidth },
				{ translateY: halfHeight },
			],
		};
	});

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

	const handleCopyWorktreePath = async () => {
		if (worktreePath) {
			await Clipboard.setStringAsync(worktreePath);
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		}
		onClose();
	};

	const handleDelete = async () => {
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
		onDelete();
		onClose();
	};

	return (
		<Modal
			visible={modalVisible}
			transparent
			animationType="none"
			onRequestClose={onClose}
		>
			<View className={sessionActionsMenuStyles.overlay({})}>
				<AnimatedPressable
					style={[
						{
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							backgroundColor: "#000",
						},
						backdropStyle,
					]}
					onPress={onClose}
				/>
				<Animated.View
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
						menuStyle,
					]}
				>
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

					{worktreePath && (
						<>
							<View
								className={sessionActionsMenuStyles.divider({})}
								style={{ backgroundColor: colors.border }}
							/>
							<Pressable
								onPress={handleCopyWorktreePath}
								className={sessionActionsMenuStyles.menuItem({})}
								style={({ pressed }) => ({
									backgroundColor: pressed ? colors.muted : "transparent",
								})}
							>
								<FolderIcon color={colors.foreground} size={18} />
								<Text style={[typography.uiLabel, { color: colors.foreground }]}>
									Copy Worktree Path
								</Text>
							</Pressable>
						</>
					)}

					<View
						className={sessionActionsMenuStyles.divider({})}
						style={{ backgroundColor: colors.border }}
					/>

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
				</Animated.View>
			</View>
		</Modal>
	);
}
