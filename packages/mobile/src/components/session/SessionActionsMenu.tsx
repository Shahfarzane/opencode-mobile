import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import {
	CopyIcon,
	FolderIcon,
	LinkOffIcon,
	PencilIcon,
	ShareIcon,
	TrashIcon,
} from "@/components/icons";
import {
	AnimationTokens,
	getShadowColor,
	IconSizes,
	MenuPositioning,
	MobileSizes,
	OpacityTokens,
	RadiusTokens,
	ShadowTokens,
	typography,
	useTheme,
} from "@/theme";
import { withOpacity } from "@/utils/colors";

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

const MENU_WIDTH = 220;
const SCREEN_PADDING = MobileSizes.gapLg;

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
	const scaleAnim = useRef(new Animated.Value(AnimationTokens.menuScaleFrom)).current;
	const opacityAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (visible) {
			Animated.parallel([
				Animated.spring(scaleAnim, {
					toValue: AnimationTokens.menuScaleTo,
					useNativeDriver: true,
					...AnimationTokens.menuSpring,
				}),
				Animated.timing(opacityAnim, {
					toValue: 1,
					duration: AnimationTokens.durationDefault,
					useNativeDriver: true,
				}),
			]).start();
		} else {
			Animated.parallel([
				Animated.timing(scaleAnim, {
					toValue: AnimationTokens.menuScaleFrom,
					duration: AnimationTokens.menuCloseDuration,
					useNativeDriver: true,
				}),
				Animated.timing(opacityAnim, {
					toValue: 0,
					duration: AnimationTokens.menuCloseDuration,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [visible, scaleAnim, opacityAnim]);

	const handleRename = async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onClose();
		onRename();
	};

	const handleShare = async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onClose();
		onShare?.();
	};

	const handleCopyLink = async () => {
		if (shareUrl) {
			await Clipboard.setStringAsync(shareUrl);
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		}
		onClose();
		onCopyLink?.();
	};

	const handleUnshare = async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onClose();
		onUnshare?.();
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
		onClose();
		onDelete();
	};

	const actions = useMemo(() => [
		{ key: "rename", label: "Rename", icon: PencilIcon, onPress: handleRename },
		...(!isShared
			? [{ key: "share", label: "Share", icon: ShareIcon, onPress: handleShare }]
			: []),
		...(isShared && shareUrl
			? [{ key: "copy-link", label: "Copy link", icon: CopyIcon, onPress: handleCopyLink }]
			: []),
		...(isShared
			? [{ key: "unshare", label: "Stop sharing", icon: LinkOffIcon, onPress: handleUnshare }]
			: []),
		...(worktreePath
			? [{ key: "copy-path", label: "Copy worktree path", icon: FolderIcon, onPress: handleCopyWorktreePath }]
			: []),
		{ key: "delete", label: "Delete", icon: TrashIcon, onPress: handleDelete, destructive: true },
	], [isShared, shareUrl, worktreePath]);

	// Calculate menu position
	const screenWidth = Dimensions.get("window").width;
	const screenHeight = Dimensions.get("window").height;

	const menuPosition = useMemo(() => {
		if (!anchorPosition) {
			return { top: screenHeight / 2 - 100, right: SCREEN_PADDING };
		}

		// Position menu to the left of the anchor (three-dot button)
		let x = anchorPosition.x - MENU_WIDTH - MenuPositioning.margin;
		let y = anchorPosition.y;

		// Ensure menu stays within screen bounds
		if (x < SCREEN_PADDING) {
			x = SCREEN_PADDING;
		}
		if (x + MENU_WIDTH > screenWidth - SCREEN_PADDING) {
			x = screenWidth - MENU_WIDTH - SCREEN_PADDING;
		}

		// Estimate menu height based on item height
		const estimatedHeight = actions.length * MobileSizes.buttonMd + MobileSizes.gapMd;
		if (y + estimatedHeight > screenHeight - 100) {
			y = screenHeight - estimatedHeight - 100;
		}
		if (y < 100) {
			y = 100;
		}

		return { top: y, left: x };
	}, [anchorPosition, screenWidth, screenHeight, actions.length]);

	const shadowColor = getShadowColor(isDark);

	return (
		<Modal
			visible={visible}
			transparent
			animationType="none"
			onRequestClose={onClose}
		>
			<Pressable style={styles.backdrop} onPress={onClose}>
				<Animated.View
					style={[
						styles.menuContainer,
						{
							opacity: opacityAnim,
							transform: [
								{ scale: scaleAnim },
								{
									translateY: scaleAnim.interpolate({
										inputRange: [AnimationTokens.menuScaleFrom, AnimationTokens.menuScaleTo],
										outputRange: [-MobileSizes.gapMd, 0],
									}),
								},
							],
							shadowColor,
							...ShadowTokens.menu,
							...menuPosition,
						},
					]}
				>
					<View
						style={[
							styles.menuContent,
							{
								backgroundColor: isDark
									? withOpacity(colors.card, 0.98)
									: colors.card,
								borderColor: withOpacity(colors.border, OpacityTokens.subtle),
							},
						]}
					>
						{actions.map((action, index) => (
							<View key={action.key}>
								<Pressable
									onPress={action.onPress}
									style={({ pressed }) => [
										styles.menuItem,
										{
											backgroundColor: pressed
												? withOpacity(colors.foreground, OpacityTokens.faint)
												: "transparent",
										},
									]}
								>
									<Text
										style={[
											typography.uiLabel,
											styles.menuItemText,
											{
												color: action.destructive
													? colors.destructive
													: colors.foreground,
											},
										]}
									>
										{action.label}
									</Text>
									<action.icon
										size={MenuPositioning.iconSize}
										color={
											action.destructive
												? colors.destructive
												: colors.mutedForeground
										}
									/>
								</Pressable>
								{index < actions.length - 1 && (
									<View
										style={[
											styles.separator,
											{ backgroundColor: withOpacity(colors.border, OpacityTokens.subtle) },
										]}
									/>
								)}
							</View>
						))}
					</View>
				</Animated.View>
			</Pressable>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
	},
	menuContainer: {
		position: "absolute",
		width: MENU_WIDTH,
	},
	menuContent: {
		borderRadius: RadiusTokens.xl,
		overflow: "hidden",
		borderWidth: 1,
	},
	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: MenuPositioning.itemPaddingX,
		paddingVertical: MenuPositioning.itemPaddingY,
		minHeight: MobileSizes.buttonMd,
		gap: MenuPositioning.itemGap,
	},
	menuItemText: {
		flex: 1,
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		marginLeft: MenuPositioning.itemPaddingX,
	},
});
