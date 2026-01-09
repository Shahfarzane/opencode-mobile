import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Modal,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	CheckIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	FileIcon,
	FolderIcon,
	SearchIcon,
	XIcon,
} from "@/components/icons";
import { SearchInput } from "@/components/ui";
import { typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";
import { filesApi, type FileListEntry } from "@/api/files";

interface FileInfo {
	name: string;
	path: string;
	type: "file" | "directory";
	extension?: string;
	relativePath?: string;
}

interface ServerFilePickerProps {
	visible: boolean;
	onClose: () => void;
	onFilesSelected: (files: FileInfo[]) => void;
	rootDirectory: string;
	multiSelect?: boolean;
}

export function ServerFilePicker({
	visible,
	onClose,
	onFilesSelected,
	rootDirectory,
	multiSelect = true,
}: ServerFilePickerProps) {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	const [loading, setLoading] = useState(false);
	const [searching, setSearching] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
	const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
	const [childrenByDir, setChildrenByDir] = useState<Record<string, FileInfo[]>>({});
	const [searchResults, setSearchResults] = useState<FileInfo[]>([]);

	const loadedDirsRef = useRef<Set<string>>(new Set());
	const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const mapEntries = useCallback((entries: FileListEntry[]): FileInfo[] => {
		return entries
			.filter((entry) => !entry.name.startsWith("."))
			.map((entry) => ({
				name: entry.name,
				path: entry.path,
				type: entry.isDirectory ? "directory" : "file",
				extension: !entry.isDirectory && entry.name.includes(".")
					? entry.name.split(".").pop()?.toLowerCase()
					: undefined,
			}))
			.sort((a, b) => {
				if (a.type !== b.type) {
					return a.type === "directory" ? -1 : 1;
				}
				return a.name.localeCompare(b.name);
			});
	}, []);

	const loadDirectory = useCallback(async (dirPath: string) => {
		if (loadedDirsRef.current.has(dirPath)) {
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const result = await filesApi.listDirectory(dirPath);
			const items = mapEntries(result.entries);
			loadedDirsRef.current.add(dirPath);
			setChildrenByDir((prev) => ({ ...prev, [dirPath]: items }));
		} catch (err) {
			setError("Failed to load directory");
			setChildrenByDir((prev) => ({ ...prev, [dirPath]: [] }));
		} finally {
			setLoading(false);
		}
	}, [mapEntries]);

	// Load root directory on open
	useEffect(() => {
		if (visible && rootDirectory) {
			loadedDirsRef.current.clear();
			setChildrenByDir({});
			setExpandedDirs(new Set());
			setSelectedFiles(new Set());
			setSearchQuery("");
			setSearchResults([]);
			void loadDirectory(rootDirectory);
		}
	}, [visible, rootDirectory, loadDirectory]);

	// Search files with debounce
	useEffect(() => {
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}

		const trimmedQuery = searchQuery.trim();
		if (!trimmedQuery) {
			setSearchResults([]);
			setSearching(false);
			return;
		}

		setSearching(true);

		searchTimeoutRef.current = setTimeout(async () => {
			try {
				const results = await filesApi.search(rootDirectory, trimmedQuery, 50);
				setSearchResults(
					results.map((r) => ({
						name: r.path.split("/").pop() || r.path,
						path: r.path,
						type: "file" as const,
						extension: r.path.includes(".") ? r.path.split(".").pop()?.toLowerCase() : undefined,
						relativePath: r.path.replace(rootDirectory + "/", ""),
					}))
				);
			} catch {
				setSearchResults([]);
			} finally {
				setSearching(false);
			}
		}, 200);

		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, [searchQuery, rootDirectory]);

	const toggleDirectory = useCallback(async (dirPath: string) => {
		await Haptics.selectionAsync();
		const isExpanded = expandedDirs.has(dirPath);

		if (isExpanded) {
			setExpandedDirs((prev) => {
				const next = new Set(prev);
				next.delete(dirPath);
				return next;
			});
		} else {
			setExpandedDirs((prev) => {
				const next = new Set(prev);
				next.add(dirPath);
				return next;
			});
			await loadDirectory(dirPath);
		}
	}, [expandedDirs, loadDirectory]);

	const toggleFileSelection = useCallback((filePath: string) => {
		Haptics.selectionAsync();
		if (multiSelect) {
			setSelectedFiles((prev) => {
				const next = new Set(prev);
				if (next.has(filePath)) {
					next.delete(filePath);
				} else {
					next.add(filePath);
				}
				return next;
			});
		} else {
			setSelectedFiles(new Set([filePath]));
		}
	}, [multiSelect]);

	const handleConfirm = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		const allFiles = new Map<string, FileInfo>();
		Object.values(childrenByDir).forEach((items) => {
			items.forEach((file) => {
				if (file.type === "file") {
					allFiles.set(file.path, file);
				}
			});
		});
		searchResults.forEach((file) => {
			allFiles.set(file.path, file);
		});

		const selected = Array.from(selectedFiles)
			.map((path) => allFiles.get(path))
			.filter((file): file is FileInfo => Boolean(file));

		onFilesSelected(selected);
		onClose();
	}, [selectedFiles, childrenByDir, searchResults, onFilesSelected, onClose]);

	const getFileIconColor = (extension?: string) => {
		switch (extension?.toLowerCase()) {
			case "ts":
			case "tsx":
			case "js":
			case "jsx":
				return colors.info;
			case "json":
				return colors.warning;
			case "md":
			case "mdx":
				return colors.mutedForeground;
			case "png":
			case "jpg":
			case "jpeg":
			case "gif":
			case "svg":
				return colors.success;
			default:
				return colors.mutedForeground;
		}
	};

	const rootItems = childrenByDir[rootDirectory] ?? [];
	const isSearchActive = searchQuery.trim().length > 0;

	const renderFileItem = useCallback(
		({ item, level = 0 }: { item: FileInfo; level?: number }) => {
			const isDirectory = item.type === "directory";
			const isExpanded = expandedDirs.has(item.path);
			const isSelected = selectedFiles.has(item.path);
			const children = childrenByDir[item.path] ?? [];

			return (
				<View key={item.path}>
					<Pressable
						onPress={() => {
							if (isDirectory) {
								void toggleDirectory(item.path);
							} else {
								toggleFileSelection(item.path);
							}
						}}
						className="flex-row items-center py-2 px-3"
						style={[
							{ paddingLeft: 12 + level * 16 },
							!isDirectory && isSelected && { backgroundColor: withOpacity(colors.primary, OPACITY.active) },
						]}
					>
						{isDirectory ? (
							<>
								{isExpanded ? (
									<ChevronDownIcon size={14} color={colors.mutedForeground} />
								) : (
									<ChevronRightIcon size={14} color={colors.mutedForeground} />
								)}
								<FolderIcon size={16} color={colors.primary} style={{ marginLeft: 4 }} />
							</>
						) : (
							<View style={{ width: 14 }} />
						)}
						{!isDirectory && (
							<FileIcon
								size={16}
								color={getFileIconColor(item.extension)}
								style={{ marginLeft: 4 }}
							/>
						)}
						<Text
							style={[
								typography.uiLabel,
								{ color: colors.foreground, marginLeft: 8, flex: 1 },
							]}
							numberOfLines={1}
						>
							{isSearchActive ? item.relativePath || item.name : item.name}
						</Text>
						{!isDirectory && isSelected && (
							<CheckIcon size={16} color={colors.primary} />
						)}
					</Pressable>

					{isDirectory && isExpanded && children.length > 0 && (
						<View>
							{children.map((child) => renderFileItem({ item: child, level: level + 1 }))}
						</View>
					)}
				</View>
			);
		},
		[
			expandedDirs,
			selectedFiles,
			childrenByDir,
			colors,
			isSearchActive,
			toggleDirectory,
			toggleFileSelection,
			getFileIconColor,
		]
	);

	const displayItems = isSearchActive ? searchResults : rootItems;

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<View
				className="flex-1"
				style={{ backgroundColor: colors.background, paddingTop: insets.top }}
			>
				{/* Header */}
				<View
					className="flex-row items-center justify-between px-4 py-3 border-b"
					style={{ borderBottomColor: colors.border }}
				>
					<Pressable onPress={onClose} hitSlop={8}>
						<XIcon size={24} color={colors.foreground} />
					</Pressable>
					<Text style={[typography.uiLabel, { color: colors.foreground, fontWeight: "600" }]}>
						Select Project Files
					</Text>
					<View style={{ width: 24 }} />
				</View>

				{/* Search */}
				<View className="px-4 py-2 border-b" style={{ borderBottomColor: colors.border }}>
					<View
						className="flex-row items-center px-3 py-2 rounded-lg"
						style={{ backgroundColor: colors.muted }}
					>
						<SearchIcon size={16} color={colors.mutedForeground} />
						<TextInput
							value={searchQuery}
							onChangeText={setSearchQuery}
							placeholder="Search files..."
							placeholderTextColor={colors.mutedForeground}
							className="flex-1 ml-2"
							style={[typography.uiLabel, { color: colors.foreground }]}
							autoCapitalize="none"
							autoCorrect={false}
						/>
						{searchQuery.length > 0 && (
							<Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
								<XIcon size={16} color={colors.mutedForeground} />
							</Pressable>
						)}
					</View>
				</View>

				{/* File List */}
				<View className="flex-1">
					{loading && !isSearchActive && displayItems.length === 0 && (
						<View className="flex-1 items-center justify-center">
							<ActivityIndicator color={colors.primary} />
							<Text style={[typography.uiLabel, { color: colors.mutedForeground, marginTop: 8 }]}>
								Loading files...
							</Text>
						</View>
					)}

					{error && (
						<View className="flex-1 items-center justify-center px-4">
							<Text style={[typography.uiLabel, { color: colors.destructive, textAlign: "center" }]}>
								{error}
							</Text>
						</View>
					)}

					{searching && (
						<View className="items-center py-4">
							<ActivityIndicator size="small" color={colors.primary} />
						</View>
					)}

					{!loading && !error && displayItems.length === 0 && !searching && (
						<View className="flex-1 items-center justify-center">
							<Text style={[typography.uiLabel, { color: colors.mutedForeground }]}>
								{isSearchActive ? "No files found" : "No files in directory"}
							</Text>
						</View>
					)}

					{!loading && !error && displayItems.length > 0 && (
						<FlatList
							data={displayItems}
							keyExtractor={(item) => item.path}
							renderItem={({ item }) => renderFileItem({ item, level: 0 })}
							showsVerticalScrollIndicator={false}
							keyboardShouldPersistTaps="handled"
						/>
					)}
				</View>

				{/* Footer */}
				<View
					className="flex-row items-center justify-between px-4 py-3 border-t"
					style={{
						borderTopColor: colors.border,
						paddingBottom: Math.max(insets.bottom, 12),
					}}
				>
					<Text style={[typography.micro, { color: colors.mutedForeground }]}>
						{selectedFiles.size > 0
							? `${selectedFiles.size} file${selectedFiles.size !== 1 ? "s" : ""} selected`
							: "No files selected"}
					</Text>
					<Pressable
						onPress={handleConfirm}
						disabled={selectedFiles.size === 0}
						className="px-4 py-2 rounded-lg"
						style={{
							backgroundColor: selectedFiles.size > 0 ? colors.primary : colors.muted,
							opacity: selectedFiles.size === 0 ? 0.5 : 1,
						}}
					>
						<Text
							style={[
								typography.uiLabel,
								{
									color: selectedFiles.size > 0 ? colors.primaryForeground : colors.mutedForeground,
									fontWeight: "600",
								},
							]}
						>
							Attach Files
						</Text>
					</Pressable>
				</View>
			</View>
		</Modal>
	);
}
