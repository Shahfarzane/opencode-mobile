import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
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

	const getPressedBg = (pressed: boolean) =>
		pressed
			? isDark
				? "rgba(255,255,255,0.08)"
				: "rgba(0,0,0,0.05)"
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
								backgroundColor: isDark
									? "rgba(255,255,255,0.1)"
									: "rgba(0,0,0,0.05)",
							}}
						>
							<FolderIcon
								color={pressed ? colors.foreground : colors.mutedForeground}
								size={18}
							/>
						</View>
						<Text
							className="flex-1"
							style={[
								typography.uiHeader,
								fontStyle("600"),
								{ color: pressed ? colors.foreground : colors.mutedForeground },
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
						<Pressable
							onPress={handleOpenWorktreeManager}
							className="w-7 h-10 rounded-xl items-center justify-center"
							style={({ pressed }) => ({ backgroundColor: getPressedBg(pressed) })}
							hitSlop={4}
						>
							<GitBranchIcon color={colors.mutedForeground} size={18} />
						</Pressable>
					)}

					{onOpenMultiRunLauncher && (
						<Pressable
							onPress={handleOpenMultiRunLauncher}
							className="w-7 h-10 rounded-xl items-center justify-center"
							style={({ pressed }) => ({ backgroundColor: getPressedBg(pressed) })}
							hitSlop={4}
						>
							<ArrowsMergeIcon color={colors.mutedForeground} size={18} />
						</Pressable>
					)}
				</View>
			)}
		</View>
	);
}
