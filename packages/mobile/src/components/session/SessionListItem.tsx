import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Animated,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import type { Session } from "@/api/sessions";
import {
	CheckIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	CloudIcon,
	CloudOffIcon,
	MoreVerticalIcon,
	ShareIcon,
	WarningIcon,
	XIcon,
} from "@/components/icons";
import { typography, useTheme } from "@/theme";
import { SessionActionsMenu } from "./SessionActionsMenu";

export interface SessionCacheInfo {
	isCached: boolean;
	messageCount: number;
	lastSynced: Date | null;
}

interface SessionListItemProps {
	session: Session;
	isSelected: boolean;
	isStreaming?: boolean;
	depth?: number;
	childCount?: number;
	isExpanded?: boolean;
	isMissingDirectory?: boolean;
	cacheInfo?: SessionCacheInfo;
	isOffline?: boolean;
	onSelect: () => void;
	onToggleExpand?: () => void;
	onRename: (title: string) => Promise<void>;
	onShare: () => Promise<void>;
	onUnshare: () => Promise<void>;
	onCopyLink: () => void;
	onDelete: () => Promise<void>;
}

function formatDateLabel(value: number | string | undefined): string {
	if (!value) return "";
	const date = new Date(value);
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const sessionDate = new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
	);
	const diffDays = Math.floor(
		(today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24),
	);

	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Yesterday";
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}

