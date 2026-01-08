import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import {
	type GitLog,
	type GitStatus,
	type GitStatusFile,
	gitApi,
} from "../../src/api";
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { typography, useTheme } from "../../src/theme";

type FileStatusType = "staged" | "modified" | "untracked";

function getFileStatus(file: GitStatusFile): FileStatusType {
	if (file.index === "A" || file.index === "M" || file.index === "D") {
		return "staged";
	}
	if (file.working_dir === "?" || file.index === "?") {
		return "untracked";
	}
	return "modified";
}

function Checkbox({ checked, color }: { checked: boolean; color: string }) {
	return (
		<View
			style={[
				styles.checkbox,
				{
					borderColor: checked ? color : `${color}40`,
					backgroundColor: checked ? color : "transparent",
				},
			]}
		>
			{checked && (
				<Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
					<Path
						d="M20 6L9 17l-5-5"
						stroke="white"
						strokeWidth={3}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</Svg>
			)}
		</View>
	);
}

function DiffStats({
	insertions,
	deletions,
}: {
	insertions: number;
	deletions: number;
}) {
	const { colors } = useTheme();

	if (insertions === 0 && deletions === 0) return null;

	return (
		<View style={styles.diffStats}>
			{insertions > 0 && (
				<Text
					style={[
						typography.micro,
						{ color: colors.success, fontWeight: "600" },
					]}
				>
					+{insertions}
				</Text>
			)}
			{deletions > 0 && (
				<Text
					style={[
						typography.micro,
						{ color: colors.destructive, fontWeight: "600" },
					]}
				>
					-{deletions}
				</Text>
			)}
		</View>
	);
}

