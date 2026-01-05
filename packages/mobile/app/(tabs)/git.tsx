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
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

function FileItem({
	file,
	onPress,
	onLongPress,
	actionLabel,
	isSelected,
	onToggleSelect,
	diffStats,
	showCheckbox = false,
}: {
	file: GitStatusFile;
	onPress?: () => void;
	onLongPress?: () => void;
	actionLabel?: string;
	isSelected?: boolean;
	onToggleSelect?: () => void;
	diffStats?: { insertions: number; deletions: number };
	showCheckbox?: boolean;
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

	return (
		<Pressable
			onPress={showCheckbox ? onToggleSelect : onPress}
			onLongPress={onLongPress}
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
			{actionLabel && !showCheckbox && (
				<Pressable
					onPress={onLongPress}
					style={[styles.actionButton, { backgroundColor: colors.muted }]}
				>
					<Text style={[typography.micro, { color: colors.mutedForeground }]}>
						{actionLabel}
					</Text>
				</Pressable>
			)}
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

function CommitSheet({
	visible,
	onClose,
	onCommit,
	isCommitting,
	stagedFiles,
}: {
	visible: boolean;
	onClose: () => void;
	onCommit: (message: string) => void;
	isCommitting: boolean;
	stagedFiles: GitStatusFile[];
}) {
	const { colors } = useTheme();
	const [message, setMessage] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);

	const generateMessage = async () => {
		if (stagedFiles.length === 0) return;

		setIsGenerating(true);
		try {
			const result = await gitApi.generateCommitMessage(
				stagedFiles.map((f) => f.path),
			);
			if (result.message?.subject) {
				setMessage(result.message.subject);
			}
		} catch (err) {
			const errorMsg =
				err instanceof Error
					? err.message
					: "Failed to generate commit message";
			Alert.alert("Error", errorMsg);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleCommit = () => {
		if (!message.trim()) {
			Alert.alert("Error", "Please enter a commit message");
			return;
		}
		onCommit(message.trim());
		setMessage("");
	};

	if (!visible) return null;

	return (
		<View style={styles.sheetOverlay}>
			<Pressable style={styles.sheetBackdrop} onPress={onClose} />
			<View
				style={[styles.sheetContent, { backgroundColor: colors.background }]}
			>
				<View style={styles.sheetHeader}>
					<Text style={[typography.uiHeader, { color: colors.foreground }]}>
						Commit Changes
					</Text>
					<Pressable onPress={onClose}>
						<Text
							style={[typography.uiLabel, { color: colors.mutedForeground }]}
						>
							Cancel
						</Text>
					</Pressable>
				</View>

				<TextInput
					value={message}
					onChangeText={setMessage}
					placeholder="Commit message..."
					placeholderTextColor={colors.mutedForeground}
					multiline
					numberOfLines={4}
					style={[
						styles.messageInput,
						typography.body,
						{
							backgroundColor: colors.input,
							borderColor: colors.border,
							color: colors.foreground,
						},
					]}
					editable={!isCommitting}
				/>

				<View style={styles.sheetActions}>
					<Pressable
						onPress={generateMessage}
						disabled={isGenerating || stagedFiles.length === 0}
						style={[
							styles.sheetButton,
							{
								backgroundColor: colors.card,
								borderColor: colors.border,
								opacity: isGenerating || stagedFiles.length === 0 ? 0.5 : 1,
							},
						]}
					>
						{isGenerating ? (
							<ActivityIndicator size="small" color={colors.foreground} />
						) : (
							<Text
								style={[
									typography.uiLabel,
									{ color: colors.foreground, fontWeight: "500" },
								]}
							>
								Generate
							</Text>
						)}
					</Pressable>

					<Pressable
						onPress={handleCommit}
						disabled={isCommitting || !message.trim()}
						style={[
							styles.sheetButton,
							{
								backgroundColor: colors.primary,
								opacity: isCommitting || !message.trim() ? 0.5 : 1,
							},
						]}
					>
						{isCommitting ? (
							<ActivityIndicator
								size="small"
								color={colors.primaryForeground}
							/>
						) : (
							<Text
								style={[
									typography.uiLabel,
									{ color: colors.primaryForeground, fontWeight: "500" },
								]}
							>
								Commit
							</Text>
						)}
					</Pressable>
				</View>
			</View>
		</View>
	);
}

export default function GitScreen() {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	const { isConnected, directory } = useConnectionStore();

	const [status, setStatus] = useState<GitStatus | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showCommitSheet, setShowCommitSheet] = useState(false);
	const [isCommitting, setIsCommitting] = useState(false);
	const [isPushing, setIsPushing] = useState(false);
	const [isPulling, setIsPulling] = useState(false);

	// Selection state for batch operations
	const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

	// History state
	const [history, setHistory] = useState<GitLog | null>(null);
	const [historyExpanded, setHistoryExpanded] = useState(false);
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);

	const loadStatus = useCallback(async () => {
		if (!isConnected || !directory) {
			setError("Not connected or no directory selected");
			setIsLoading(false);
			return;
		}

		try {
			setError(null);
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

	const handleCommit = async (message: string) => {
		setIsCommitting(true);
		try {
			await gitApi.commit(message);
			setShowCommitSheet(false);
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

	const handleStageFile = async (path: string) => {
		try {
			await gitApi.stageFile(path);
			await loadStatus();
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "Failed to stage file",
			);
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
						try {
							await gitApi.revertFile(path);
							await loadStatus();
						} catch (err) {
							Alert.alert(
								"Error",
								err instanceof Error ? err.message : "Failed to revert file",
							);
						}
					},
				},
			],
		);
	};

	const handleStageAll = async () => {
		try {
			const filesToStage = [...modifiedFiles, ...untrackedFiles];
			for (const file of filesToStage) {
				await gitApi.stageFile(file.path);
			}
			await loadStatus();
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "Failed to stage files",
			);
		}
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

	const handleStageSelected = async () => {
		if (selectedFiles.size === 0) return;
		try {
			for (const path of selectedFiles) {
				await gitApi.stageFile(path);
			}
			setSelectedFiles(new Set());
			await loadStatus();
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "Failed to stage files",
			);
		}
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

	// Commit & Push handler
	const handleCommitAndPush = async (message: string) => {
		setIsCommitting(true);
		try {
			await gitApi.commit(message);
			await gitApi.push();
			setShowCommitSheet(false);
			await loadStatus();
			Alert.alert("Success", "Changes committed and pushed successfully");
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "Failed to commit and push",
			);
		} finally {
			setIsCommitting(false);
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
					<View>
						<SectionHeader title="Staged Changes" count={stagedFiles.length} />
						{stagedFiles.map((file) => (
							<FileItem
								key={file.path}
								file={file}
								onLongPress={() => handleUnstageFile(file.path)}
								actionLabel="Unstage"
								diffStats={status?.diffStats?.[file.path]}
							/>
						))}
					</View>
				)}

				{allUnstagedFiles.length > 0 && (
					<View>
						<View
							style={[styles.changesHeader, { backgroundColor: colors.muted }]}
						>
							<Text
								style={[
									typography.meta,
									{ color: colors.mutedForeground, fontWeight: "500" },
								]}
							>
								Changes ({allUnstagedFiles.length})
							</Text>
							<View style={styles.selectionButtons}>
								<Pressable
									onPress={handleSelectAll}
									style={[
										styles.selectionButton,
										{ backgroundColor: colors.card },
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
										{ backgroundColor: colors.card },
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
								{selectedFiles.size > 0 && (
									<Pressable
										onPress={handleStageSelected}
										style={[
											styles.stageAllButton,
											{ backgroundColor: colors.primary },
										]}
									>
										<Text
											style={[
												typography.micro,
												{ color: colors.primaryForeground },
											]}
										>
											Stage ({selectedFiles.size})
										</Text>
									</Pressable>
								)}
							</View>
						</View>

						{allUnstagedFiles.map((file) => (
							<FileItem
								key={file.path}
								file={file}
								showCheckbox
								isSelected={selectedFiles.has(file.path)}
								onToggleSelect={() => handleToggleSelect(file.path)}
								onLongPress={() =>
									getFileStatus(file) === "modified"
										? handleRevertFile(file.path)
										: undefined
								}
								diffStats={status?.diffStats?.[file.path]}
							/>
						))}
					</View>
				)}

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
		<View
			style={[
				styles.container,
				{ backgroundColor: colors.background },
			]}
		>
			{status && (
				<View style={[styles.branchBar, { borderBottomColor: colors.border }]}>
					<View style={styles.branchInfo}>
						<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
							<Path
								d="M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
								stroke={colors.primary}
								strokeWidth={2}
								strokeLinecap="round"
							/>
							<Path
								d="M18 9a9 9 0 0 1-9 9"
								stroke={colors.primary}
								strokeWidth={2}
								strokeLinecap="round"
							/>
						</Svg>
						<Text
							style={[
								typography.uiLabel,
								{ color: colors.foreground, fontWeight: "500" },
							]}
						>
							{status.current}
						</Text>
					</View>
					<View style={styles.syncStatus}>
						{status.ahead > 0 && (
							<Text style={[typography.meta, { color: colors.success }]}>
								↑{status.ahead}
							</Text>
						)}
						{status.behind > 0 && (
							<Text style={[typography.meta, { color: colors.destructive }]}>
								↓{status.behind}
							</Text>
						)}
					</View>
				</View>
			)}

			{renderContent()}

			<View
				style={[
					styles.footer,
					{ borderTopColor: colors.border, paddingBottom: insets.bottom + 16 },
				]}
			>
				<Pressable
					onPress={handlePull}
					disabled={isPulling || !status}
					style={[
						styles.footerButton,
						{
							backgroundColor: colors.card,
							borderColor: colors.border,
							opacity: isPulling || !status ? 0.5 : 1,
						},
					]}
				>
					{isPulling ? (
						<ActivityIndicator size="small" color={colors.foreground} />
					) : (
						<Text
							style={[
								typography.uiLabel,
								{ color: colors.foreground, fontWeight: "500" },
							]}
						>
							Pull
						</Text>
					)}
				</Pressable>
				<Pressable
					onPress={() => setShowCommitSheet(true)}
					disabled={stagedFiles.length === 0 && modifiedFiles.length === 0}
					style={[
						styles.footerButton,
						{
							backgroundColor: colors.primary,
							opacity:
								stagedFiles.length === 0 && modifiedFiles.length === 0
									? 0.5
									: 1,
						},
					]}
				>
					<Text
						style={[
							typography.uiLabel,
							{ color: colors.primaryForeground, fontWeight: "500" },
						]}
					>
						Commit
					</Text>
				</Pressable>
				<Pressable
					onPress={handlePush}
					disabled={isPushing || !status || status.ahead === 0}
					style={[
						styles.footerButton,
						{
							backgroundColor: colors.card,
							borderColor: colors.border,
							opacity: isPushing || !status || status.ahead === 0 ? 0.5 : 1,
						},
					]}
				>
					{isPushing ? (
						<ActivityIndicator size="small" color={colors.foreground} />
					) : (
						<Text
							style={[
								typography.uiLabel,
								{ color: colors.foreground, fontWeight: "500" },
							]}
						>
							Push
						</Text>
					)}
				</Pressable>
			</View>

			<CommitSheet
				visible={showCommitSheet}
				onClose={() => setShowCommitSheet(false)}
				onCommit={handleCommit}
				isCommitting={isCommitting}
				stagedFiles={stagedFiles}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	branchBar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderBottomWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 16,
	},
	branchInfo: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	syncStatus: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	scrollView: {
		flex: 1,
	},
	fileItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	statusIcon: {
		width: 24,
		alignItems: "center",
	},
	actionButton: {
		borderRadius: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
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
	changesHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	stageAllButton: {
		borderRadius: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	emptyState: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
		paddingVertical: 64,
	},
	footer: {
		flexDirection: "row",
		gap: 12,
		borderTopWidth: 1,
		paddingHorizontal: 16,
		paddingTop: 16,
	},
	footerButton: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 8,
		borderWidth: 1,
		paddingVertical: 12,
	},
	sheetOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.5)",
		zIndex: 500, // Below SessionSheet (1000) but above other content
		elevation: 500,
	},
	sheetBackdrop: {
		flex: 1,
	},
	sheetContent: {
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 16,
	},
	sheetHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	messageInput: {
		minHeight: 100,
		borderRadius: 8,
		borderWidth: 1,
		padding: 12,
		textAlignVertical: "top",
		marginBottom: 16,
	},
	sheetActions: {
		flexDirection: "row",
		gap: 12,
	},
	sheetButton: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "transparent",
		paddingVertical: 12,
	},
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
	selectionButtons: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	selectionButton: {
		borderRadius: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
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
