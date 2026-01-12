import * as Haptics from "expo-haptics";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	type ElementRef,
} from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CopyIcon, GitForkIcon, UndoIcon } from "@/components/icons";
import { Sheet } from "@/components/ui/sheet";
import { MenuPositioning, typography, useTheme } from "@/theme";
import { withOpacity } from "@/utils/colors";

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

const ACTION_HEIGHT = 48;

export function MessageActionsMenu({
	visible,
	onClose,
	onCopy,
	onBranchSession,
	onRevert,
	isAssistantMessage,
	messageLayout,
}: MessageActionsMenuProps) {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const sheetRef = useRef<ElementRef<typeof Sheet>>(null);

	const snapPoints = useMemo(() => ["32%", "42%"], []);

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

	const closeSheet = useCallback(() => {
		sheetRef.current?.close();
	}, []);

	const handleCopy = useCallback(async () => {
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		onCopy();
		closeSheet();
	}, [closeSheet, onCopy]);

	const handleBranch = useCallback(async () => {
		if (!onBranchSession) return;
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		onBranchSession();
		closeSheet();
	}, [closeSheet, onBranchSession]);

	const handleRevert = useCallback(async () => {
		if (!onRevert) return;
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		onRevert();
		closeSheet();
	}, [closeSheet, onRevert]);

	const menuHeader = useMemo(() => {
		if (!messageLayout) return undefined;
		return isAssistantMessage ? "Assistant message" : "Your message";
	}, [isAssistantMessage, messageLayout]);

	return (
		<Sheet
			ref={sheetRef}
			onChange={handleSheetChange}
			snapPoints={snapPoints}
			contentPadding={16}
			bottomInset={Math.max(insets.bottom, 12)}
		>
			<View className="gap-2" style={{ paddingBottom: 4 }}>
				<View className="flex-row items-center justify-between">
					<View>
						<Text
							style={[
								typography.uiLabel,
								{ color: colors.foreground, fontWeight: "600" },
							]}
						>
							Message actions
						</Text>
						{menuHeader && (
							<Text style={[typography.micro, { color: colors.mutedForeground }]}>
								{menuHeader}
							</Text>
						)}
					</View>
					<Pressable
						onPress={closeSheet}
						hitSlop={12}
						style={({ pressed }) => ({
							backgroundColor: pressed ? withOpacity(colors.muted, 0.6) : "transparent",
							borderRadius: 999,
							padding: 6,
						})}
						accessibilityRole="button"
						accessibilityLabel="Close message actions"
					>
						<Text style={[typography.micro, { color: colors.mutedForeground }]}>Done</Text>
					</Pressable>
				</View>

				<View
					className="rounded-2xl border overflow-hidden"
					style={{ borderColor: withOpacity(colors.border, 0.9), backgroundColor: withOpacity(colors.card, 0.9) }}
				>
					<Pressable
						onPress={handleCopy}
						className="flex-row items-center gap-3 px-4"
						style={({ pressed }) => ({
							height: ACTION_HEIGHT,
							backgroundColor: pressed ? withOpacity(colors.muted, 0.9) : "transparent",
						})}
						accessibilityRole="button"
						accessibilityLabel="Copy message"
					>
						<CopyIcon size={MenuPositioning.iconSize} color={colors.mutedForeground} />
						<Text style={[typography.uiLabel, { color: colors.foreground }]}>Copy</Text>
					</Pressable>

					{onRevert && (
						<View
							className="h-px"
							style={{ backgroundColor: withOpacity(colors.border, 0.9) }}
						/>
					)}

					{onRevert && (
						<Pressable
							onPress={handleRevert}
							className="flex-row items-center gap-3 px-4"
							style={({ pressed }) => ({
								height: ACTION_HEIGHT,
								backgroundColor: pressed ? withOpacity(colors.muted, 0.9) : "transparent",
							})}
							accessibilityRole="button"
							accessibilityLabel="Revert message"
						>
							<UndoIcon size={MenuPositioning.iconSize} color={colors.mutedForeground} />
							<Text style={[typography.uiLabel, { color: colors.foreground }]}>Revert</Text>
						</Pressable>
					)}

					{onBranchSession && (
						<View
							className="h-px"
							style={{ backgroundColor: withOpacity(colors.border, 0.9) }}
						/>
					)}

					{onBranchSession && (
						<Pressable
							onPress={handleBranch}
							className="flex-row items-center gap-3 px-4"
							style={({ pressed }) => ({
								height: ACTION_HEIGHT,
								backgroundColor: pressed ? withOpacity(colors.muted, 0.9) : "transparent",
							})}
							accessibilityRole="button"
							accessibilityLabel="Fork session"
						>
							<GitForkIcon size={MenuPositioning.iconSize} color={colors.mutedForeground} />
							<Text style={[typography.uiLabel, { color: colors.foreground }]}>Fork</Text>
						</Pressable>
					)}
				</View>
			</View>
		</Sheet>
	);
}