export function SessionListItem({
	session,
	isSelected,
	isStreaming = false,
	depth = 0,
	childCount = 0,
	isExpanded = false,
	isMissingDirectory = false,
	cacheInfo,
	isOffline = false,
	onSelect,
	onToggleExpand,
	onRename,
	onShare,
	onUnshare,
	onCopyLink,
	onDelete,
}: SessionListItemProps) {
	const { colors, isDark } = useTheme();
	const [showMenu, setShowMenu] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editTitle, setEditTitle] = useState("");
	const animatedOpacity = useRef(new Animated.Value(1)).current;

	// Streaming pulse animation - matches desktop 1.8s duration
	useEffect(() => {
		if (isStreaming) {
			const animation = Animated.loop(
				Animated.sequence([
					Animated.timing(animatedOpacity, {
						toValue: 0.5,
						duration: 900, // 900ms * 2 = 1.8s full cycle
						useNativeDriver: true,
					}),
					Animated.timing(animatedOpacity, {
						toValue: 1,
						duration: 900,
						useNativeDriver: true,
					}),
				]),
			);
			animation.start();
			return () => animation.stop();
		}
		animatedOpacity.setValue(1);
	}, [isStreaming, animatedOpacity]);

	const handleSelect = useCallback(async () => {
		if (isMissingDirectory) return;
		await Haptics.selectionAsync();
		onSelect();
	}, [isMissingDirectory, onSelect]);

	const handleOpenMenu = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setShowMenu(true);
	}, []);

	const handleStartEdit = useCallback(() => {
		setEditTitle(session.title || `Session ${session.id.slice(0, 8)}`);
		setIsEditing(true);
	}, [session.title, session.id]);

	const handleSaveEdit = useCallback(async () => {
		if (editTitle.trim()) {
			await onRename(editTitle.trim());
		}
		setIsEditing(false);
		setEditTitle("");
	}, [editTitle, onRename]);

	const handleCancelEdit = useCallback(() => {
		setIsEditing(false);
		setEditTitle("");
	}, []);

	const handleToggleExpand = useCallback(async () => {
		await Haptics.selectionAsync();
		onToggleExpand?.();
	}, [onToggleExpand]);

	const sessionTitle = session.title || `Session ${session.id.slice(0, 8)}`;
	const timestamp = session.time?.created || session.createdAt;
	const hasChildren = childCount > 0;
	const isShared = !!session.share?.url;
	const additions = session.summary?.additions;
	const deletions = session.summary?.deletions;
	const hasGitStats =
		typeof additions === "number" || typeof deletions === "number";

	// Editing mode
	if (isEditing) {
		return (
			<View
				style={[
					styles.container,
					{
						paddingLeft: 6 + depth * 20,
						backgroundColor: isDark
							? `${colors.accent}CC` // 80% opacity - matches dark:bg-accent/80
							: `${colors.primary}1F`, // 12% opacity - matches bg-primary/12
					},
				]}
			>
				<View style={styles.editContainer}>
					<TextInput
						value={editTitle}
						onChangeText={setEditTitle}
						style={[
							typography.uiLabel,
							styles.editInput,
							{ color: colors.foreground },
						]}
						autoFocus
						placeholder="Rename session"
						placeholderTextColor={colors.mutedForeground}
						onSubmitEditing={handleSaveEdit}
					/>
					<Pressable
						onPress={handleSaveEdit}
						style={styles.editButton}
						hitSlop={8}
					>
						<CheckIcon color={colors.foreground} size={16} />
					</Pressable>
					<Pressable
						onPress={handleCancelEdit}
						style={styles.editButton}
						hitSlop={8}
					>
						<XIcon color={colors.mutedForeground} size={16} />
					</Pressable>
				</View>
			</View>
		);
	}

	return (
		<>
			<Pressable
				onPress={handleSelect}
				disabled={isMissingDirectory}
				style={({ pressed }) => [
					styles.container,
					{
						paddingLeft: 6 + depth * 20,
						backgroundColor: isSelected
							? isDark
								? `${colors.accent}CC` // 80% opacity - matches dark:bg-accent/80
								: `${colors.primary}1F` // 12% opacity - matches bg-primary/12
							: pressed
								? isDark
									? `${colors.accent}66` // 40% opacity - matches dark:bg-accent/40
									: `${colors.primary}0F` // 6% opacity - matches bg-primary/6
								: "transparent",
						opacity: isMissingDirectory ? 0.75 : 1,
					},
				]}
			>
				<View style={styles.content}>
					{/* Title row */}
					<Animated.Text
						style={[
							typography.uiLabel,
							styles.title,
							{
								color: colors.foreground,
								fontWeight: isSelected ? "600" : "400",
								opacity: isStreaming ? animatedOpacity : 1,
							},
						]}
						numberOfLines={1}
					>
						{sessionTitle}
					</Animated.Text>

					{/* Meta row - matches desktop typography-micro text-muted-foreground/60 */}
					<View style={styles.metaRow}>
						{/* Expand/collapse for children */}
						{hasChildren && (
							<Pressable
								onPress={handleToggleExpand}
								style={styles.expandButton}
								hitSlop={4}
							>
								{isExpanded ? (
									<ChevronDownIcon
										color={`${colors.mutedForeground}99`} // 60% opacity
										size={12}
									/>
								) : (
									<ChevronRightIcon
										color={`${colors.mutedForeground}99`} // 60% opacity
										size={12}
									/>
								)}
							</Pressable>
						)}

						{/* Date */}
						<Text style={[typography.micro, { color: `${colors.mutedForeground}99` }]}>
							{formatDateLabel(timestamp)}
						</Text>

						{/* Share indicator */}
						{isShared && (
							<ShareIcon color={colors.info} size={12} />
						)}

						{/* Git diff stats */}
						{hasGitStats && ((additions ?? 0) !== 0 || (deletions ?? 0) !== 0) && (
							<View style={styles.gitStats}>
								<Text
									style={[
										styles.gitStatText,
										{ color: colors.success },
									]}
								>
									+{Math.max(0, additions ?? 0)}
								</Text>
								<Text
									style={[
										styles.gitStatDivider,
										{ color: colors.mutedForeground },
									]}
								>
									/
								</Text>
								<Text
									style={[
										styles.gitStatText,
										{ color: colors.destructive },
									]}
								>
									-{Math.max(0, deletions ?? 0)}
								</Text>
							</View>
						)}

						{/* Child count */}
						{hasChildren && (
							<Text
								style={[typography.micro, { color: `${colors.mutedForeground}99` }]}
							>
								{childCount} {childCount === 1 ? "task" : "tasks"}
							</Text>
						)}

						{(isOffline || cacheInfo?.isCached) && (
							<View style={styles.cacheIndicator}>
								{isOffline ? (
									<CloudOffIcon color={colors.warning} size={11} />
								) : (
									<CloudIcon color={colors.success} size={11} />
								)}
							</View>
						)}

						{/* Missing directory warning */}
						{isMissingDirectory && (
							<View style={styles.warningBadge}>
								<WarningIcon color={colors.warning} size={12} />
								<Text
									style={[
										typography.micro,
										{ color: colors.warning },
									]}
								>
									Missing
								</Text>
							</View>
						)}
					</View>
				</View>

				{/* Actions button */}
				<Pressable
					onPress={handleOpenMenu}
					style={styles.menuButton}
					hitSlop={8}
				>
					<MoreVerticalIcon color={colors.mutedForeground} size={18} />
				</Pressable>

				{/* Selection indicator - orange bar on right edge */}
				{isSelected && (
					<View
						style={[
							styles.selectionBar,
							{ backgroundColor: colors.primary },
						]}
					/>
				)}
			</Pressable>

			<SessionActionsMenu
				visible={showMenu}
				onClose={() => setShowMenu(false)}
				onRename={handleStartEdit}
				onShare={onShare}
				onCopyLink={onCopyLink}
				onUnshare={onUnshare}
				onDelete={onDelete}
				isShared={isShared}
				shareUrl={session.share?.url}
			/>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		paddingLeft: 6, // matches desktop px-1.5
		paddingRight: 6,
		paddingVertical: 4, // matches desktop py-1
		borderRadius: 6, // matches desktop rounded-md
		marginBottom: 2,
		position: "relative",
	},
	content: {
		flex: 1,
		minWidth: 0,
	},
	title: {
		marginBottom: 1,
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8, // matches desktop gap-2
		flexWrap: "wrap",
	},
	expandButton: {
		padding: 2,
	},
	gitStats: {
		flexDirection: "row",
		alignItems: "center",
	},
	gitStatText: {
		fontSize: 11, // matches desktop text-[0.7rem]
		fontWeight: "500",
		lineHeight: 11, // matches desktop leading-none
	},
	gitStatDivider: {
		fontSize: 11,
		opacity: 0.5,
		marginHorizontal: 1,
	},
	warningBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
	},
	cacheIndicator: {
		flexDirection: "row",
		alignItems: "center",
	},
	menuButton: {
		padding: 6,
		marginLeft: 4,
	},
	editContainer: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
		gap: 8,
	},
	editInput: {
		flex: 1,
		paddingVertical: 4,
	},
	editButton: {
		padding: 4,
	},
	selectionBar: {
		position: "absolute",
		right: 0,
		top: 4,
		bottom: 4,
		width: 2,
		borderRadius: 1,
	},
});
