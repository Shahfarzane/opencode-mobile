import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

function ChevronRight({ size = 16 }: { size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M9 18l6-6-6-6"
				stroke="#878580"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

function DirectoryItem({
	item,
	onPress,
}: {
	item: FileListEntry;
	onPress: () => void;
}) {
	if (!item.isDirectory) return null;

	return (
		<Pressable
			onPress={onPress}
			className="flex-row items-center gap-3 border-b border-border px-4 py-3 active:bg-muted"
		>
			<FolderIcon />
			<Text className="flex-1 font-mono text-base text-foreground" numberOfLines={1}>
				{item.name}
			</Text>
			<ChevronRight />
		</Pressable>
	);
}

function PathBreadcrumb({
	path,
	homePath,
	onNavigate,
}: {
	path: string;
	homePath: string | null;
	onNavigate: (path: string) => void;
}) {
	const displayPath = homePath && path.startsWith(homePath)
		? "~" + path.slice(homePath.length)
		: path;

	const parts = displayPath.split("/").filter(Boolean);

	return (
		<View className="flex-row flex-wrap items-center gap-1 px-4 py-2">
			<Pressable onPress={() => onNavigate(homePath || "/")}>
				<Text className="font-mono text-sm text-primary">~</Text>
			</Pressable>
			{parts.slice(displayPath.startsWith("~") ? 1 : 0).map((part, index) => {
				const fullPath = homePath && displayPath.startsWith("~")
					? homePath + "/" + parts.slice(1, index + 2).join("/")
					: "/" + parts.slice(0, index + 1).join("/");

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

export default function DirectoryScreen() {
	const insets = useSafeAreaInsets();
	const { setDirectory, serverUrl } = useConnectionStore();

	const [currentPath, setCurrentPath] = useState<string>("/");
	const [homePath, setHomePath] = useState<string | null>(null);
	const [entries, setEntries] = useState<FileListEntry[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [pathInput, setPathInput] = useState("");

	const loadDirectory = useCallback(async (path: string) => {
		setIsLoading(true);
		setError(null);

		try {
			const result = await filesApi.listDirectory(path);
			const directories = result.entries
				.filter((e) => e.isDirectory)
				.sort((a, b) => {
					if (a.name.startsWith(".") && !b.name.startsWith(".")) return 1;
					if (!a.name.startsWith(".") && b.name.startsWith(".")) return -1;
					return a.name.localeCompare(b.name);
				});

			setEntries(directories);
			setCurrentPath(result.path);
			setPathInput(result.path);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load directory");
		} finally {
			setIsLoading(false);
		}
	}, []);

	const loadHomePath = useCallback(async () => {
		try {
			const response = await fetch(`${serverUrl}/api/fs/home`);
			if (response.ok) {
				const data = await response.json();
				if (data.home) {
					setHomePath(data.home);
					return data.home;
				}
			}
		} catch {
		}
		return null;
	}, [serverUrl]);

	useEffect(() => {
		async function init() {
			const home = await loadHomePath();
			loadDirectory(home || "/");
		}
		init();
	}, [loadDirectory, loadHomePath]);

	const handleNavigate = useCallback((path: string) => {
		loadDirectory(path);
	}, [loadDirectory]);

	const handleGoUp = useCallback(() => {
		const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
		loadDirectory(parentPath);
	}, [currentPath, loadDirectory]);

	const handleSelectDirectory = useCallback(async () => {
		try {
			await setDirectory(currentPath);
			if (router.canGoBack()) {
				router.back();
			} else {
				router.replace("/(tabs)/chat");
			}
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "Failed to set directory",
			);
		}
	}, [currentPath, setDirectory]);

	const handlePathSubmit = useCallback(() => {
		const path = pathInput.trim();
		if (path) {
			const expandedPath = path.startsWith("~") && homePath
				? homePath + path.slice(1)
				: path;
			loadDirectory(expandedPath);
		}
	}, [pathInput, homePath, loadDirectory]);

	const canGoUp = currentPath !== "/" && currentPath !== homePath;

	return (
		<View
			className="flex-1 bg-background"
			style={{
				paddingTop: insets.top + 16,
				paddingBottom: insets.bottom + 20,
			}}
		>
			<View className="px-6">
				<Pressable onPress={() => router.back()} className="self-start py-2">
					<Text className="font-mono text-primary">← Back</Text>
				</Pressable>

				<Text className="mt-4 font-mono text-2xl font-semibold text-foreground">
					Select Directory
				</Text>

				<Text className="mt-2 font-mono text-muted-foreground">
					Choose the project directory for OpenCode
				</Text>
			</View>

			<View className="mt-4 border-b border-border px-4">
				<TextInput
					value={pathInput}
					onChangeText={setPathInput}
					onSubmitEditing={handlePathSubmit}
					placeholder="Enter path..."
					placeholderTextColor="#878580"
					autoCapitalize="none"
					autoCorrect={false}
					returnKeyType="go"
					className="rounded-lg border border-border bg-input px-4 py-3 font-mono text-foreground"
				/>
			</View>

			<PathBreadcrumb
				path={currentPath}
				homePath={homePath}
				onNavigate={handleNavigate}
			/>

			{canGoUp && (
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
			)}

			{isLoading ? (
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
					renderItem={({ item }) => (
						<DirectoryItem
							item={item}
							onPress={() => handleNavigate(item.path)}
						/>
					)}
					ListEmptyComponent={
						<View className="items-center py-8">
							<Text className="font-mono text-muted-foreground">
								No subdirectories
							</Text>
						</View>
					}
				/>
			)}

			<View className="border-t border-border px-6 pt-4">
				<View className="mb-3 rounded-lg bg-muted p-3">
					<Text className="font-mono text-xs text-muted-foreground">
						Selected:
					</Text>
					<Text className="font-mono text-sm text-foreground" numberOfLines={2}>
						{currentPath}
					</Text>
				</View>

				<Pressable
					onPress={handleSelectDirectory}
					className="rounded-lg bg-primary px-6 py-4 active:opacity-80"
				>
					<Text className="text-center font-mono text-base font-semibold text-primary-foreground">
						Use This Directory
					</Text>
				</Pressable>
			</View>
		</View>
	);
}
