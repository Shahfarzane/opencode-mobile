import * as Haptics from "expo-haptics";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { typography, useTheme } from "@/theme";

interface MessageActionsMenuProps {
	visible: boolean;
	onClose: () => void;
	onCopy: () => void;
	onBranchSession?: () => void;
	onRevert?: () => void;
	isAssistantMessage: boolean;
}

function CopyIcon({ color }: { color: string }) {
	return (
		<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
			<Path
				d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
			<Path
				d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

function BranchIcon({ color }: { color: string }) {
	return (
		<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
			<Path
				d="M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
			<Path
				d="M18 9c0 6-12 6-12 9"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

function RevertIcon({ color }: { color: string }) {
	return (
		<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
			<Path
				d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M3 3v5h5"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
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
					<Pressable
						onPress={handleCopy}
						style={({ pressed }) => [
							styles.menuItem,
							{ backgroundColor: pressed ? colors.muted : "transparent" },
						]}
					>
						<CopyIcon color={colors.foreground} />
						<Text style={[typography.uiLabel, { color: colors.foreground }]}>
							Copy Text
						</Text>
					</Pressable>

					{onRevert && (
						<>
							<View
								style={[styles.divider, { backgroundColor: colors.border }]}
							/>
							<Pressable
								onPress={handleRevert}
								style={({ pressed }) => [
									styles.menuItem,
									{ backgroundColor: pressed ? colors.muted : "transparent" },
								]}
							>
								<RevertIcon color={colors.foreground} />
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
							<View
								style={[styles.divider, { backgroundColor: colors.border }]}
							/>
							<Pressable
								onPress={handleBranch}
								style={({ pressed }) => [
									styles.menuItem,
									{ backgroundColor: pressed ? colors.muted : "transparent" },
								]}
							>
								<BranchIcon color={colors.foreground} />
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
