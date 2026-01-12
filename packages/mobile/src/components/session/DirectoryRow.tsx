import { impactAsync, ImpactFeedbackStyle } from "expo-haptics";
import { useCallback } from "react";
import { Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
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
		await impactAsync(ImpactFeedbackStyle.Light);
		onChangeDirectory?.();
	}, [onChangeDirectory]);

	const handleOpenWorktreeManager = useCallback(async () => {
		await impactAsync(ImpactFeedbackStyle.Light);
		onOpenWorktreeManager?.();
	}, [onOpenWorktreeManager]);

	const handleOpenMultiRunLauncher = useCallback(async () => {
		await impactAsync(ImpactFeedbackStyle.Light);
		onOpenMultiRunLauncher?.();
	}, [onOpenMultiRunLauncher]);

	const displayDirectory = formatDirectoryName(directory);

	return (
		<View className="flex-row items-center h-14 px-2">
			<TouchableOpacity
				onPress={handleChangeDirectory}
				activeOpacity={0.7}
				className="flex-1 flex-row items-center gap-2 py-1 rounded-md"
			>
				<View
					className="w-8 h-8 rounded-md items-center justify-center"
					style={{
						backgroundColor: withOpacity(colors.foreground, OPACITY.light),
					}}
				>
					<FolderIcon
						color={withOpacity(colors.foreground, OPACITY.secondary)}
						size={18}
					/>
				</View>
				<Text
					className="flex-1"
					style={[
						typography.uiHeader,
						fontStyle("600"),
						{
							color: withOpacity(colors.foreground, OPACITY.secondary),
						},
					]}
					numberOfLines={1}
				>
					{displayDirectory}
				</Text>
			</TouchableOpacity>

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
