import * as Haptics from "expo-haptics";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import {
	ArrowsMergeIcon,
	FolderIcon,
	GitBranchIcon,
} from "@/components/icons";
import { IconButton } from "@/components/ui";
import { fontStyle, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";

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
	const { colors } = useTheme();

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

	const getPressedBg = (pressed: boolean) =>
		pressed
			? withOpacity(colors.foreground, OPACITY.hover)
			: "transparent";

	return (
		<View className="flex-row items-center h-14 px-2">
			<Pressable
				onPress={handleChangeDirectory}
				className="flex-1 flex-row items-center gap-2 py-1 rounded-md"
				style={({ pressed }) => ({ backgroundColor: getPressedBg(pressed) })}
			>
				{({ pressed }) => (
					<>
						<View
							className="w-8 h-8 rounded-md items-center justify-center"
							style={{
								backgroundColor: withOpacity(colors.foreground, OPACITY.light),
							}}
						>
							<FolderIcon
								color={
									pressed
										? colors.foreground
										: withOpacity(colors.foreground, OPACITY.secondary)
								}
								size={18}
							/>
						</View>
						<Text
							className="flex-1"
							style={[
								typography.uiHeader,
								fontStyle("600"),
								{
									color: pressed
										? colors.foreground
										: withOpacity(colors.foreground, OPACITY.secondary),
								},
							]}
							numberOfLines={1}
						>
							{displayDirectory}
						</Text>
					</>
				)}
			</Pressable>

			{isGitRepo && (onOpenWorktreeManager || onOpenMultiRunLauncher) && (
				<View className="flex-row items-center">
					{onOpenWorktreeManager && (
						<IconButton
							icon={
								<GitBranchIcon
									color={withOpacity(colors.foreground, OPACITY.secondary)}
									size={18}
								/>
							}
							variant="ghost"
							size="icon-sm"
							onPress={handleOpenWorktreeManager}
							accessibilityLabel="Worktree manager"
						/>
					)}

					{onOpenMultiRunLauncher && (
						<IconButton
							icon={
								<ArrowsMergeIcon
									color={withOpacity(colors.foreground, OPACITY.secondary)}
									size={18}
								/>
							}
							variant="ghost"
							size="icon-sm"
							onPress={handleOpenMultiRunLauncher}
							accessibilityLabel="Multi-run launcher"
						/>
					)}
				</View>
			)}
		</View>
	);
}
