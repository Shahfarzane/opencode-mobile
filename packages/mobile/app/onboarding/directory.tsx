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
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { typography, useTheme } from "../../src/theme";

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

function DirectoryRow({ item, onPress }: { item: FileListEntry; onPress: () => void }) {
	const { colors } = useTheme();

	if (!item.isDirectory) return null;

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

export default function DirectoryScreen() {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
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
			// Ignore
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
						<DirectoryRow item={item} onPress={() => handleNavigate(item.path)} />
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
