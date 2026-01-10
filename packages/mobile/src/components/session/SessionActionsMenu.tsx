import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Animated,
	Dimensions,
	type LayoutChangeEvent,
	Modal,
	Pressable,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
	MenuPositioning,
	OpacityTokens,
	ShadowTokens,
	typography,
	useTheme,
} from "@/theme";
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

const SPRING_CONFIG = {
	...AnimationTokens.menuSpring,
	useNativeDriver: true,
};

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
	const insets = useSafeAreaInsets();
	const screenWidth = Dimensions.get("window").width;
	const screenHeight = Dimensions.get("window").height;
	const [modalVisible, setModalVisible] = useState(false);
	const [menuLayout, setMenuLayout] = useState<{ width: number; height: number }>({ width: MenuPositioning.width, height: 200 });

	const progress = useRef(new Animated.Value(0)).current;

	// Calculate safe areas using actual device insets
	const safeAreaTop = insets.top + MenuPositioning.margin;
	const safeAreaBottom = insets.bottom + MenuPositioning.margin;

	// Calculate menu position ensuring it stays within screen bounds
	const menuPosition = anchorPosition
		? (() => {
				const rightOffset = screenWidth - anchorPosition.x;
				const topOffset = anchorPosition.y + MenuPositioning.margin;

				// Ensure menu doesn't go off-screen bottom (using actual safe area)
				const maxTop = screenHeight - menuLayout.height - safeAreaBottom;
				const adjustedTop = Math.min(topOffset, maxTop);

				// Ensure menu doesn't go off-screen right
				const minRight = MenuPositioning.margin;
				const adjustedRight = Math.max(rightOffset, minRight);

				return {
					top: Math.max(adjustedTop, safeAreaTop),
					right: adjustedRight,
				};
			})()
		: null;

	const handleLayout = useCallback((event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout;
		setMenuLayout({ width, height });
	}, []);

	useEffect(() => {
		if (visible) {
			setModalVisible(true);
			Animated.spring(progress, {
				toValue: 1,
				...SPRING_CONFIG,
			}).start();
		} else {
			Animated.timing(progress, {
				toValue: 0,
				duration: AnimationTokens.menuCloseDuration,
				useNativeDriver: true,
			}).start(({ finished }) => {
				if (finished) {
					setModalVisible(false);
				}
			});
		}
	}, [visible, progress]);

	const backdropOpacity = progress.interpolate({
		inputRange: [0, 1],
		outputRange: [0, OpacityTokens.backdrop],
	});

	const menuOpacity = progress.interpolate({
		inputRange: [0, 0.3, 1],
		outputRange: [0, 0.8, 1],
	});

	const menuScale = progress.interpolate({
		inputRange: [0, 1],
		outputRange: [AnimationTokens.menuScaleFrom, AnimationTokens.menuScaleTo],
	});

	// Transform origin: top-right corner
	// Since React Native transforms from center, we need to translate to achieve top-right origin
	const halfWidth = menuLayout.width / 2;
	const halfHeight = menuLayout.height / 2;

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
				<Pressable
					style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
					onPress={onClose}
				>
					<Animated.View
						style={{
							flex: 1,
							backgroundColor: "#000",
							opacity: backdropOpacity,
						}}
					/>
				</Pressable>
				<Animated.View
					onLayout={handleLayout}
					className={sessionActionsMenuStyles.menu({})}
					style={[
						{
							backgroundColor: colors.card,
							borderColor: colors.border,
							borderWidth: 1,
							shadowColor: getShadowColor(isDark),
							...ShadowTokens.menu,
							minWidth: MenuPositioning.width,
							opacity: menuOpacity,
							// Transform origin: top-right corner
							// Translate to move top-right to center, scale, then translate back
							transform: [
								{ translateX: halfWidth },
								{ translateY: -halfHeight },
								{ scale: menuScale },
								{ translateX: -halfWidth },
								{ translateY: halfHeight },
							],
						},
						menuPosition && {
							position: "absolute",
							top: menuPosition.top,
							right: menuPosition.right,
						},
					]}
				>
					<Pressable
						onPress={handleRename}
						className={sessionActionsMenuStyles.menuItem({})}
						style={({ pressed }) => ({
							backgroundColor: pressed ? colors.muted : "transparent",
						})}
					>
						<PencilIcon color={colors.mutedForeground} size={18} />
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
							<ShareIcon color={colors.mutedForeground} size={18} />
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
								<CopyIcon color={colors.mutedForeground} size={18} />
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
								<LinkOffIcon color={colors.mutedForeground} size={18} />
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
								<FolderIcon color={colors.mutedForeground} size={18} />
								<Text
									style={[typography.uiLabel, { color: colors.foreground }]}
								>
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
