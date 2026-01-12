import type BottomSheet from "@gorhom/bottom-sheet";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	Text,
	View,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { type FileListEntry, filesApi } from "@/api/files";
import {
	CheckIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	FileIcon,
	FolderIcon,
	XIcon,
} from "@/components/icons";
import { Button, SearchInput } from "@/components/ui";
import { Sheet } from "@/components/ui/sheet";
import { typography, useTheme } from "@/theme";
import { OPACITY, withOpacity } from "@/utils/colors";

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
	const sheetRef = useRef<BottomSheet>(null);
	const snapPoints = useMemo(() => ["82%", "95%"], []);

	const [loading, setLoading] = useState(false);
	const [searching, setSearching] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
	const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
	const [childrenByDir, setChildrenByDir] = useState<
		Record<string, FileInfo[]>
	>({});
	const [searchResults, setSearchResults] = useState<FileInfo[]>([]);

	const loadedDirsRef = useRef<Set<string>>(new Set());
	const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (visible) {
			// Use requestAnimationFrame to ensure sheet is ready
			requestAnimationFrame(() => {
				setTimeout(() => {
					sheetRef.current?.snapToIndex(0);
				}, 100);
			});
		} else {
			sheetRef.current?.close();
		}
	}, [visible]);

	const mapEntries = useCallback((entries: FileListEntry[]): FileInfo[] => {
		return entries
			.filter((entry) => !entry.name.startsWith("."))
			.map((entry) => ({
				name: entry.name,
				path: entry.path,
				type: entry.isDirectory ? ("directory" as const) : ("file" as const),
				extension:
					!entry.isDirectory && entry.name.includes(".")
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

	const loadDirectory = useCallback(
		async (dirPath: string) => {
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
			} catch {
				setError("Failed to load directory");
				setChildrenByDir((prev) => ({ ...prev, [dirPath]: [] }));
			} finally {
				setLoading(false);
			}
		},
		[mapEntries],
	);

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
						extension: r.path.includes(".")
							? r.path.split(".").pop()?.toLowerCase()
							: undefined,
						relativePath: r.path.replace(`${rootDirectory}/`, ""),
					})),
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

	const toggleDirectory = useCallback(
		async (dirPath: string) => {
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
		},
		[expandedDirs, loadDirectory],
	);

	const toggleFileSelection = useCallback(
		(filePath: string) => {
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
		},
		[multiSelect],
	);

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

	const getFileIconColor = useCallback(
		(extension?: string) => {
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
		},
		[colors],
	);

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
					<TouchableOpacity
						onPress={() => {
							if (isDirectory) {
								void toggleDirectory(item.path);
							} else {
								toggleFileSelection(item.path);
							}
						}}
						activeOpacity={0.7}
						className="flex-row items-center py-2 px-3"
						style={[
							{ paddingLeft: 12 + level * 16 },
							!isDirectory &&
								isSelected && {
									backgroundColor: withOpacity(colors.primary, OPACITY.active),
								},
						]}
					>
						{isDirectory ? (
							<>
								{isExpanded ? (
									<ChevronDownIcon size={14} color={colors.mutedForeground} />
								) : (
									<ChevronRightIcon size={14} color={colors.mutedForeground} />
								)}
								<FolderIcon
									size={16}
									color={colors.primary}
									style={{ marginLeft: 4 }}
								/>
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
					</TouchableOpacity>

					{isDirectory && isExpanded && children.length > 0 && (
						<View>
							{children.map((child) =>
								renderFileItem({ item: child, level: level + 1 }),
							)}
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
		],
	);

	const displayItems = isSearchActive ? searchResults : rootItems;

	if (!visible) {
		return null;
	}

	return (
		<Sheet
			ref={sheetRef}
			snapPoints={snapPoints}
			onClose={onClose}
			contentPadding={0}
			enablePanDownToClose={true}
		>
			<View className="flex-1">
				<View className="flex-row items-center justify-between px-4 pt-2 pb-3">
					<TouchableOpacity onPress={() => sheetRef.current?.close()} hitSlop={8} activeOpacity={0.7}>
						<XIcon size={24} color={colors.foreground} />
					</TouchableOpacity>
					<Text
						style={[
							typography.uiLabel,
							{ color: colors.foreground, fontWeight: "600" },
						]}
					>
						Select Project Files
					</Text>
					<View style={{ width: 24 }} />
				</View>
				<View className="border-t" style={{ borderTopColor: colors.border }} />

				<View
					className="px-4 py-2 border-b"
					style={{ borderBottomColor: colors.border }}
				>
					<SearchInput
						value={searchQuery}
						onChangeText={setSearchQuery}
						placeholder="Search files..."
					/>
				</View>

				<View className="flex-1">
					{loading && !isSearchActive && displayItems.length === 0 && (
						<View className="flex-1 items-center justify-center">
							<ActivityIndicator color={colors.primary} />
							<Text
								style={[
									typography.uiLabel,
									{ color: colors.mutedForeground, marginTop: 8 },
								]}
							>
								Loading files...
							</Text>
						</View>
					)}

					{error && (
						<View className="flex-1 items-center justify-center px-4">
							<Text
								style={[
									typography.uiLabel,
									{ color: colors.destructive, textAlign: "center" },
								]}
							>
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
							<Text
								style={[typography.uiLabel, { color: colors.mutedForeground }]}
							>
								{isSearchActive ? "No files found" : "No files in directory"}
							</Text>
						</View>
					)}

					{!loading && !error && displayItems.length > 0 && (
						<BottomSheetFlatList<FileInfo>
							data={displayItems}
							keyExtractor={(item: FileInfo) => item.path}
							renderItem={({ item }: { item: FileInfo }) => renderFileItem({ item, level: 0 })}
							showsVerticalScrollIndicator={false}
							keyboardShouldPersistTaps="handled"
						/>
					)}
				</View>

				<View
					className="flex-row items-center justify-between px-4 py-3 border-t"
					style={{ borderTopColor: colors.border }}
				>
					<Text style={[typography.micro, { color: colors.mutedForeground }]}>
						{selectedFiles.size > 0
							? `${selectedFiles.size} file${selectedFiles.size !== 1 ? "s" : ""} selected`
							: "No files selected"}
					</Text>
					<Button
						variant={selectedFiles.size > 0 ? "primary" : "muted"}
						size="sm"
						onPress={handleConfirm}
						isDisabled={selectedFiles.size === 0}
					>
						<Button.Label>Attach Files</Button.Label>
					</Button>
				</View>
			</View>
		</Sheet>
	);
}
