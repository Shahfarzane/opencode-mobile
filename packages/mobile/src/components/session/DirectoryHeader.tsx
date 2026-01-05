import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
	ArrowsMergeIcon,
	FolderIcon,
	GitBranchIcon,
} from "@/components/icons";
import { typography, useTheme } from "@/theme";

interface DirectoryHeaderProps {
	directory: string | null;
	isGitRepo?: boolean;
	onChangeDirectory?: () => void;
	onOpenWorktreeManager?: () => void;
	onOpenMultiRunLauncher?: () => void;
}

function formatDirectoryName(directory: string | null): string {
	if (!directory) return "/";
	// Get the last part of the path
	const parts = directory.replace(/\/$/, "").split("/");
	return parts[parts.length - 1] || "/";
}

export function DirectoryHeader({
	directory,
	isGitRepo = false,
	onChangeDirectory,
	onOpenWorktreeManager,
	onOpenMultiRunLauncher,
}: DirectoryHeaderProps) {
	const { colors, isDark } = useTheme();

	const handleChangeDirectory = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onChangeDirectory?.();
	}, [onChangeDirectory]);

	const handleOpenWorktreeManager = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onOpenWorktreeManager?.();
	}, [onOpenWorktreeManager]);

	const handleOpenMultiRunLauncher = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onOpenMultiRunLauncher?.();
	}, [onOpenMultiRunLauncher]);

	const displayDirectory = formatDirectoryName(directory);

	return (
		<View style={styles.container}>
			<Pressable
				onPress={handleChangeDirectory}
				style={({ pressed }) => [
					styles.directoryButton,
					{
						backgroundColor: pressed
							? isDark
								? "rgba(255,255,255,0.08)"
								: "rgba(0,0,0,0.05)"
							: "transparent",
					},
				]}
			>
				<View
					style={[
						styles.iconContainer,
						{
							backgroundColor: isDark
								? "rgba(255,255,255,0.1)"
								: "rgba(0,0,0,0.05)",
						},
					]}
				>
					<FolderIcon color={colors.mutedForeground} size={18} />
				</View>
				<Text
					style={[
						typography.uiLabel,
						styles.directoryText,
						{ color: colors.mutedForeground, fontWeight: "600" },
					]}
					numberOfLines={1}
				>
					{displayDirectory}
				</Text>
			</Pressable>

			{isGitRepo && (
				<View style={styles.gitButtons}>
					<Pressable
						onPress={handleOpenWorktreeManager}
						style={({ pressed }) => [
							styles.iconButton,
							{
								backgroundColor: pressed
									? isDark
										? "rgba(255,255,255,0.1)"
										: "rgba(0,0,0,0.05)"
									: "transparent",
							},
						]}
						hitSlop={4}
					>
						<GitBranchIcon color={colors.mutedForeground} size={18} />
					</Pressable>

					<Pressable
						onPress={handleOpenMultiRunLauncher}
						style={({ pressed }) => [
							styles.iconButton,
							{
								backgroundColor: pressed
									? isDark
										? "rgba(255,255,255,0.1)"
										: "rgba(0,0,0,0.05)"
									: "transparent",
							},
						]}
						hitSlop={4}
					>
						<ArrowsMergeIcon color={colors.mutedForeground} size={18} />
					</Pressable>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		height: 56,
		paddingHorizontal: 8,
		gap: 4,
	},
	directoryButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingVertical: 8,
		paddingHorizontal: 4,
		borderRadius: 8,
	},
	iconContainer: {
		width: 32,
		height: 32,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	directoryText: {
		flex: 1,
	},
	gitButtons: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
	},
	iconButton: {
		width: 36,
		height: 36,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
});