// Icon components for header
function RefreshIcon({ color, size = 16 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

function PullIcon({ color, size = 16 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M12 4v16m0 0l-6-6m6 6l6-6"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

function PushIcon({ color, size = 16 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M12 20V4m0 0l-6 6m6-6l6 6"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

function BranchIcon({ color, size = 16 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
			<Path
				d="M18 9a9 9 0 0 1-9 9"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

function ChevronIcon({ color, size = 16, direction = "down" }: { color: string; size?: number; direction?: "up" | "down" }) {
	return (
		<Svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			style={{ transform: [{ rotate: direction === "up" ? "180deg" : "0deg" }] }}
		>
			<Path
				d="M6 9l6 6 6-6"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

function RevertIcon({ color, size = 16 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M3 3v5h5"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

function GitHeader({
	status,
	onRefresh,
	onPull,
	onPush,
	isPulling,
	isPushing,
	isRefreshing,
}: {
	status: GitStatus | null;
	onRefresh: () => void;
	onPull: () => void;
	onPush: () => void;
	isPulling: boolean;
	isPushing: boolean;
	isRefreshing: boolean;
}) {
	const { colors } = useTheme();

	const isBusy = isPulling || isPushing || isRefreshing;

	return (
		<View style={[styles.gitHeader, { borderBottomColor: colors.border }]}>
			{/* Branch selector */}
			<Pressable style={[styles.branchSelector, { backgroundColor: colors.card }]}>
				<BranchIcon color={colors.primary} size={14} />
				<Text
					style={[typography.uiLabel, { color: colors.foreground, fontWeight: "500" }]}
					numberOfLines={1}
				>
					{status?.current ?? "main"}
				</Text>
				<ChevronIcon color={colors.mutedForeground} size={14} />
			</Pressable>

			{/* Sync status - always show */}
			<View style={styles.syncIndicators}>
				<Text style={[typography.meta, { color: colors.success }]}>
					↑{status?.ahead ?? 0}
				</Text>
				<Text style={[typography.meta, { color: colors.destructive }]}>
					↓{status?.behind ?? 0}
				</Text>
			</View>

			{/* Action buttons */}
			<View style={styles.headerActions}>
				{/* Refresh */}
				<Pressable
					onPress={onRefresh}
					disabled={isBusy}
					style={[styles.headerIconButton, { opacity: isBusy ? 0.5 : 1 }]}
				>
					{isRefreshing ? (
						<ActivityIndicator size="small" color={colors.mutedForeground} />
					) : (
						<RefreshIcon color={colors.mutedForeground} size={18} />
					)}
				</Pressable>

				{/* Pull */}
				<Pressable
					onPress={onPull}
					disabled={isBusy || !status}
					style={[styles.headerIconButton, { opacity: isBusy || !status ? 0.5 : 1 }]}
				>
					{isPulling ? (
						<ActivityIndicator size="small" color={colors.mutedForeground} />
					) : (
						<PullIcon color={colors.mutedForeground} size={18} />
					)}
				</Pressable>

				{/* Push */}
				<Pressable
					onPress={onPush}
					disabled={isBusy || !status}
					style={[styles.headerIconButton, { opacity: isBusy || !status ? 0.5 : 1 }]}
				>
					{isPushing ? (
						<ActivityIndicator size="small" color={colors.mutedForeground} />
					) : (
						<PushIcon color={colors.mutedForeground} size={18} />
					)}
				</Pressable>
			</View>

			{/* Branch dropdown (placeholder for future) */}
			<Pressable style={[styles.branchDropdown, { backgroundColor: colors.card }]}>
				<BranchIcon color={colors.mutedForeground} size={14} />
				<ChevronIcon color={colors.mutedForeground} size={14} />
			</Pressable>
		</View>
	);
}

function FileItem({
	file,
	onPress,
	onRevert,
	isSelected,
	onToggleSelect,
	diffStats,
	showCheckbox = false,
	isReverting = false,
}: {
	file: GitStatusFile;
	onPress?: () => void;
	onRevert?: () => void;
	isSelected?: boolean;
	onToggleSelect?: () => void;
	diffStats?: { insertions: number; deletions: number };
	showCheckbox?: boolean;
	isReverting?: boolean;
}) {
	const { colors } = useTheme();
	const status = getFileStatus(file);

	const statusColors = {
		staged: colors.success,
		modified: colors.warning,
		untracked: colors.mutedForeground,
	};

	const statusIcons = {
		staged: file.index || "A",
		modified: file.working_dir || "M",
		untracked: "?",
	};

	// Can revert modified files (not untracked or already staged)
	const canRevert = status === "modified" && onRevert;

	return (
		<Pressable
			onPress={showCheckbox ? onToggleSelect : onPress}
			style={({ pressed }) => [
				styles.fileItem,
				pressed && { backgroundColor: colors.muted },
			]}
		>
			{showCheckbox && (
				<Checkbox checked={isSelected ?? false} color={colors.primary} />
			)}
			<View style={styles.statusIcon}>
				<Text
					style={[
						typography.uiLabel,
						{ color: statusColors[status], fontWeight: "700" },
					]}
				>
					{statusIcons[status]}
				</Text>
			</View>
			<Text
				style={[typography.meta, { color: colors.foreground, flex: 1 }]}
				numberOfLines={1}
			>
				{file.path}
			</Text>
			{diffStats && (
				<DiffStats
					insertions={diffStats.insertions}
					deletions={diffStats.deletions}
				/>
			)}
			{/* Revert button - show for all files, functional for modified */}
			<Pressable
				onPress={canRevert ? onRevert : undefined}
				disabled={!canRevert || isReverting}
				style={[
					styles.revertButton,
					{ opacity: canRevert && !isReverting ? 1 : 0.3 },
				]}
			>
				{isReverting ? (
					<ActivityIndicator size="small" color={colors.mutedForeground} />
				) : (
					<RevertIcon color={colors.mutedForeground} size={14} />
				)}
			</Pressable>
		</Pressable>
	);
}

function SectionHeader({ title, count }: { title: string; count: number }) {
	const { colors } = useTheme();

	return (
		<View style={[styles.sectionHeader, { backgroundColor: colors.muted }]}>
			<Text
				style={[
					typography.meta,
					{ color: colors.mutedForeground, fontWeight: "500" },
				]}
			>
				{title}
			</Text>
			<View style={[styles.countBadge, { backgroundColor: colors.card }]}>
				<Text style={[typography.micro, { color: colors.mutedForeground }]}>
					{count}
				</Text>
			</View>
		</View>
	);
}

function EmptyState({ message }: { message: string }) {
	const { colors } = useTheme();

	return (
		<View style={styles.emptyState}>
			<Text
				style={[
					typography.body,
					{ color: colors.mutedForeground, textAlign: "center" },
				]}
			>
				{message}
			</Text>
		</View>
	);
}

function HistorySection({
	history,
	isLoading,
	isExpanded,
	onToggle,
	onCopyHash,
}: {
	history: GitLog | null;
	isLoading: boolean;
	isExpanded: boolean;
	onToggle: () => void;
	onCopyHash: (hash: string) => void;
}) {
	const { colors } = useTheme();

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) return "Today";
		if (days === 1) return "Yesterday";
		if (days < 7) return `${days} days ago`;
		return date.toLocaleDateString();
	};

	return (
		<View style={[styles.historySection, { borderTopColor: colors.border }]}>
			<Pressable
				onPress={onToggle}
				style={[styles.historySectionHeader, { backgroundColor: colors.muted }]}
			>
				<View style={styles.historySectionTitle}>
					<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
						<Path
							d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
							stroke={colors.mutedForeground}
							strokeWidth={2}
							strokeLinecap="round"
						/>
					</Svg>
					<Text
						style={[
							typography.meta,
							{ color: colors.mutedForeground, fontWeight: "500" },
						]}
					>
						History
					</Text>
					{history && (
						<View style={[styles.countBadge, { backgroundColor: colors.card }]}>
							<Text
								style={[typography.micro, { color: colors.mutedForeground }]}
							>
								{history.total}
							</Text>
						</View>
					)}
				</View>
				<Svg
					width={16}
					height={16}
					viewBox="0 0 24 24"
					fill="none"
					style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}
				>
					<Path
						d="M6 9l6 6 6-6"
						stroke={colors.mutedForeground}
						strokeWidth={2}
						strokeLinecap="round"
					/>
				</Svg>
			</Pressable>

			{isExpanded && (
				<View style={styles.historyList}>
					{isLoading ? (
						<View style={styles.historyLoading}>
							<ActivityIndicator size="small" color={colors.primary} />
						</View>
					) : history && history.all.length > 0 ? (
						history.all.slice(0, 20).map((entry) => (
							<View key={entry.hash} style={styles.historyItem}>
								<View style={styles.historyItemContent}>
									<Text
										style={[typography.meta, { color: colors.foreground }]}
										numberOfLines={1}
									>
										{entry.message}
									</Text>
									<View style={styles.historyItemMeta}>
										<Text
											style={[
												typography.micro,
												{ color: colors.mutedForeground },
											]}
										>
											{entry.author_name}
										</Text>
										<Text
											style={[
												typography.micro,
												{ color: colors.mutedForeground },
											]}
										>
											•
										</Text>
										<Text
											style={[
												typography.micro,
												{ color: colors.mutedForeground },
											]}
										>
											{formatDate(entry.date)}
										</Text>
									</View>
								</View>
								<Pressable
									onPress={() => onCopyHash(entry.hash)}
									style={[styles.hashButton, { backgroundColor: colors.card }]}
								>
									<Text
										style={[
											typography.code,
											{ color: colors.mutedForeground, fontSize: 11 },
										]}
									>
										{entry.hash.slice(0, 7)}
									</Text>
								</Pressable>
							</View>
						))
					) : (
						<Text
							style={[
								typography.meta,
								{ color: colors.mutedForeground, padding: 16 },
							]}
						>
							No commits yet
						</Text>
					)}
				</View>
			)}
		</View>
	);
}

// AI sparkle icon for generate button
function SparkleIcon({ color, size = 16 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0l-1.414-1.414M7.05 7.05L5.636 5.636M12 8a4 4 0 100 8 4 4 0 000-8z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

function CommitSection({
	selectedCount,
	commitMessage,
	onCommitMessageChange,
	onGenerateMessage,
	isGeneratingMessage,
	onCommit,
	onCommitAndPush,
	isCommitting,
	isPushing,
}: {
	selectedCount: number;
	commitMessage: string;
	onCommitMessageChange: (value: string) => void;
	onGenerateMessage: () => void;
	isGeneratingMessage: boolean;
	onCommit: () => void;
	onCommitAndPush: () => void;
	isCommitting: boolean;
	isPushing: boolean;
}) {
	const { colors } = useTheme();
	const isBusy = isCommitting || isPushing || isGeneratingMessage;
	const hasSelectedFiles = selectedCount > 0;
	const canCommit = commitMessage.trim() && hasSelectedFiles && !isBusy;

	// Don't render if no files selected
	if (!hasSelectedFiles) return null;

	return (
		<View style={[styles.commitSection, { borderColor: colors.border, backgroundColor: colors.card }]}>
			{/* Header */}
			<View style={styles.commitSectionHeader}>
				<Text style={[typography.uiLabel, { color: colors.foreground, fontWeight: "600" }]}>
					Commit
				</Text>
				<Text style={[typography.meta, { color: colors.mutedForeground }]}>
					{selectedCount} {selectedCount === 1 ? "file" : "files"} selected
				</Text>
			</View>

			{/* Commit message input */}
			<TextInput
				value={commitMessage}
				onChangeText={onCommitMessageChange}
				placeholder="Commit message"
				placeholderTextColor={colors.mutedForeground}
				multiline
				style={[
					styles.commitInput,
					typography.body,
					{
						backgroundColor: colors.background,
						borderColor: colors.border,
						color: colors.foreground,
					},
				]}
				editable={!isBusy}
			/>

			{/* Action buttons */}
			<View style={styles.commitActions}>
				{/* AI Generate button */}
				<Pressable
					onPress={onGenerateMessage}
					disabled={!hasSelectedFiles || isGeneratingMessage}
					style={[
						styles.aiButton,
						{
							backgroundColor: colors.muted,
							opacity: !hasSelectedFiles || isGeneratingMessage ? 0.5 : 1,
						},
					]}
				>
					{isGeneratingMessage ? (
						<ActivityIndicator size="small" color={colors.foreground} />
					) : (
						<SparkleIcon color={colors.foreground} size={16} />
					)}
				</Pressable>

				<View style={{ flex: 1 }} />

				{/* Commit button */}
				<Pressable
					onPress={onCommit}
					disabled={!canCommit}
					style={[
						styles.commitButton,
						{
							backgroundColor: colors.card,
							borderColor: colors.border,
							opacity: canCommit ? 1 : 0.5,
						},
					]}
				>
					{isCommitting ? (
						<ActivityIndicator size="small" color={colors.foreground} />
					) : (
						<>
							<Text style={[typography.uiLabel, { color: colors.foreground }]}>→</Text>
							<Text style={[typography.uiLabel, { color: colors.foreground, fontWeight: "500" }]}>
								Commit
							</Text>
						</>
					)}
				</Pressable>

				{/* Commit & Push button */}
				<Pressable
					onPress={onCommitAndPush}
					disabled={!canCommit}
					style={[
						styles.commitPushButton,
						{
							backgroundColor: colors.primary,
							opacity: canCommit ? 1 : 0.5,
						},
					]}
				>
					{isPushing ? (
						<ActivityIndicator size="small" color={colors.primaryForeground} />
					) : (
						<>
							<Text style={[typography.uiLabel, { color: colors.primaryForeground }]}>↑</Text>
							<Text style={[typography.uiLabel, { color: colors.primaryForeground, fontWeight: "500" }]}>
								Commit & Push
							</Text>
						</>
					)}
				</Pressable>
			</View>
		</View>
	);
}

export default function GitScreen() {
	const { colors } = useTheme();
	const { isConnected, directory } = useConnectionStore();

	const [status, setStatus] = useState<GitStatus | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isCommitting, setIsCommitting] = useState(false);
	const [isPushing, setIsPushing] = useState(false);
	const [isPulling, setIsPulling] = useState(false);

	// Commit message state (for inline commit section)
	const [commitMessage, setCommitMessage] = useState("");
	const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);

	// Selection state for batch operations
	const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

	// Reverting files state
	const [revertingFiles, setRevertingFiles] = useState<Set<string>>(new Set());

	// History state
	const [history, setHistory] = useState<GitLog | null>(null);
	const [historyExpanded, setHistoryExpanded] = useState(false);
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);

	const loadStatus = useCallback(async () => {
		if (!isConnected) {
			setError("Not connected");
			setIsLoading(false);
			return;
		}

		try {
			setError(null);

			if (!directory) {
				setError("No directory selected");
				setIsLoading(false);
				return;
			}

			const isGit = await gitApi.checkIsGitRepository();
			if (!isGit) {
				setError("Not a git repository");
				setStatus(null);
				return;
			}

			const gitStatus = await gitApi.getStatus();
			setStatus(gitStatus);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to load git status",
			);
			setStatus(null);
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	}, [isConnected, directory]);

	useEffect(() => {
		loadStatus();
	}, [loadStatus]);

	// File categorization - computed before handlers that use them
	const stagedFiles =
		status?.files.filter((f) => getFileStatus(f) === "staged") ?? [];
	const modifiedFiles =
		status?.files.filter((f) => getFileStatus(f) === "modified") ?? [];
	const untrackedFiles =
		status?.files.filter((f) => getFileStatus(f) === "untracked") ?? [];

	const handleRefresh = useCallback(() => {
		setIsRefreshing(true);
		loadStatus();
	}, [loadStatus]);

	const handleGenerateMessage = async () => {
		const filesToUse = selectedFiles.size > 0
			? [...selectedFiles]
			: [...modifiedFiles, ...untrackedFiles].map(f => f.path);

		if (filesToUse.length === 0) return;

		setIsGeneratingMessage(true);
		try {
			const result = await gitApi.generateCommitMessage(filesToUse);
			if (result.message?.subject) {
				setCommitMessage(result.message.subject);
			}
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "Failed to generate commit message",
			);
		} finally {
			setIsGeneratingMessage(false);
		}
	};

	const handleCommit = async () => {
		if (!commitMessage.trim()) {
			Alert.alert("Error", "Please enter a commit message");
			return;
		}

		// Stage selected files first
		if (selectedFiles.size > 0) {
			try {
				for (const path of selectedFiles) {
					await gitApi.stageFile(path);
				}
			} catch (err) {
				Alert.alert(
					"Error",
					err instanceof Error ? err.message : "Failed to stage files",
				);
				return;
			}
		}

		setIsCommitting(true);
		try {
			await gitApi.commit(commitMessage.trim());
			setCommitMessage("");
			setSelectedFiles(new Set());
			await loadStatus();
			Alert.alert("Success", "Changes committed successfully");
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "Failed to commit",
			);
		} finally {
			setIsCommitting(false);
		}
	};

	const handleCommitAndPush = async () => {
		if (!commitMessage.trim()) {
			Alert.alert("Error", "Please enter a commit message");
			return;
		}

		// Stage selected files first
		if (selectedFiles.size > 0) {
			try {
				for (const path of selectedFiles) {
					await gitApi.stageFile(path);
				}
			} catch (err) {
				Alert.alert(
					"Error",
					err instanceof Error ? err.message : "Failed to stage files",
				);
				return;
			}
		}

		setIsCommitting(true);
		try {
			await gitApi.commit(commitMessage.trim());
			setCommitMessage("");
			setSelectedFiles(new Set());

			// Now push
			setIsCommitting(false);
			setIsPushing(true);
			await gitApi.push();
			await loadStatus();
			Alert.alert("Success", "Changes committed and pushed successfully");
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "Failed to commit and push",
			);
		} finally {
			setIsCommitting(false);
			setIsPushing(false);
		}
	};

	const handlePush = async () => {
		setIsPushing(true);
		try {
			await gitApi.push();
			await loadStatus();
			Alert.alert("Success", "Changes pushed successfully");
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "Failed to push",
			);
		} finally {
			setIsPushing(false);
		}
	};

	const handlePull = async () => {
		setIsPulling(true);
		try {
			await gitApi.pull();
			await loadStatus();
			Alert.alert("Success", "Changes pulled successfully");
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "Failed to pull",
			);
		} finally {
			setIsPulling(false);
		}
	};

	const handleUnstageFile = async (path: string) => {
		try {
			await gitApi.unstageFile(path);
			await loadStatus();
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "Failed to unstage file",
			);
		}
	};

	const handleRevertFile = async (path: string) => {
		Alert.alert(
			"Revert Changes",
			`Discard all changes to ${path.split("/").pop()}?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Revert",
					style: "destructive",
					onPress: async () => {
						setRevertingFiles(prev => new Set(prev).add(path));
						try {
							await gitApi.revertFile(path);
							await loadStatus();
						} catch (err) {
							Alert.alert(
								"Error",
								err instanceof Error ? err.message : "Failed to revert file",
							);
						} finally {
							setRevertingFiles(prev => {
								const next = new Set(prev);
								next.delete(path);
								return next;
							});
						}
					},
				},
			],
		);
	};

	// Selection handlers
	const handleToggleSelect = (path: string) => {
		setSelectedFiles((prev) => {
			const next = new Set(prev);
			if (next.has(path)) {
				next.delete(path);
			} else {
				next.add(path);
			}
			return next;
		});
	};

	const handleSelectAll = () => {
		const allPaths = [...modifiedFiles, ...untrackedFiles].map((f) => f.path);
		setSelectedFiles(new Set(allPaths));
	};

	const handleSelectNone = () => {
		setSelectedFiles(new Set());
	};

	// History handlers
	const loadHistory = useCallback(async () => {
		if (!isConnected || !directory) return;

		setIsLoadingHistory(true);
		try {
			const log = await gitApi.getLog(50);
			setHistory(log);
		} catch (err) {
			console.error("Failed to load history:", err);
		} finally {
			setIsLoadingHistory(false);
		}
	}, [isConnected, directory]);

	const handleToggleHistory = () => {
		const newExpanded = !historyExpanded;
		setHistoryExpanded(newExpanded);
		if (newExpanded && !history) {
			loadHistory();
		}
	};

	const handleCopyHash = async (hash: string) => {
		try {
			await Clipboard.setStringAsync(hash);
			Alert.alert(
				"Copied",
				`Commit hash ${hash.slice(0, 7)} copied to clipboard`,
			);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const renderContent = () => {
		if (isLoading) {
			return (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={colors.primary} />
				</View>
			);
		}

		if (error) {
			return <EmptyState message={error} />;
		}

		if (!status) {
			return <EmptyState message="No git status available" />;
		}

		if (status.isClean) {
			return <EmptyState message="Working tree clean" />;
		}

		const allUnstagedFiles = [...modifiedFiles, ...untrackedFiles];

		return (
			<ScrollView
				style={styles.scrollView}
				refreshControl={
					<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
				}
			>
				{stagedFiles.length > 0 && (
					<View style={[styles.changesSection, { borderColor: colors.border, backgroundColor: colors.card, marginBottom: 0 }]}>
						<SectionHeader title="Staged Changes" count={stagedFiles.length} />
						{stagedFiles.map((file) => (
							<FileItem
								key={file.path}
								file={file}
								onPress={() => handleUnstageFile(file.path)}
								diffStats={status?.diffStats?.[file.path]}
							/>
						))}
					</View>
				)}

				{allUnstagedFiles.length > 0 && (
					<View style={[styles.changesSection, { borderColor: colors.border, backgroundColor: colors.card }]}>
						<View style={styles.changesHeader}>
							<Text
								style={[
									typography.uiLabel,
									{ color: colors.foreground, fontWeight: "600" },
								]}
							>
								Changes
							</Text>
							<View style={styles.changesCountAndButtons}>
								<Text
									style={[
										typography.meta,
										{ color: colors.mutedForeground },
									]}
								>
									{selectedFiles.size}/{allUnstagedFiles.length}
								</Text>
								<Pressable
									onPress={handleSelectAll}
									style={[
										styles.selectionButton,
										{ backgroundColor: colors.muted },
									]}
								>
									<Text
										style={[
											typography.micro,
											{ color: colors.mutedForeground },
										]}
									>
										All
									</Text>
								</Pressable>
								<Pressable
									onPress={handleSelectNone}
									style={[
										styles.selectionButton,
										{ backgroundColor: colors.muted },
									]}
								>
									<Text
										style={[
											typography.micro,
											{ color: colors.mutedForeground },
										]}
									>
										None
									</Text>
								</Pressable>
							</View>
						</View>

						{allUnstagedFiles.map((file) => (
							<FileItem
								key={file.path}
								file={file}
								showCheckbox
								isSelected={selectedFiles.has(file.path)}
								onToggleSelect={() => handleToggleSelect(file.path)}
								onRevert={() => handleRevertFile(file.path)}
								isReverting={revertingFiles.has(file.path)}
								diffStats={status?.diffStats?.[file.path]}
							/>
						))}
					</View>
				)}

				{/* Inline Commit Section */}
				<CommitSection
					selectedCount={selectedFiles.size}
					commitMessage={commitMessage}
					onCommitMessageChange={setCommitMessage}
					onGenerateMessage={handleGenerateMessage}
					isGeneratingMessage={isGeneratingMessage}
					onCommit={handleCommit}
					onCommitAndPush={handleCommitAndPush}
					isCommitting={isCommitting}
					isPushing={isPushing}
				/>

				{/* History Section */}
				<HistorySection
					history={history}
					isLoading={isLoadingHistory}
					isExpanded={historyExpanded}
					onToggle={handleToggleHistory}
					onCopyHash={handleCopyHash}
				/>
			</ScrollView>
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* New GitHeader with branch, sync status, action buttons */}
			<GitHeader
				status={status}
				onRefresh={handleRefresh}
				onPull={handlePull}
				onPush={handlePush}
				isPulling={isPulling}
				isPushing={isPushing}
				isRefreshing={isRefreshing}
			/>

			{renderContent()}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	// GitHeader styles
	gitHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		borderBottomWidth: 1,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	branchSelector: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 8,
	},
	syncIndicators: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	headerActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
		marginLeft: "auto",
	},
	headerIconButton: {
		padding: 8,
		borderRadius: 8,
	},
	branchDropdown: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 8,
		paddingVertical: 6,
		borderRadius: 8,
	},
	// FileItem styles
	fileItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	statusIcon: {
		width: 24,
		alignItems: "center",
	},
	revertButton: {
		padding: 6,
		marginLeft: 4,
	},
	// Checkbox
	checkbox: {
		width: 20,
		height: 20,
		borderRadius: 4,
		borderWidth: 2,
		alignItems: "center",
		justifyContent: "center",
	},
	diffStats: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	// Changes section styles
	changesSection: {
		marginHorizontal: 12,
		marginTop: 12,
		borderRadius: 12,
		borderWidth: 1,
		overflow: "hidden",
	},
	changesHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	changesCountAndButtons: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	selectionButton: {
		borderRadius: 6,
		paddingHorizontal: 10,
		paddingVertical: 5,
	},
	// Commit section styles
	commitSection: {
		marginHorizontal: 12,
		marginTop: 12,
		borderRadius: 12,
		borderWidth: 1,
		padding: 12,
	},
	commitSectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 10,
	},
	commitInput: {
		minHeight: 60,
		borderRadius: 8,
		borderWidth: 1,
		padding: 10,
		textAlignVertical: "top",
		marginBottom: 10,
	},
	commitActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	aiButton: {
		padding: 10,
		borderRadius: 8,
	},
	commitButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
	},
	commitPushButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
	},
	// Staged section / section header
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	countBadge: {
		borderRadius: 12,
		paddingHorizontal: 8,
		paddingVertical: 2,
	},
	// Loading & empty state
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	scrollView: {
		flex: 1,
	},
	emptyState: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
		paddingVertical: 64,
	},
	// History section
	historySection: {
		borderTopWidth: 1,
		marginTop: 16,
	},
	historySectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	historySectionTitle: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	historyList: {
		paddingBottom: 16,
	},
	historyLoading: {
		padding: 16,
		alignItems: "center",
	},
	historyItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	historyItemContent: {
		flex: 1,
		marginRight: 8,
	},
	historyItemMeta: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginTop: 2,
	},
	hashButton: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
});
