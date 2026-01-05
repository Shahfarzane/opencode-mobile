import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from "@/components/icons";
import { typography, useTheme } from "@/theme";

interface SessionGroupProps {
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

export function SessionGroup({
	groupId,
	label,
	sessionCount,
	isCollapsed,
	onToggleCollapse,
	onCreateSession,
	children,
	showMoreButton,
}: SessionGroupProps) {
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
			<View style={styles.headerRow}>
				<Pressable
					onPress={handleToggleCollapse}
					style={({ pressed }) => [
						styles.headerButton,
						{
							backgroundColor: pressed
								? isDark
									? "rgba(255,255,255,0.05)"
									: "rgba(0,0,0,0.03)"
								: "transparent",
						},
					]}
				>
					<View style={styles.headerContent}>
						{isCollapsed ? (
							<ChevronRightIcon color={colors.mutedForeground} size={14} />
						) : (
							<ChevronDownIcon color={colors.mutedForeground} size={14} />
						)}
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
						<Text
							style={[
								typography.micro,
								{ color: colors.mutedForeground, opacity: 0.7 },
							]}
						>
							{sessionCount}
						</Text>
					</View>
				</Pressable>

				{/* Create session button */}
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
					<PlusIcon color={colors.mutedForeground} size={16} />
				</Pressable>
			</View>

			{/* Sessions */}
			{!isCollapsed && (
				<View style={styles.sessionsContainer}>
					{children}

					{/* Show more/fewer button */}
					{showMoreButton && showMoreButton.remainingCount > 0 && (
						<Pressable
							onPress={handleToggleShowMore}
							style={styles.showMoreButton}
						>
							<Text
								style={[
									typography.micro,
									{ color: colors.mutedForeground },
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
		marginBottom: 8,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingBottom: 4,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(128, 128, 128, 0.2)",
	},
	headerButton: {
		flex: 1,
		paddingVertical: 6,
		paddingHorizontal: 4,
		borderRadius: 6,
	},
	headerContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	headerLabel: {
		fontWeight: "500",
		flex: 1,
	},
	addButton: {
		padding: 6,
		borderRadius: 6,
	},
	sessionsContainer: {
		paddingTop: 8,
	},
	showMoreButton: {
		paddingVertical: 8,
		paddingHorizontal: 4,
	},
	emptyText: {
		paddingVertical: 12,
		paddingHorizontal: 4,
	},
});
