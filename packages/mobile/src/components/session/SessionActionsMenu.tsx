import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import {
	CopyIcon,
	LinkOffIcon,
	PencilIcon,
	ShareIcon,
	TrashIcon,
} from "@/components/icons";
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
}: SessionActionsMenuProps) {
	const { colors, isDark } = useTheme();

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
			<Pressable style={styles.overlay} onPress={onClose}>
				<View
					style={[
						styles.menu,
						{
							backgroundColor: colors.card,
							borderColor: colors.border,
							shadowColor: isDark ? "#000" : "#666",
						},
					]}
				>
					{/* Rename */}
					<Pressable
						onPress={handleRename}
						style={({ pressed }) => [
							styles.menuItem,
							{ backgroundColor: pressed ? colors.muted : "transparent" },
						]}
					>
						<PencilIcon color={colors.foreground} size={18} />
						<Text style={[typography.uiLabel, { color: colors.foreground }]}>
							Rename
						</Text>
					</Pressable>

					<View style={[styles.divider, { backgroundColor: colors.border }]} />

					{/* Share section */}
					{!isShared ? (
						<Pressable
							onPress={handleShare}
							style={({ pressed }) => [
								styles.menuItem,
								{ backgroundColor: pressed ? colors.muted : "transparent" },
							]}
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
								style={({ pressed }) => [
									styles.menuItem,
									{ backgroundColor: pressed ? colors.muted : "transparent" },
								]}
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
								style={({ pressed }) => [
									styles.menuItem,
									{ backgroundColor: pressed ? colors.muted : "transparent" },
								]}
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

					<View style={[styles.divider, { backgroundColor: colors.border }]} />

					{/* Delete */}
					<Pressable
						onPress={handleDelete}
						style={({ pressed }) => [
							styles.menuItem,
							{ backgroundColor: pressed ? colors.muted : "transparent" },
						]}
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

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.4)",
		justifyContent: "center",
		alignItems: "center",
	},
	menu: {
		borderRadius: 12,
		borderWidth: 1,
		minWidth: 180,
		overflow: "hidden",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
	},
	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	divider: {
		height: 1,
	},
});
