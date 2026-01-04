import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	RefreshControl,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { filesApi, type FileListEntry } from "../../src/api";
import { useConnectionStore } from "../../src/stores/useConnectionStore";

function FolderIcon({ size = 20 }: { size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
				stroke="#EC8B49"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

function FileIcon({ size = 20, extension }: { size?: number; extension?: string }) {
	const isCode = ["ts", "tsx", "js", "jsx", "py", "go", "rs", "rb", "java", "c", "cpp", "h"].includes(extension || "");
	const isConfig = ["json", "yaml", "yml", "toml", "xml", "env"].includes(extension || "");
	const isDoc = ["md", "txt", "doc", "pdf"].includes(extension || "");

	const color = isCode ? "#4385BE" : isConfig ? "#8B7EC8" : isDoc ? "#879A39" : "#878580";

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
	const extension = item.name.split(".").pop()?.toLowerCase();

	return (
		<Pressable
			onPress={onPress}
			className="flex-row items-center gap-3 border-b border-border px-4 py-3 active:bg-muted"
		>
			{item.isDirectory ? (
				<FolderIcon />
			) : (
				<FileIcon extension={extension} />
			)}
			<Text className="flex-1 font-mono text-base text-foreground" numberOfLines={1}>
				{item.name}
			</Text>
			{item.isDirectory && (
				<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
					<Path
						d="M9 18l6-6-6-6"
						stroke="#878580"
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
	const relativePath = path.startsWith(rootPath)
		? path.slice(rootPath.length)
		: path;

	const parts = relativePath.split("/").filter(Boolean);

	return (
		<View className="flex-row flex-wrap items-center gap-1 border-b border-border px-4 py-2">
			<Pressable onPress={() => onNavigate(rootPath)}>
				<Text className="font-mono text-sm text-primary">~</Text>
			</Pressable>
			{parts.map((part, index) => {
				const fullPath = rootPath + "/" + parts.slice(0, index + 1).join("/");

				return (
					<View key={index} className="flex-row items-center gap-1">
						<Text className="font-mono text-sm text-muted-foreground">/</Text>
						<Pressable onPress={() => onNavigate(fullPath)}>
							<Text className="font-mono text-sm text-primary">{part}</Text>
						</Pressable>
					</View>
				);
			})}
		</View>
	);
}

export default function FilesScreen() {
	const insets = useSafeAreaInsets();
	const { isConnected, directory } = useConnectionStore();

	const [currentPath, setCurrentPath] = useState<string>(directory || "/");
	const [entries, setEntries] = useState<FileListEntry[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadDirectory = useCallback(async (path: string) => {
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
			setError(err instanceof Error ? err.message : "Failed to load directory");
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	}, [isConnected]);

	useEffect(() => {
		if (directory) {
			loadDirectory(directory);
		}
	}, [directory, loadDirectory]);

	const handleNavigate = useCallback((path: string) => {
		setIsLoading(true);
		loadDirectory(path);
	}, [loadDirectory]);

	const handleRefresh = useCallback(() => {
		setIsRefreshing(true);
		loadDirectory(currentPath);
	}, [currentPath, loadDirectory]);

	const handleGoUp = useCallback(() => {
		if (!directory || currentPath === directory) return;
		const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
		handleNavigate(parentPath);
	}, [currentPath, directory, handleNavigate]);

	const handleItemPress = useCallback((item: FileListEntry) => {
		if (item.isDirectory) {
			handleNavigate(item.path);
		}
	}, [handleNavigate]);

	const canGoUp = directory && currentPath !== directory;

	const directoryName = directory?.split("/").pop() || "Select Directory";

	if (!directory) {
		return (
			<View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
				<View className="flex-1 items-center justify-center px-8">
					<FolderIcon size={48} />
					<Text className="mt-4 text-center font-mono text-lg text-foreground">
						No Directory Selected
					</Text>
					<Text className="mt-2 text-center font-mono text-muted-foreground">
						Select a project directory to browse files
					</Text>
					<Pressable
						onPress={() => router.push("/onboarding/directory")}
						className="mt-6 rounded-lg bg-primary px-6 py-3"
					>
						<Text className="font-mono font-medium text-primary-foreground">
							Select Directory
						</Text>
					</Pressable>
				</View>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
			<View className="border-b border-border px-4 py-2">
				<Pressable
					onPress={() => router.push("/onboarding/directory")}
					className="mb-2 flex-row items-center gap-2 rounded-lg bg-muted px-3 py-2"
				>
					<FolderIcon />
					<Text className="flex-1 font-mono text-sm text-foreground" numberOfLines={1}>
						{directoryName}
					</Text>
					<Text className="font-mono text-xs text-muted-foreground">Change</Text>
				</Pressable>
				<Text className="font-mono text-lg font-semibold text-foreground">
					Files
				</Text>
			</View>

			<PathBreadcrumb
				path={currentPath}
				rootPath={directory}
				onNavigate={handleNavigate}
			/>

			{isLoading && !isRefreshing ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" />
				</View>
			) : error ? (
				<View className="flex-1 items-center justify-center px-8">
					<Text className="text-center font-mono text-destructive">{error}</Text>
					<Pressable
						onPress={() => loadDirectory(currentPath)}
						className="mt-4 rounded-lg bg-muted px-4 py-2"
					>
						<Text className="font-mono text-foreground">Retry</Text>
					</Pressable>
				</View>
			) : (
				<FlatList
					data={entries}
					keyExtractor={(item) => item.path}
					refreshControl={
						<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
					}
					ListHeaderComponent={
						canGoUp ? (
							<Pressable
								onPress={handleGoUp}
								className="flex-row items-center gap-3 border-b border-border px-4 py-3 active:bg-muted"
							>
								<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
									<Path
										d="M17 11l-5-5-5 5M12 6v12"
										stroke="#878580"
										strokeWidth={2}
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</Svg>
								<Text className="font-mono text-base text-muted-foreground">..</Text>
							</Pressable>
						) : null
					}
					renderItem={({ item }) => (
						<FileItem item={item} onPress={() => handleItemPress(item)} />
					)}
					ListEmptyComponent={
						<View className="items-center py-8">
							<Text className="font-mono text-muted-foreground">
								Empty directory
							</Text>
						</View>
					}
				/>
			)}
		</View>
	);
}
