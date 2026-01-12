import type BottomSheet from "@gorhom/bottom-sheet";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import {
	CopyIcon,
	FolderIcon,
	LinkOffIcon,
	PencilIcon,
	ShareIcon,
	TrashIcon,
} from "@/components/icons";
import { Sheet } from "@/components/ui/sheet";
import { typography, useTheme } from "@/theme";

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
}: SessionActionsMenuProps) {
	const { colors } = useTheme();
	const sheetRef = useRef<BottomSheet>(null);
	const snapPoints = useMemo(() => ["58%"], []);

	useEffect(() => {
		if (visible) {
			sheetRef.current?.snapToIndex(0);
		} else {
			sheetRef.current?.close();
		}
	}, [visible]);

	const handleRename = async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onRename();
		sheetRef.current?.close();
	};

	const handleShare = async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onShare?.();
		sheetRef.current?.close();
	};

	const handleCopyLink = async () => {
		if (shareUrl) {
			await Clipboard.setStringAsync(shareUrl);
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		}
		onCopyLink?.();
		sheetRef.current?.close();
	};

	const handleUnshare = async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onUnshare?.();
		sheetRef.current?.close();
	};

	const handleCopyWorktreePath = async () => {
		if (worktreePath) {
			await Clipboard.setStringAsync(worktreePath);
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		}
		sheetRef.current?.close();
	};

	const handleDelete = async () => {
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
		onDelete();
		sheetRef.current?.close();
	};

	const actions = [
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
	];

	return (
		<Sheet ref={sheetRef} snapPoints={snapPoints} onClose={onClose} contentPadding={0}>
			<View className="pb-2">
				<View className="px-4 pt-2 pb-1">
					<Text style={[typography.uiHeader, { color: colors.foreground }]}>Session actions</Text>
				</View>
				<View className="border-t" style={{ borderTopColor: colors.border }} />
				{actions.map((action, index) => (
					<View key={action.key}>
						<Pressable
							onPress={action.onPress}
							className="flex-row items-center gap-3 px-4 py-3"
							style={({ pressed }) => ({
								backgroundColor: pressed ? colors.muted : "transparent",
							})}
							accessibilityRole="menuitem"
						>
							<action.icon size={18} color={action.destructive ? colors.destructive : colors.mutedForeground} />
							<Text
								style={[
									typography.uiLabel,
									{ color: action.destructive ? colors.destructive : colors.foreground },
								]}
							>
								{action.label}
							</Text>
						</Pressable>
						{index < actions.length - 1 && (
							<View className="h-px" style={{ backgroundColor: colors.border }} />
						)}
					</View>
				))}
			</View>
		</Sheet>
	);
}
