import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	RefreshControl,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { gitApi, type GitStatus, type GitStatusFile } from "../../src/api";
import { useConnectionStore } from "../../src/stores/useConnectionStore";

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
}: {
	file: GitStatusFile;
	onPress?: () => void;
}) {
	const status = getFileStatus(file);

	const statusColors = {
		staged: "text-success",
		modified: "text-warning",
		untracked: "text-muted-foreground",
	};

	const statusIcons = {
		staged: file.index || "A",
		modified: file.working_dir || "M",
		untracked: "?",
	};

	return (
		<Pressable
			onPress={onPress}
			className="flex-row items-center gap-3 px-4 py-3 active:bg-muted"
		>
			<View className={`w-6 items-center ${statusColors[status]}`}>
				<Text className={`font-mono font-bold ${statusColors[status]}`}>
					{statusIcons[status]}
				</Text>
			</View>
			<Text
				className="flex-1 font-mono text-sm text-foreground"
				numberOfLines={1}
			>
				{file.path}
			</Text>
		</Pressable>
	);
}

function SectionHeader({ title, count }: { title: string; count: number }) {
	return (
		<View className="flex-row items-center justify-between bg-muted px-4 py-2">
			<Text className="font-mono text-sm font-medium text-muted-foreground">
				{title}
			</Text>
			<View className="rounded-full bg-card px-2 py-0.5">
				<Text className="font-mono text-xs text-muted-foreground">{count}</Text>
			</View>
		</View>
	);
}

function EmptyState({ message }: { message: string }) {
	return (
		<View className="flex-1 items-center justify-center px-8 py-16">
			<Text className="text-center font-mono text-muted-foreground">
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
		} catch {
			Alert.alert("Error", "Failed to generate commit message");
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
		<View className="absolute inset-0 bg-black/50">
			<Pressable className="flex-1" onPress={onClose} />
			<View className="rounded-t-3xl bg-background p-4">
				<View className="mb-4 flex-row items-center justify-between">
					<Text className="font-mono text-lg font-semibold text-foreground">
						Commit Changes
					</Text>
					<Pressable onPress={onClose}>
						<Text className="font-mono text-muted-foreground">Cancel</Text>
					</Pressable>
				</View>

				<TextInput
					value={message}
					onChangeText={setMessage}
					placeholder="Commit message..."
					placeholderTextColor="#878580"
					multiline
					numberOfLines={4}
					className="mb-4 min-h-[100px] rounded-lg border border-border bg-input p-3 font-mono text-foreground"
					editable={!isCommitting}
				/>

				<View className="flex-row gap-3">
					<Pressable
						onPress={generateMessage}
						disabled={isGenerating || stagedFiles.length === 0}
						className="flex-1 items-center rounded-lg border border-border bg-card py-3 active:opacity-80 disabled:opacity-50"
					>
						{isGenerating ? (
							<ActivityIndicator size="small" />
						) : (
							<Text className="font-mono font-medium text-foreground">
								Generate
							</Text>
						)}
					</Pressable>

					<Pressable
						onPress={handleCommit}
						disabled={isCommitting || !message.trim()}
						className="flex-1 items-center rounded-lg bg-primary py-3 active:opacity-80 disabled:opacity-50"
					>
						{isCommitting ? (
							<ActivityIndicator size="small" color="#FFFCF0" />
						) : (
							<Text className="font-mono font-medium text-primary-foreground">
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
			setError(err instanceof Error ? err.message : "Failed to load git status");
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

	const stagedFiles =
		status?.files.filter((f) => getFileStatus(f) === "staged") ?? [];
	const modifiedFiles =
		status?.files.filter((f) => getFileStatus(f) === "modified") ?? [];
	const untrackedFiles =
		status?.files.filter((f) => getFileStatus(f) === "untracked") ?? [];

	const renderContent = () => {
		if (isLoading) {
			return (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" />
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
				className="flex-1"
				refreshControl={
					<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
				}
			>
				{stagedFiles.length > 0 && (
					<View>
						<SectionHeader title="Staged Changes" count={stagedFiles.length} />
						{stagedFiles.map((file) => (
							<FileItem key={file.path} file={file} />
						))}
					</View>
				)}

				{modifiedFiles.length > 0 && (
					<View>
						<SectionHeader title="Modified" count={modifiedFiles.length} />
						{modifiedFiles.map((file) => (
							<FileItem key={file.path} file={file} />
						))}
					</View>
				)}

				{untrackedFiles.length > 0 && (
					<View>
						<SectionHeader title="Untracked" count={untrackedFiles.length} />
						{untrackedFiles.map((file) => (
							<FileItem key={file.path} file={file} />
						))}
					</View>
				)}
			</ScrollView>
		);
	};

	return (
		<View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
			<View className="border-b border-border px-4 py-3">
				<Text className="font-mono text-lg font-semibold text-foreground">
					Git
				</Text>
			</View>

			{status && (
				<View className="flex-row items-center justify-between border-b border-border px-4 py-4">
					<View className="flex-row items-center gap-2">
						<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
							<Path
								d="M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
								stroke="#EC8B49"
								strokeWidth={2}
								strokeLinecap="round"
							/>
							<Path
								d="M18 9a9 9 0 0 1-9 9"
								stroke="#EC8B49"
								strokeWidth={2}
								strokeLinecap="round"
							/>
						</Svg>
						<Text className="font-mono text-base font-medium text-foreground">
							{status.current}
						</Text>
					</View>
					<View className="flex-row items-center gap-2">
						{status.ahead > 0 && (
							<Text className="font-mono text-sm text-success">
								↑{status.ahead}
							</Text>
						)}
						{status.behind > 0 && (
							<Text className="font-mono text-sm text-destructive">
								↓{status.behind}
							</Text>
						)}
					</View>
				</View>
			)}

			{renderContent()}

			<View
				className="flex-row gap-3 border-t border-border px-4 py-4"
				style={{ paddingBottom: insets.bottom + 16 }}
			>
				<Pressable
					onPress={handlePull}
					disabled={isPulling || !status}
					className="flex-1 items-center rounded-lg border border-border bg-card py-3 active:opacity-80 disabled:opacity-50"
				>
					{isPulling ? (
						<ActivityIndicator size="small" />
					) : (
						<Text className="font-mono font-medium text-foreground">Pull</Text>
					)}
				</Pressable>
				<Pressable
					onPress={() => setShowCommitSheet(true)}
					disabled={stagedFiles.length === 0 && modifiedFiles.length === 0}
					className="flex-1 items-center rounded-lg bg-primary py-3 active:opacity-80 disabled:opacity-50"
				>
					<Text className="font-mono font-medium text-primary-foreground">
						Commit
					</Text>
				</Pressable>
				<Pressable
					onPress={handlePush}
					disabled={isPushing || !status || status.ahead === 0}
					className="flex-1 items-center rounded-lg border border-border bg-card py-3 active:opacity-80 disabled:opacity-50"
				>
					{isPushing ? (
						<ActivityIndicator size="small" />
					) : (
						<Text className="font-mono font-medium text-foreground">Push</Text>
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
