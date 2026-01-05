import { router } from "expo-router";
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
import { type GitStatus, type GitStatusFile, gitApi } from "../../src/api";
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { typography, useTheme } from "../../src/theme";

function FolderIcon({ size = 16, color }: { size?: number; color: string }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

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

function FileItem({
	file,
	onPress,
	onLongPress,
	actionLabel,
}: {
	file: GitStatusFile;
	onPress?: () => void;
	onLongPress?: () => void;
	actionLabel?: string;
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
			onPress={onPress}
			onLongPress={onLongPress}
			style={({ pressed }) => [
				styles.fileItem,
				pressed && { backgroundColor: colors.muted },
			]}
		>
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
			{actionLabel && (
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

	const stagedFiles =
		status?.files.filter((f) => getFileStatus(f) === "staged") ?? [];
	const modifiedFiles =
		status?.files.filter((f) => getFileStatus(f) === "modified") ?? [];
	const untrackedFiles =
		status?.files.filter((f) => getFileStatus(f) === "untracked") ?? [];

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
							/>
						))}
					</View>
				)}

				{(modifiedFiles.length > 0 || untrackedFiles.length > 0) && (
					<View
						style={[styles.changesHeader, { backgroundColor: colors.muted }]}
					>
						<Text
							style={[
								typography.meta,
								{ color: colors.mutedForeground, fontWeight: "500" },
							]}
						>
							Changes ({modifiedFiles.length + untrackedFiles.length})
						</Text>
						<Pressable
							onPress={handleStageAll}
							style={[styles.stageAllButton, { backgroundColor: colors.card }]}
						>
							<Text style={[typography.micro, { color: colors.primary }]}>
								Stage All
							</Text>
						</Pressable>
					</View>
				)}

				{modifiedFiles.length > 0 && (
					<View>
						{modifiedFiles.map((file) => (
							<FileItem
								key={file.path}
								file={file}
								onPress={() => handleStageFile(file.path)}
								onLongPress={() => handleRevertFile(file.path)}
								actionLabel="Stage"
							/>
						))}
					</View>
				)}

				{untrackedFiles.length > 0 && (
					<View>
						<SectionHeader title="Untracked" count={untrackedFiles.length} />
						{untrackedFiles.map((file) => (
							<FileItem
								key={file.path}
								file={file}
								onPress={() => handleStageFile(file.path)}
								actionLabel="Stage"
							/>
						))}
					</View>
				)}
			</ScrollView>
		);
	};

	const directoryName = directory?.split("/").pop() || "Select Directory";

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: colors.background, paddingTop: insets.top },
			]}
		>
			<View style={[styles.header, { borderBottomColor: colors.border }]}>
				<Pressable
					onPress={() => router.push("/onboarding/directory")}
					style={[styles.directoryButton, { backgroundColor: colors.muted }]}
				>
					<FolderIcon color={colors.primary} />
					<Text
						style={[typography.meta, { color: colors.foreground, flex: 1 }]}
						numberOfLines={1}
					>
						{directoryName}
					</Text>
					<Text style={[typography.micro, { color: colors.mutedForeground }]}>
						Change
					</Text>
				</Pressable>
				<Text style={[typography.uiHeader, { color: colors.foreground }]}>
					Git
				</Text>
			</View>

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
	header: {
		borderBottomWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	directoryButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		marginBottom: 8,
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
});
