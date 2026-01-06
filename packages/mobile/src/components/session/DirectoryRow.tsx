import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
	ArrowsMergeIcon,
	FolderIcon,
	GitBranchIcon,
} from "@/components/icons";
import { fontStyle, typography, useTheme } from "@/theme";

interface DirectoryRowProps {
	directory: string | null;
	isGitRepo?: boolean;
	onChangeDirectory?: () => void;
	onOpenWorktreeManager?: () => void;
	onOpenMultiRunLauncher?: () => void;
}

function formatDirectoryName(directory: string | null): string {
	if (!directory) return "/";
	const parts = directory.replace(/\/$/, "").split("/");
	return parts[parts.length - 1] || "/";
}

export function DirectoryRow({
	directory,
	isGitRepo = false,
	onChangeDirectory,
	onOpenWorktreeManager,
	onOpenMultiRunLauncher,
}: DirectoryRowProps) {
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
				{({ pressed }) => (
					<>
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
							<FolderIcon
								color={pressed ? colors.foreground : colors.mutedForeground}
								size={18}
							/>
						</View>
					<Text
						style={[
							typography.uiHeader,
							styles.directoryText,
							fontStyle("600"),
							{
								color: pressed ? colors.foreground : colors.mutedForeground,
							},
						]}
						numberOfLines={1}
					>
						{displayDirectory}
					</Text>
					</>
				)}
			</Pressable>

			{isGitRepo && (
				<View style={styles.actionButtons}>
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
		height: 56, // matches desktop h-14
		paddingHorizontal: 8, // matches desktop px-2
		gap: 0,
	},
	directoryButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingVertical: 4, // matches desktop py-1
		paddingHorizontal: 0, // matches desktop px-0
		borderRadius: 6,
	},
	iconContainer: {
		width: 32, // matches desktop h-8 w-8
		height: 32,
		borderRadius: 6,
		alignItems: "center",
		justifyContent: "center",
	},
	directoryText: {
		flex: 1,
	},
	actionButtons: {
		flexDirection: "row",
		alignItems: "center",
		gap: 0,
	},
	iconButton: {
		width: 28, // matches desktop w-7
		height: 40, // matches desktop h-10
		borderRadius: 12, // matches desktop rounded-xl
		alignItems: "center",
		justifyContent: "center",
	},
});
