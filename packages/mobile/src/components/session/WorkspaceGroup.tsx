import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import { PlusIcon } from "@/components/icons";
import { FontSizes, Fonts, typography, useTheme } from "@/theme";

interface WorkspaceGroupProps {
	groupId: string;
	label: string;
	sessionCount: number;
	isCollapsed: boolean;
	onToggleCollapse: () => void;
	onCreateSession: () => void;
	children: React.ReactNode;
	showMoreButton?: {
		remainingCount: number;
		isExpanded: boolean;
		onToggle: () => void;
	};
}

export function WorkspaceGroup({
	groupId: _groupId,
	label,
	sessionCount,
	isCollapsed,
	onToggleCollapse,
	onCreateSession,
	children,
	showMoreButton,
}: WorkspaceGroupProps) {
	const { colors, isDark } = useTheme();

	const handleToggleCollapse = useCallback(async () => {
		await Haptics.selectionAsync();
		onToggleCollapse();
	}, [onToggleCollapse]);

	const handleCreateSession = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onCreateSession();
	}, [onCreateSession]);

	const handleToggleShowMore = useCallback(async () => {
		await Haptics.selectionAsync();
		showMoreButton?.onToggle();
	}, [showMoreButton]);

	const getPressedBg = (pressed: boolean) =>
		pressed
			? isDark
				? "rgba(255,255,255,0.03)"
				: "rgba(0,0,0,0.02)"
			: "transparent";

	return (
		<View className="mb-1">
			<Pressable
				onPress={handleToggleCollapse}
				className="flex-row items-center justify-between pt-1.5 pb-1 px-1 border-b"
				style={({ pressed }) => ({
					backgroundColor: getPressedBg(pressed),
					borderBottomColor: colors.border,
				})}
			>
				<Text
					className="flex-1"
					style={[
						typography.micro,
						{ color: colors.mutedForeground, fontFamily: Fonts.medium },
					]}
					numberOfLines={1}
				>
					{label}
				</Text>

				<Pressable
					onPress={handleCreateSession}
					className="w-5 h-5 items-center justify-center rounded-md"
					style={({ pressed }) => ({
						backgroundColor: pressed
							? isDark
								? "rgba(255,255,255,0.1)"
								: "rgba(0,0,0,0.05)"
							: "transparent",
					})}
					hitSlop={8}
				>
					<PlusIcon color={`${colors.mutedForeground}B3`} size={18} />
				</Pressable>
			</Pressable>

			{!isCollapsed && (
				<View className="pt-1 gap-2.5">
					{children}

					{showMoreButton &&
						(showMoreButton.remainingCount > 0 ||
							showMoreButton.isExpanded) && (
							<Pressable
								onPress={handleToggleShowMore}
								className="py-0.5 px-1.5 mt-0.5"
							>
								<Text
									style={[
										typography.micro,
										{
											color: `${colors.mutedForeground}B3`,
											fontSize: FontSizes.xs,
										},
									]}
								>
									{showMoreButton.isExpanded
										? "Show fewer sessions"
										: `Show ${showMoreButton.remainingCount} more ${showMoreButton.remainingCount === 1 ? "session" : "sessions"}`}
								</Text>
							</Pressable>
						)}

					{sessionCount === 0 && (
						<Text
							className="py-1 px-1"
							style={[typography.micro, { color: colors.mutedForeground }]}
						>
							No sessions in this workspace yet.
						</Text>
					)}
				</View>
			)}
		</View>
	);
}
