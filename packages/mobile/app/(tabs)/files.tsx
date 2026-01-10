import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	RefreshControl,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { Button } from "@/components/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type FileListEntry, filesApi } from "../../src/api";
import {
	ArrowUpIcon,
	ChevronRightIcon,
	FileIcon,
	FolderIcon,
} from "../../src/components/icons";
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { typography, useTheme } from "../../src/theme";

function getFileColor(
	extension: string | undefined,
	colors: { code: string; config: string; doc: string; default: string },
): string {
	const isCode = [
		"ts",
		"tsx",
		"js",
		"jsx",
		"py",
		"go",
		"rs",
		"rb",
		"java",
		"c",
		"cpp",
		"h",
	].includes(extension || "");
	const isConfig = ["json", "yaml", "yml", "toml", "xml", "env"].includes(
		extension || "",
	);
	const isDoc = ["md", "txt", "doc", "pdf"].includes(extension || "");

	return isCode
		? colors.code
		: isConfig
			? colors.config
			: isDoc
				? colors.doc
				: colors.default;
}

function FileItem({
	item,
	onPress,
}: {
	item: FileListEntry;
	onPress: () => void;
}) {
	const { colors } = useTheme();
	const extension = item.name.split(".").pop()?.toLowerCase();

	const fileColors = {
		code: colors.info,
		config: colors.primary,
		doc: colors.success,
		default: colors.mutedForeground,
	};

	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [
				styles.fileItem,
				{ borderBottomColor: colors.border },
				pressed && { backgroundColor: colors.muted },
			]}
		>
			{item.isDirectory ? (
				<FolderIcon size={20} color={colors.primary} />
			) : (
				<FileIcon size={20} color={getFileColor(extension, fileColors)} />
			)}
			<Text
				style={[typography.uiLabel, { color: colors.foreground, flex: 1 }]}
				numberOfLines={1}
			>
				{item.name}
			</Text>
			{item.isDirectory && (
				<ChevronRightIcon size={16} color={colors.mutedForeground} />
			)}
		</Pressable>
	);
}

function PathBreadcrumb({
	path,
	rootPath,
	onNavigate,
}: {
	path: string;
	rootPath: string;
	onNavigate: (path: string) => void;
}) {
	const { colors } = useTheme();
	const relativePath = path.startsWith(rootPath)
		? path.slice(rootPath.length)
		: path;

	const parts = relativePath.split("/").filter(Boolean);

	return (
		<View style={[styles.breadcrumb, { borderBottomColor: colors.border }]}>
			<Pressable onPress={() => onNavigate(rootPath)}>
				<Text style={[typography.meta, { color: colors.primary }]}>~</Text>
			</Pressable>
			{parts.map((part, index) => {
				const fullPath = rootPath + "/" + parts.slice(0, index + 1).join("/");

				return (
					<View key={fullPath} style={styles.breadcrumbPart}>
						<Text style={[typography.meta, { color: colors.mutedForeground }]}>
							/
						</Text>
						<Pressable onPress={() => onNavigate(fullPath)}>
							<Text style={[typography.meta, { color: colors.primary }]}>
								{part}
							</Text>
						</Pressable>
					</View>
				);
			})}
		</View>
	);
}

