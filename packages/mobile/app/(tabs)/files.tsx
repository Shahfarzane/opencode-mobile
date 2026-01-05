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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { type FileListEntry, filesApi } from "../../src/api";
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { typography, useTheme } from "../../src/theme";

function FolderIcon({ size = 20, color }: { size?: number; color: string }) {
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

function FileIcon({
	size = 20,
	extension,
	colors,
}: {
	size?: number;
	extension?: string;
	colors: { code: string; config: string; doc: string; default: string };
}) {
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

	const color = isCode
		? colors.code
		: isConfig
			? colors.config
			: isDoc
				? colors.doc
				: colors.default;

	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
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
				<FolderIcon color={colors.primary} />
			) : (
				<FileIcon extension={extension} colors={fileColors} />
			)}
			<Text
				style={[typography.uiLabel, { color: colors.foreground, flex: 1 }]}
				numberOfLines={1}
			>
				{item.name}
			</Text>
			{item.isDirectory && (
				<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
					<Path
						d="M9 18l6-6-6-6"
						stroke={colors.mutedForeground}
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</Svg>
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
					<Pressable
						onPress={() => router.push("/onboarding/directory")}
						style={[styles.selectButton, { backgroundColor: colors.primary }]}
					>
						<Text
							style={[
								typography.uiLabel,
								{ color: colors.primaryForeground, fontWeight: "500" },
							]}
						>
							Select Directory
						</Text>
					</Pressable>
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
					<Pressable
						onPress={() => loadDirectory(currentPath)}
						style={[styles.retryButton, { backgroundColor: colors.muted }]}
					>
						<Text style={[typography.uiLabel, { color: colors.foreground }]}>
							Retry
						</Text>
					</Pressable>
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
								<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
									<Path
										d="M17 11l-5-5-5 5M12 6v12"
										stroke={colors.mutedForeground}
										strokeWidth={2}
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</Svg>
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
