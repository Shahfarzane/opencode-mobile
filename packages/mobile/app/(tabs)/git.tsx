import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Modal,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { Button, IconButton, Input } from "@/components/ui";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	CheckIcon,
	ChevronDownIcon,
	ClockIcon,
	GitBranchIcon,
	PlusIcon,
	RefreshIcon,
	SparkleIcon,
	UndoIcon,
	XIcon,
} from "@/components/icons";
import {
	type GitBranch,
	type GitLog,
	type GitStatus,
	type GitStatusFile,
	gitApi,
} from "../../src/api";
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { FontSizes, typography, useTheme } from "../../src/theme";

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

function Checkbox({ checked, color, checkColor }: { checked: boolean; color: string; checkColor: string }) {
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
			{checked && <CheckIcon size={12} color={checkColor} />}
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


// Branch Selector Modal Component
function BranchSelectorModal({
	visible,
	onClose,
	currentBranch,
	localBranches,
	remoteBranches,
	onCheckout,
	onCreate,
	isCheckingOut,
	isCreating,
}: {
	visible: boolean;
	onClose: () => void;
	currentBranch: string | null | undefined;
	localBranches: string[];
	remoteBranches: string[];
	onCheckout: (branch: string) => void;
	onCreate: (name: string) => void;
	isCheckingOut: boolean;
	isCreating: boolean;
}) {
	const { colors } = useTheme();
	const [search, setSearch] = useState("");
	const [showCreate, setShowCreate] = useState(false);
	const [newBranchName, setNewBranchName] = useState("");

	const filteredLocal = localBranches.filter((b) =>
		b.toLowerCase().includes(search.toLowerCase())
	);
	const filteredRemote = remoteBranches.filter((b) =>
		b.toLowerCase().includes(search.toLowerCase())
	);

	const handleCheckout = (branch: string) => {
		if (branch === currentBranch) {
			onClose();
			return;
		}
		onCheckout(branch);
	};

	const handleCreate = () => {
		const sanitized = newBranchName
			.trim()
			.replace(/\s+/g, "-")
			.replace(/[^A-Za-z0-9._/-]/g, "-")
			.replace(/-+/g, "-")
			.replace(/^[-/]+/, "")
			.replace(/[-/]+$/, "");
		if (sanitized) {
			onCreate(sanitized);
			setNewBranchName("");
			setShowCreate(false);
		}
	};

	const handleClose = () => {
		setSearch("");
		setShowCreate(false);
		setNewBranchName("");
		onClose();
	};

	const renderBranchItem = ({ item, isRemote = false }: { item: string; isRemote?: boolean }) => (
		<Pressable
			onPress={() => handleCheckout(item)}
			disabled={isCheckingOut}
			style={({ pressed }) => [
				styles.branchItem,
				pressed && { backgroundColor: colors.muted },
				{ opacity: isCheckingOut ? 0.5 : 1 },
			]}
		>
			<GitBranchIcon size={14} color={isRemote ? colors.mutedForeground : colors.primary} />
			<Text
				style={[typography.uiLabel, { color: colors.foreground, flex: 1 }]}
				numberOfLines={1}
			>
				{item}
			</Text>
			{item === currentBranch && (
				<Text style={[typography.micro, { color: colors.primary }]}>Current</Text>
			)}
		</Pressable>
	);

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
			<Pressable style={styles.modalOverlay} onPress={handleClose}>
				<Pressable style={[styles.branchModal, { backgroundColor: colors.card }]} onPress={() => {}}>
					{/* Header */}
					<View style={[styles.branchModalHeader, { borderBottomColor: colors.border }]}>
						<Text style={[typography.uiLabel, { color: colors.foreground, fontWeight: "600" }]}>
							Switch Branch
						</Text>
						<IconButton
							icon={<XIcon size={18} color={colors.mutedForeground} />}
							variant="ghost"
							size="icon-sm"
							accessibilityLabel="Close"
							onPress={handleClose}
						/>
					</View>

					{/* Search */}
					<View style={styles.branchSearchContainer}>
						<TextInput
							style={[
								styles.branchSearchInput,
								{
									backgroundColor: colors.muted,
									color: colors.foreground,
									borderColor: colors.border,
								},
							]}
							placeholder="Search branches..."
							placeholderTextColor={colors.mutedForeground}
							value={search}
							onChangeText={setSearch}
						/>
					</View>

					{/* Create new branch */}
					{!showCreate ? (
						<Pressable
							onPress={() => setShowCreate(true)}
							style={({ pressed }) => [
								styles.createBranchButton,
								pressed && { backgroundColor: colors.muted },
							]}
						>
							<PlusIcon size={16} color={colors.primary} />
							<Text style={[typography.uiLabel, { color: colors.primary }]}>
								Create new branch...
							</Text>
						</Pressable>
					) : (
						<View style={[styles.createBranchForm, { borderColor: colors.border }]}>
							<TextInput
								style={[
									styles.createBranchInput,
									{
										backgroundColor: colors.muted,
										color: colors.foreground,
										borderColor: colors.border,
									},
								]}
								placeholder="New branch name"
								placeholderTextColor={colors.mutedForeground}
								value={newBranchName}
								onChangeText={setNewBranchName}
								autoFocus
								onSubmitEditing={handleCreate}
							/>
							<View style={styles.createBranchActions}>
								<IconButton
									icon={isCreating ? (
										<ActivityIndicator size="small" color={colors.primary} />
									) : (
										<PlusIcon size={16} color={colors.primary} />
									)}
									variant="ghost"
									size="icon-sm"
									accessibilityLabel="Create"
									onPress={handleCreate}
									disabled={!newBranchName.trim() || isCreating}
								/>
								<IconButton
									icon={<XIcon size={16} color={colors.mutedForeground} />}
									variant="ghost"
									size="icon-sm"
									accessibilityLabel="Cancel"
									onPress={() => {
										setShowCreate(false);
										setNewBranchName("");
									}}
									disabled={isCreating}
								/>
							</View>
						</View>
					)}

					{/* Branch lists */}
					<ScrollView style={styles.branchList}>
						{/* Local branches */}
						{filteredLocal.length > 0 && (
							<View>
								<Text
									style={[
										typography.micro,
										styles.branchListHeader,
										{ color: colors.mutedForeground, backgroundColor: colors.muted },
									]}
								>
									LOCAL BRANCHES
								</Text>
								{filteredLocal.map((branch) => (
									<View key={`local-${branch}`}>
										{renderBranchItem({ item: branch })}
									</View>
								))}
							</View>
						)}

						{/* Remote branches */}
						{filteredRemote.length > 0 && (
							<View style={{ marginTop: 8 }}>
								<Text
									style={[
										typography.micro,
										styles.branchListHeader,
										{ color: colors.mutedForeground, backgroundColor: colors.muted },
									]}
								>
									REMOTE BRANCHES
								</Text>
								{filteredRemote.map((branch) => (
									<View key={`remote-${branch}`}>
										{renderBranchItem({ item: branch, isRemote: true })}
									</View>
								))}
							</View>
						)}

						{filteredLocal.length === 0 && filteredRemote.length === 0 && (
							<Text
								style={[
									typography.meta,
									{ color: colors.mutedForeground, textAlign: "center", padding: 16 },
								]}
							>
								No branches found
							</Text>
						)}
					</ScrollView>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

function GitHeader({
	status,
	branches,
	onFetch,
	onPull,
	onPush,
	onCheckoutBranch,
	onCreateBranch,
	isFetching,
	isPulling,
	isPushing,
	isCheckingOut,
	isCreating,
}: {
	status: GitStatus | null;
	branches: GitBranch | null;
	onFetch: () => void;
	onPull: () => void;
	onPush: () => void;
	onCheckoutBranch: (branch: string) => void;
	onCreateBranch: (name: string) => void;
	isFetching: boolean;
	isPulling: boolean;
	isPushing: boolean;
	isCheckingOut: boolean;
	isCreating: boolean;
}) {
	const { colors } = useTheme();
	const [branchModalVisible, setBranchModalVisible] = useState(false);

	const isBusy = isFetching || isPulling || isPushing || isCheckingOut;

	// Parse local and remote branches
	const localBranches = branches?.all.filter((b) => !b.startsWith("remotes/")) ?? [];
	const remoteBranches = branches?.all
		.filter((b) => b.startsWith("remotes/"))
		.map((b) => b.replace(/^remotes\/[^/]+\//, "")) ?? [];

	return (
		<View style={[styles.gitHeader, { borderBottomColor: colors.border }]}>
			{/* Branch selector - now clickable! */}
			<Pressable
				style={({ pressed }) => [
					styles.branchSelector,
					{ backgroundColor: pressed ? colors.muted : colors.card },
				]}
				onPress={() => setBranchModalVisible(true)}
				disabled={isBusy}
			>
				<GitBranchIcon color={colors.primary} size={14} />
				<Text
					style={[typography.uiLabel, { color: colors.foreground, fontWeight: "500", maxWidth: 120 }]}
					numberOfLines={1}
				>
					{status?.current ?? "main"}
				</Text>
				<ChevronDownIcon color={colors.mutedForeground} size={14} />
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
				{/* Fetch */}
				<IconButton
					icon={isFetching ? (
						<ActivityIndicator size="small" color={colors.mutedForeground} />
					) : (
						<RefreshIcon color={colors.mutedForeground} size={18} />
					)}
					variant="ghost"
					size="icon-sm"
					accessibilityLabel="Fetch"
					onPress={onFetch}
					disabled={isBusy}
					style={{ opacity: isBusy ? 0.5 : 1 }}
				/>

				{/* Pull */}
				<IconButton
					icon={isPulling ? (
						<ActivityIndicator size="small" color={colors.mutedForeground} />
					) : (
						<ArrowDownIcon color={colors.mutedForeground} size={18} />
					)}
					variant="ghost"
					size="icon-sm"
					accessibilityLabel="Pull"
					onPress={onPull}
					disabled={isBusy || !status}
					style={{ opacity: isBusy || !status ? 0.5 : 1 }}
				/>

				{/* Push */}
				<IconButton
					icon={isPushing ? (
						<ActivityIndicator size="small" color={colors.mutedForeground} />
					) : (
						<ArrowUpIcon color={colors.mutedForeground} size={18} />
					)}
					variant="ghost"
					size="icon-sm"
					accessibilityLabel="Push"
					onPress={onPush}
					disabled={isBusy || !status}
					style={{ opacity: isBusy || !status ? 0.5 : 1 }}
				/>
			</View>

			{/* Branch selector modal */}
			<BranchSelectorModal
				visible={branchModalVisible}
				onClose={() => setBranchModalVisible(false)}
				currentBranch={status?.current}
				localBranches={localBranches}
				remoteBranches={remoteBranches}
				onCheckout={(branch) => {
					onCheckoutBranch(branch);
					setBranchModalVisible(false);
				}}
				onCreate={(name) => {
					onCreateBranch(name);
					setBranchModalVisible(false);
				}}
				isCheckingOut={isCheckingOut}
				isCreating={isCreating}
			/>
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
				<Checkbox checked={isSelected ?? false} color={colors.primary} checkColor={colors.primaryForeground} />
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
			<IconButton
				icon={isReverting ? (
					<ActivityIndicator size="small" color={colors.mutedForeground} />
				) : (
					<UndoIcon color={colors.mutedForeground} size={14} />
				)}
				variant="ghost"
				size="icon-sm"
				accessibilityLabel="Revert changes"
				onPress={canRevert ? onRevert : undefined}
				disabled={!canRevert || isReverting}
				style={{ opacity: canRevert && !isReverting ? 1 : 0.3 }}
			/>
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
					<ClockIcon size={16} color={colors.mutedForeground} />
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
				<ChevronDownIcon
					size={16}
					color={colors.mutedForeground}
					style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}
				/>
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
											{ color: colors.mutedForeground, fontSize: FontSizes.microSmall },
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
			<Input
				value={commitMessage}
				onChangeText={onCommitMessageChange}
				placeholder="Commit message"
				multiline
				numberOfLines={3}
				editable={!isBusy}
			/>

			{/* Action buttons */}
			<View style={styles.commitActions}>
				{/* AI Generate button */}
				<IconButton
					icon={isGeneratingMessage ? (
						<ActivityIndicator size="small" color={colors.foreground} />
					) : (
						<SparkleIcon color={colors.foreground} size={16} />
					)}
					variant="muted"
					size="icon-sm"
					accessibilityLabel="Generate commit message with AI"
					onPress={onGenerateMessage}
					disabled={!hasSelectedFiles || isGeneratingMessage}
				/>

				<View style={{ flex: 1 }} />

				{/* Commit button */}
				<Button
					variant="outline"
					size="sm"
					onPress={onCommit}
					isDisabled={!canCommit}
					isLoading={isCommitting}
				>
					<Button.Label>Commit</Button.Label>
				</Button>

				{/* Commit & Push button */}
				<Button
					variant="primary"
					size="sm"
					onPress={onCommitAndPush}
					isDisabled={!canCommit}
					isLoading={isPushing}
				>
					<Button.Label>Commit & Push</Button.Label>
				</Button>
			</View>
		</View>
	);
}

export default function GitScreen() {
	const { colors } = useTheme();
	const { isConnected, directory } = useConnectionStore();

	const [status, setStatus] = useState<GitStatus | null>(null);
	const [branches, setBranches] = useState<GitBranch | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isCommitting, setIsCommitting] = useState(false);
	const [isPushing, setIsPushing] = useState(false);
	const [isPulling, setIsPulling] = useState(false);
	const [isFetching, setIsFetching] = useState(false);
	const [isCheckingOut, setIsCheckingOut] = useState(false);
	const [isCreatingBranch, setIsCreatingBranch] = useState(false);

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
				setBranches(null);
				return;
			}

			// Load status and branches in parallel
			const [gitStatus, gitBranches] = await Promise.all([
				gitApi.getStatus(),
				gitApi.getBranches(),
			]);
			setStatus(gitStatus);
			setBranches(gitBranches);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to load git status",
			);
			setStatus(null);
			setBranches(null);
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

	const handleFetch = async () => {
		setIsFetching(true);
		try {
			await gitApi.fetch();
			await loadStatus();
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "Failed to fetch",
			);
		} finally {
			setIsFetching(false);
		}
	};

	const handleCheckoutBranch = async (branch: string) => {
		setIsCheckingOut(true);
		try {
			await gitApi.checkout(branch);
			await loadStatus();
			Alert.alert("Success", `Switched to branch '${branch}'`);
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "Failed to switch branch",
			);
		} finally {
			setIsCheckingOut(false);
		}
	};

	const handleCreateBranch = async (name: string) => {
		setIsCreatingBranch(true);
		try {
			await gitApi.createBranch(name);
			await loadStatus();
			Alert.alert("Success", `Created and switched to branch '${name}'`);
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "Failed to create branch",
			);
		} finally {
			setIsCreatingBranch(false);
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
								<Button
									variant="muted"
									size="xs"
									onPress={handleSelectAll}
								>
									<Button.Label>All</Button.Label>
								</Button>
								<Button
									variant="muted"
									size="xs"
									onPress={handleSelectNone}
								>
									<Button.Label>None</Button.Label>
								</Button>
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
				branches={branches}
				onFetch={handleFetch}
				onPull={handlePull}
				onPush={handlePush}
				onCheckoutBranch={handleCheckoutBranch}
				onCreateBranch={handleCreateBranch}
				isFetching={isFetching}
				isPulling={isPulling}
				isPushing={isPushing}
				isCheckingOut={isCheckingOut}
				isCreating={isCreatingBranch}
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
	// FileItem styles - aligned with PWA
	fileItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	statusIcon: {
		width: 24,
		alignItems: "center",
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
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	changesCountAndButtons: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	// Commit section styles
	commitSection: {
		marginHorizontal: 12,
		marginTop: 12,
		borderRadius: 12,
		borderWidth: 1,
		padding: 10,
	},
	commitSectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 10,
	},
	commitActions: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 10,
	},
	// Staged section / section header
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 12,
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
		paddingHorizontal: 12,
		paddingVertical: 10,
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
		paddingHorizontal: 12,
		paddingVertical: 8,
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
	// Branch selector modal styles
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	branchModal: {
		width: "100%",
		maxWidth: 340,
		maxHeight: "70%",
		borderRadius: 12,
		overflow: "hidden",
	},
	branchModalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	branchSearchContainer: {
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	branchSearchInput: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 8,
		borderWidth: 1,
		fontSize: 14,
	},
	createBranchButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	createBranchForm: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 8,
		gap: 8,
	},
	createBranchInput: {
		flex: 1,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
		fontSize: 14,
	},
	createBranchActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	branchList: {
		flex: 1,
	},
	branchListHeader: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		fontWeight: "600",
	},
	branchItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
});
