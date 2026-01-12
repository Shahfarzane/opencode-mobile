import { impactAsync, selectionAsync, ImpactFeedbackStyle } from "expo-haptics";
import { useCallback } from "react";
import { Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { PlusIcon } from "@/components/icons";
import { FontSizes, Fonts, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";

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
	const { colors } = useTheme();

	const handleToggleCollapse = useCallback(async () => {
		await selectionAsync();
		onToggleCollapse();
	}, [onToggleCollapse]);

	const handleCreateSession = useCallback(async () => {
		await impactAsync(ImpactFeedbackStyle.Light);
		onCreateSession();
	}, [onCreateSession]);

	const handleToggleShowMore = useCallback(async () => {
		await selectionAsync();
		showMoreButton?.onToggle();
	}, [showMoreButton]);

	return (
		<View className="mb-1">
			<View
				className="flex-row items-center justify-between pt-1.5 pb-1 px-1 border-b"
				style={{ borderBottomColor: colors.border }}
			>
				<TouchableOpacity
					onPress={handleToggleCollapse}
					activeOpacity={0.7}
					className="flex-1"
					style={{ borderRadius: 4 }}
				>
					<Text
						style={[
							typography.micro,
							{
								color: withOpacity(colors.foreground, OPACITY.secondary),
								fontFamily: Fonts.medium,
							},
						]}
						numberOfLines={1}
					>
						{label}
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={handleCreateSession}
					activeOpacity={0.7}
					className="w-5 h-5 items-center justify-center rounded-md"
					hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
				>
					<PlusIcon color={withOpacity(colors.foreground, OPACITY.secondary)} size={18} />
				</TouchableOpacity>
			</View>

			{!isCollapsed && (
				<View className="pt-1 gap-2.5">
					{children}

					{showMoreButton &&
						(showMoreButton.remainingCount > 0 ||
							showMoreButton.isExpanded) && (
							<TouchableOpacity
								onPress={handleToggleShowMore}
								activeOpacity={0.7}
								className="py-0.5 px-1.5 mt-0.5"
							>
								<Text
									style={[
										typography.micro,
										{
									color: withOpacity(colors.foreground, OPACITY.secondary),
									fontSize: FontSizes.xs,
										},
									]}
								>
									{showMoreButton.isExpanded
										? "Show fewer sessions"
										: `Show ${showMoreButton.remainingCount} more ${showMoreButton.remainingCount === 1 ? "session" : "sessions"}`}
								</Text>
							</TouchableOpacity>
						)}

					{sessionCount === 0 && (
						<Text
							className="py-1 px-1"
							style={[
								typography.micro,
								{ color: withOpacity(colors.foreground, OPACITY.secondary) },
							]}
						>
							No sessions in this workspace yet.
						</Text>
					)}
				</View>
			)}
		</View>
	);
}
