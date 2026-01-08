import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { type FileListEntry, filesApi } from "../../src/api";
import { PushpinFillIcon, PushpinIcon } from "../../src/components/icons";
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { Spacing, typography, useTheme } from "../../src/theme";

function BackButton() {
	const { colors } = useTheme();

	return (
		<Pressable
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				router.back();
			}}
			style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
			hitSlop={8}
		>
			<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
				<Path
					d="M15 18l-6-6 6-6"
					stroke={colors.foreground}
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</Svg>
			<Text style={[typography.uiLabel, { color: colors.foreground }]}>Back</Text>
		</Pressable>
	);
}

interface DirectoryRowProps {
	item: FileListEntry;
	onPress: () => void;
	isPinned: boolean;
	onTogglePin: () => void;
}

function DirectoryRow({ item, onPress, isPinned, onTogglePin }: DirectoryRowProps) {
	const { colors } = useTheme();

	if (!item.isDirectory) return null;

	const handlePinPress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onTogglePin();
	};

	return (
		<Pressable
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				onPress();
			}}
			style={({ pressed }) => [
				styles.row,
				{ borderColor: colors.border + "66" },
				pressed && { opacity: 0.7 },
			]}
		>
			<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
				<Path
					d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
					stroke={colors.primary}
					strokeWidth={1.5}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</Svg>
			<Text style={[typography.uiLabel, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>
				{item.name}
			</Text>
			<Pressable
				onPress={handlePinPress}
				hitSlop={8}
				style={({ pressed }) => [
					styles.pinButton,
					pressed && { opacity: 0.7 },
				]}
			>
				{isPinned ? (
					<PushpinFillIcon size={16} color={colors.primary} />
				) : (
					<PushpinIcon size={16} color={colors.mutedForeground} />
				)}
			</Pressable>
			<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
				<Path
					d="M9 18l6-6-6-6"
					stroke={colors.mutedForeground}
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</Svg>
		</Pressable>
	);
}

interface PinnedDirectoryRowProps {
	path: string;
	homePath: string | null;
	onPress: () => void;
	onUnpin: () => void;
}

function PinnedDirectoryRow({ path, homePath, onPress, onUnpin }: PinnedDirectoryRowProps) {
	const { colors } = useTheme();

	const displayPath = homePath && path.startsWith(homePath)
		? "~" + path.slice(homePath.length)
		: path;

	const name = path.split("/").pop() || path;

	return (
		<Pressable
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				onPress();
			}}
			style={({ pressed }) => [
				styles.pinnedRow,
				{ borderColor: colors.border + "66", backgroundColor: colors.card },
				pressed && { opacity: 0.7 },
			]}
		>
			<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
				<Path
					d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
					stroke={colors.primary}
					strokeWidth={1.5}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</Svg>
			<View style={{ flex: 1 }}>
				<Text style={[typography.uiLabel, { color: colors.foreground }]} numberOfLines={1}>
					{name}
				</Text>
				<Text style={[typography.micro, { color: colors.mutedForeground }]} numberOfLines={1}>
					{displayPath}
				</Text>
			</View>
			<Pressable
				onPress={() => {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					onUnpin();
				}}
				hitSlop={8}
				style={({ pressed }) => [
					styles.pinButton,
					pressed && { opacity: 0.7 },
				]}
			>
				<PushpinFillIcon size={16} color={colors.primary} />
			</Pressable>
		</Pressable>
	);
}

