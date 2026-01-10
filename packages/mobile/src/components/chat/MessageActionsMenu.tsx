import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CopyIcon, GitForkIcon, UndoIcon } from "@/components/icons";
import { AnimationTokens, getShadowColor, OpacityTokens, ShadowTokens, typography, useTheme } from "@/theme";

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
const MENU_SIDE_OFFSET = 8; // Matches PWA sideOffset of 8px
const MENU_BORDER_RADIUS = 12; // rounded-xl = 12px
const MENU_MIN_WIDTH = 140;
const HEADER_HEIGHT = 56; // Approximate header height
const BOTTOM_NAV_HEIGHT = 56; // Approximate bottom navigation height

const SPRING_CONFIG = {
	...AnimationTokens.menuSpring,
	useNativeDriver: true,
};

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
	const insets = useSafeAreaInsets();
	const screenHeight = Dimensions.get("window").height;
	const [modalVisible, setModalVisible] = useState(false);
	const progress = useRef(new Animated.Value(0)).current;

	// Calculate safe areas using actual device insets
	const safeAreaTop = insets.top + HEADER_HEIGHT;
	const safeAreaBottom = insets.bottom + BOTTOM_NAV_HEIGHT;

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

		const { x, y, width, height } = messageLayout;

		// Calculate available space above and below the message using actual safe areas
		const spaceBelow = screenHeight - (y + height) - safeAreaBottom;
		const spaceAbove = y - safeAreaTop;

		// Determine if menu should go above or below the message
		const menuGoesBelow = spaceBelow >= menuHeight + MENU_SIDE_OFFSET || spaceBelow > spaceAbove;

		// Calculate vertical position
		const menuTop = menuGoesBelow
			? y + height + MENU_SIDE_OFFSET
			: y - menuHeight - MENU_SIDE_OFFSET;

		// Calculate horizontal position - align with message edge
		const menuHorizontal = isAssistantMessage
			? { left: Math.max(SCREEN_PADDING, x) }
			: { right: SCREEN_PADDING };

		return {
			position: "absolute" as const,
			top: Math.max(safeAreaTop, Math.min(menuTop, screenHeight - menuHeight - safeAreaBottom)),
			...menuHorizontal,
		};
	};

	const menuStyle = getMenuStyle();

	return (
		<Modal
			visible={modalVisible}
			transparent
			animationType="none"
			onRequestClose={onClose}
		>
			<View className="flex-1">
				{/* Animated backdrop */}
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

				{/* Animated action menu */}
				<Animated.View
					className="overflow-hidden"
					style={[
						{
							backgroundColor: colors.card,
							borderColor: colors.border,
							borderWidth: 1,
							borderRadius: MENU_BORDER_RADIUS,
							shadowColor: getShadowColor(isDark),
							minWidth: MENU_MIN_WIDTH,
							...ShadowTokens.menu,
							opacity: menuOpacity,
							transform: [{ scale: menuScale }],
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
						<CopyIcon size={18} color={colors.mutedForeground} />
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
								<UndoIcon size={18} color={colors.mutedForeground} />
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
								<GitForkIcon size={18} color={colors.mutedForeground} />
								<Text style={[typography.uiLabel, { color: colors.foreground }]}>
									Fork
								</Text>
							</Pressable>
						</>
					)}
				</Animated.View>
			</View>
		</Modal>
	);
}


