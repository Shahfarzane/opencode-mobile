import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PlusIcon } from "@/components/icons";
import { typography, useTheme } from "@/theme";

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

	return (
		<View style={styles.container}>
			{/* Group Header */}
			<Pressable
				onPress={handleToggleCollapse}
				style={({ pressed }) => [
					styles.headerRow,
					{
						backgroundColor: pressed
							? isDark
								? "rgba(255,255,255,0.03)"
								: "rgba(0,0,0,0.02)"
							: "transparent",
						borderBottomColor: colors.border,
					},
				]}
			>
				<Text
					style={[
						typography.micro,
						styles.headerLabel,
						{ color: colors.mutedForeground },
					]}
					numberOfLines={1}
				>
					{label}
				</Text>

				<Pressable
					onPress={handleCreateSession}
					style={({ pressed }) => [
						styles.addButton,
						{
							backgroundColor: pressed
								? isDark
									? "rgba(255,255,255,0.1)"
									: "rgba(0,0,0,0.05)"
								: "transparent",
						},
					]}
					hitSlop={8}
				>
					<PlusIcon color={`${colors.mutedForeground}B3`} size={18} />
				</Pressable>
			</Pressable>

			{/* Sessions */}
			{!isCollapsed && (
				<View style={styles.sessionsContainer}>
					{children}

					{/* Show more/fewer button - matches desktop text-muted-foreground/70 */}
					{showMoreButton && (showMoreButton.remainingCount > 0 || showMoreButton.isExpanded) && (
						<Pressable
							onPress={handleToggleShowMore}
							style={styles.showMoreButton}
						>
							<Text
								style={[
									typography.micro,
									{ color: `${colors.mutedForeground}B3`, fontSize: 12 }, // 70% opacity, text-xs
								]}
							>
								{showMoreButton.isExpanded
									? "Show fewer sessions"
									: `Show ${showMoreButton.remainingCount} more ${showMoreButton.remainingCount === 1 ? "session" : "sessions"}`}
							</Text>
						</Pressable>
					)}

					{/* Empty state */}
					{sessionCount === 0 && (
						<Text
							style={[
								typography.micro,
								styles.emptyText,
								{ color: colors.mutedForeground },
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

const styles = StyleSheet.create({
	container: {
		marginBottom: 4,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingTop: 6,
		paddingBottom: 4,
		paddingHorizontal: 4,
		borderBottomWidth: 1,
	},
	headerLabel: {
		fontWeight: "500",
		flex: 1,
	},
	addButton: {
		width: 20, // matches desktop h-5 w-5
		height: 20,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 6,
	},
	sessionsContainer: {
		paddingTop: 4,
		gap: 10,
	},
	showMoreButton: {
		paddingVertical: 2,
		paddingHorizontal: 6,
		marginTop: 2,
	},
	emptyText: {
		paddingVertical: 4,
		paddingHorizontal: 4,
	},
});