export default function DirectoryScreen() {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	const { setDirectory, serverUrl, directory: savedDirectory, authToken, pinnedDirectories, loadPinnedDirectories, togglePinnedDirectory } = useConnectionStore();

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

	const loadServerCwd = useCallback(async () => {
		try {
			const response = await fetch(`${serverUrl}/api/fs/cwd`, {
				headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
			});
			if (response.ok) {
				const data = await response.json();
				if (data.home) {
					setHomePath(data.home);
				}
				// Return the server's current working directory
				return data.cwd || data.home || null;
			}
		} catch {
			// Fall back to home directory
		}

		// Fallback: try to get just the home directory
		try {
			const response = await fetch(`${serverUrl}/api/fs/home`, {
				headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
			});
			if (response.ok) {
				const data = await response.json();
				if (data.home) {
					setHomePath(data.home);
					return data.home;
				}
			}
		} catch {
			// Ignore
		}
		return null;
	}, [serverUrl, authToken]);

	useEffect(() => {
		async function init() {
			// Priority: saved directory > server's CWD > home > root
			if (savedDirectory) {
				loadDirectory(savedDirectory);
			} else {
				const serverCwd = await loadServerCwd();
				loadDirectory(serverCwd || "/");
			}
		}
		init();
	}, [loadDirectory, loadServerCwd, savedDirectory]);

	// Load pinned directories on mount
	useEffect(() => {
		loadPinnedDirectories();
	}, [loadPinnedDirectories]);

	const handleNavigate = useCallback(
		(path: string) => {
			loadDirectory(path);
		},
		[loadDirectory],
	);

	const handleGoUp = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
		loadDirectory(parentPath);
	}, [currentPath, loadDirectory]);

	const handleSelect = useCallback(async () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		try {
			await setDirectory(currentPath);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			if (router.canGoBack()) {
				router.back();
			} else {
				router.replace("/(tabs)/chat");
			}
		} catch (err) {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			Alert.alert("Error", err instanceof Error ? err.message : "Failed to set directory");
		}
	}, [currentPath, setDirectory]);

	const handlePathSubmit = useCallback(() => {
		const path = pathInput.trim();
		if (path) {
			const expanded = path.startsWith("~") && homePath ? homePath + path.slice(1) : path;
			loadDirectory(expanded);
		}
	}, [pathInput, homePath, loadDirectory]);

	const canGoUp = currentPath !== "/" && currentPath !== homePath;

	const displayPath =
		homePath && currentPath.startsWith(homePath)
			? "~" + currentPath.slice(homePath.length)
			: currentPath;

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: colors.background,
					paddingTop: insets.top + 16,
				},
			]}
		>
			{/* Header */}
			<View style={styles.header}>
				<BackButton />
				<Text style={[typography.h2, { color: colors.foreground, marginTop: Spacing.md }]}>
					Select Directory
				</Text>
				<Text style={[typography.meta, { color: colors.mutedForeground, marginTop: 8 }]}>
					Choose your project folder
				</Text>
			</View>

			{/* Path input */}
			<View style={styles.pathSection}>
				<TextInput
					value={pathInput}
					onChangeText={setPathInput}
					onSubmitEditing={handlePathSubmit}
					placeholder="Enter path..."
					placeholderTextColor={colors.mutedForeground}
					autoCapitalize="none"
					autoCorrect={false}
					returnKeyType="go"
					style={[
						typography.uiLabel,
						styles.pathInput,
						{ borderColor: colors.border, color: colors.foreground },
					]}
				/>
			</View>

			{/* Pinned directories section */}
			{pinnedDirectories.length > 0 && (
				<View style={styles.pinnedSection}>
					<Text style={[typography.micro, { color: colors.mutedForeground, marginBottom: 8 }]}>
						PINNED
					</Text>
					{pinnedDirectories.map((path) => (
						<PinnedDirectoryRow
							key={path}
							path={path}
							homePath={homePath}
							onPress={() => {
								loadDirectory(path);
							}}
							onUnpin={() => togglePinnedDirectory(path)}
						/>
					))}
				</View>
			)}

			{/* Go up button */}
			{canGoUp && (
				<Pressable
					onPress={handleGoUp}
					style={({ pressed }) => [
						styles.goUpRow,
						{ borderColor: colors.border + "66" },
						pressed && { opacity: 0.7 },
					]}
				>
					<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
						<Path
							d="M17 11l-5-5-5 5M12 6v12"
							stroke={colors.mutedForeground}
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</Svg>
					<Text style={[typography.uiLabel, { color: colors.mutedForeground }]}>
						Parent directory
					</Text>
				</Pressable>
			)}

			{/* Content */}
			{isLoading ? (
				<View style={styles.centered}>
					<ActivityIndicator size="small" color={colors.primary} />
				</View>
			) : error ? (
				<View style={styles.centered}>
					<Text style={[typography.meta, { color: colors.destructive, textAlign: "center" }]}>
						{error}
					</Text>
					<Pressable
						onPress={() => loadDirectory(currentPath)}
						style={({ pressed }) => [
							styles.retryBtn,
							{ borderColor: colors.border },
							pressed && { opacity: 0.7 },
						]}
					>
						<Text style={[typography.uiLabel, { color: colors.foreground }]}>Retry</Text>
					</Pressable>
				</View>
			) : (
				<FlatList
					data={entries}
					keyExtractor={(item) => item.path}
					renderItem={({ item }) => (
						<DirectoryRow
							item={item}
							onPress={() => handleNavigate(item.path)}
							isPinned={pinnedDirectories.includes(item.path)}
							onTogglePin={() => togglePinnedDirectory(item.path)}
						/>
					)}
					contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
					ListEmptyComponent={
						<View style={styles.empty}>
							<Text style={[typography.meta, { color: colors.mutedForeground }]}>
								No subdirectories
							</Text>
						</View>
					}
				/>
			)}

			{/* Bottom bar */}
			<View
				style={[
					styles.bottomBar,
					{
						borderTopColor: colors.border + "66",
						backgroundColor: colors.background,
						paddingBottom: insets.bottom + 24,
					},
				]}
			>
				<Text style={[typography.micro, { color: colors.mutedForeground }]}>
					Selected: {displayPath}
				</Text>
				<Pressable
					onPress={handleSelect}
					style={({ pressed }) => [
						styles.selectBtn,
						{ backgroundColor: colors.primary },
						pressed && { opacity: 0.9 },
					]}
				>
					<Text style={[typography.uiLabel, { color: colors.primaryForeground, fontWeight: "600" }]}>
						Use This Directory
					</Text>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		paddingHorizontal: 24,
	},
	backBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		alignSelf: "flex-start",
		paddingVertical: 8,
		paddingRight: 12,
	},
	pathSection: {
		paddingHorizontal: 24,
		marginTop: 24,
	},
	pathInput: {
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	goUpRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginHorizontal: 16,
		marginTop: 16,
		padding: 14,
		borderWidth: 1,
		borderRadius: 8,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginHorizontal: 16,
		marginBottom: 8,
		padding: 14,
		borderWidth: 1,
		borderRadius: 8,
	},
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 24,
	},
	retryBtn: {
		marginTop: 16,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 20,
		paddingVertical: 10,
	},
	empty: {
		alignItems: "center",
		paddingVertical: 48,
	},
	pinnedSection: {
		paddingHorizontal: 16,
		marginTop: 16,
	},
	pinnedRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 8,
		padding: 14,
		borderWidth: 1,
		borderRadius: 8,
	},
	pinButton: {
		padding: 4,
	},
	bottomBar: {
		borderTopWidth: 1,
		paddingHorizontal: 24,
		paddingTop: 16,
	},
	selectBtn: {
		marginTop: 12,
		borderRadius: 8,
		paddingVertical: 14,
		alignItems: "center",
	},
});