export default function FilesScreen() {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	const { isConnected, directory } = useConnectionStore();

	const [currentPath, setCurrentPath] = useState<string>(directory || "/");
	const [entries, setEntries] = useState<FileListEntry[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadDirectory = useCallback(
		async (path: string) => {
			if (!isConnected) {
				setError("Not connected");
				setIsLoading(false);
				return;
			}

			try {
				setError(null);
				const result = await filesApi.listDirectory(path);

				const sorted = result.entries.sort((a, b) => {
					if (a.isDirectory && !b.isDirectory) return -1;
					if (!a.isDirectory && b.isDirectory) return 1;
					if (a.name.startsWith(".") && !b.name.startsWith(".")) return 1;
					if (!a.name.startsWith(".") && b.name.startsWith(".")) return -1;
					return a.name.localeCompare(b.name);
				});

				setEntries(sorted);
				setCurrentPath(result.path);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to load directory",
				);
			} finally {
				setIsLoading(false);
				setIsRefreshing(false);
			}
		},
		[isConnected],
	);

	useEffect(() => {
		if (directory) {
			loadDirectory(directory);
		}
	}, [directory, loadDirectory]);

	const handleNavigate = useCallback(
		(path: string) => {
			setIsLoading(true);
			loadDirectory(path);
		},
		[loadDirectory],
	);

	const handleRefresh = useCallback(() => {
		setIsRefreshing(true);
		loadDirectory(currentPath);
	}, [currentPath, loadDirectory]);

	const handleGoUp = useCallback(() => {
		if (!directory || currentPath === directory) return;
		const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
		handleNavigate(parentPath);
	}, [currentPath, directory, handleNavigate]);

	const handleItemPress = useCallback(
		(item: FileListEntry) => {
			if (item.isDirectory) {
				handleNavigate(item.path);
			}
		},
		[handleNavigate],
	);

	const canGoUp = directory && currentPath !== directory;

	const directoryName = directory?.split("/").pop() || "Select Directory";

	if (!directory) {
		return (
			<View
				style={[
					styles.container,
					{ backgroundColor: colors.background, paddingTop: insets.top },
				]}
			>
				<View style={styles.emptyStateContainer}>
					<FolderIcon size={48} color={colors.primary} />
					<Text
						style={[
							typography.uiHeader,
							{ color: colors.foreground, marginTop: 16 },
						]}
					>
						No Directory Selected
					</Text>
					<Text
						style={[
							typography.body,
							{
								color: colors.mutedForeground,
								textAlign: "center",
								marginTop: 8,
							},
						]}
					>
						Select a project directory to browse files
					</Text>
				<Button
					variant="primary"
					size="lg"
					onPress={() => router.push("/onboarding/directory")}
					style={{ marginTop: 24 }}
				>
					<Button.Label>Select Directory</Button.Label>
				</Button>
				</View>
			</View>
		);
	}

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
					Files
				</Text>
			</View>

			<PathBreadcrumb
				path={currentPath}
				rootPath={directory}
				onNavigate={handleNavigate}
			/>

			{isLoading && !isRefreshing ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={colors.primary} />
				</View>
			) : error ? (
				<View style={styles.errorContainer}>
					<Text
						style={[
							typography.body,
							{ color: colors.destructive, textAlign: "center" },
						]}
					>
						{error}
					</Text>
					<Button
						variant="muted"
						size="md"
						onPress={() => loadDirectory(currentPath)}
						style={{ marginTop: 16 }}
					>
						<Button.Label>Retry</Button.Label>
					</Button>
				</View>
			) : (
				<FlatList
					data={entries}
					keyExtractor={(item) => item.path}
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing}
							onRefresh={handleRefresh}
						/>
					}
					ListHeaderComponent={
						canGoUp ? (
							<Pressable
								onPress={handleGoUp}
								style={({ pressed }) => [
									styles.fileItem,
									{ borderBottomColor: colors.border },
									pressed && { backgroundColor: colors.muted },
								]}
							>
								<ArrowUpIcon size={20} color={colors.mutedForeground} />
								<Text
									style={[
										typography.uiLabel,
										{ color: colors.mutedForeground },
									]}
								>
									..
								</Text>
							</Pressable>
						) : null
					}
					renderItem={({ item }) => (
						<FileItem item={item} onPress={() => handleItemPress(item)} />
					)}
					ListEmptyComponent={
						<View style={styles.emptyList}>
							<Text
								style={[typography.body, { color: colors.mutedForeground }]}
							>
								Empty directory
							</Text>
						</View>
					}
				/>
			)}
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
	breadcrumb: {
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		gap: 4,
		borderBottomWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	breadcrumbPart: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	errorContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
	},
	retryButton: {
		marginTop: 16,
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	fileItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		borderBottomWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	emptyList: {
		alignItems: "center",
		paddingVertical: 32,
	},
	emptyStateContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
	},
	selectButton: {
		marginTop: 24,
		borderRadius: 8,
		paddingHorizontal: 24,
		paddingVertical: 12,
	},
});
