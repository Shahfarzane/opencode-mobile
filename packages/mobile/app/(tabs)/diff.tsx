import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { type GitStatus, type GitStatusFile, gitApi } from "../../src/api";
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { typography, useTheme } from "../../src/theme";

type DiffViewMode = "unified" | "side-by-side";

// Minimum width for side-by-side mode (narrower threshold for mobile)
const SIDE_BY_SIDE_MIN_WIDTH = 500;

interface DiffLine {
	type: "add" | "remove" | "context" | "header" | "chunk";
	content: string;
	lineNumber?: { old?: number; new?: number };
}

// Side-by-side view types
interface SideBySideLine {
	left: {
		type: "context" | "remove" | "empty" | "chunk" | "header";
		content: string;
		lineNumber: number | null;
	};
	right: {
		type: "context" | "add" | "empty" | "chunk" | "header";
		content: string;
		lineNumber: number | null;
	};
	isChunk?: boolean;
	isHeader?: boolean;
	chunkInfo?: {
		oldStart: number;
		newStart: number;
		oldCount: number;
		newCount: number;
	};
}

function parseDiff(diffText: string): DiffLine[] {
	const lines = diffText.split("\n");
	const result: DiffLine[] = [];
	let oldLine = 0;
	let newLine = 0;

	for (const line of lines) {
		if (line.startsWith("@@")) {
			// Parse chunk header like @@ -1,5 +1,7 @@
			const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
			if (match) {
				oldLine = parseInt(match[1], 10);
				newLine = parseInt(match[2], 10);
			}
			result.push({ type: "chunk", content: line });
		} else if (line.startsWith("+++") || line.startsWith("---")) {
			result.push({ type: "header", content: line });
		} else if (line.startsWith("+")) {
			result.push({
				type: "add",
				content: line.slice(1),
				lineNumber: { new: newLine++ },
			});
		} else if (line.startsWith("-")) {
			result.push({
				type: "remove",
				content: line.slice(1),
				lineNumber: { old: oldLine++ },
			});
		} else if (line.startsWith("diff --git") || line.startsWith("index ")) {
			result.push({ type: "header", content: line });
		} else {
			result.push({
				type: "context",
				content: line.startsWith(" ") ? line.slice(1) : line,
				lineNumber: { old: oldLine++, new: newLine++ },
			});
		}
	}

	return result;
}

function createSideBySidePairs(lines: DiffLine[]): SideBySideLine[] {
	const result: SideBySideLine[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];

		if (line.type === "header") {
			result.push({
				left: { type: "header", content: line.content, lineNumber: null },
				right: { type: "header", content: line.content, lineNumber: null },
				isHeader: true,
			});
			i++;
			continue;
		}

		if (line.type === "chunk") {
			const match = line.content.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
			result.push({
				left: { type: "chunk", content: line.content, lineNumber: null },
				right: { type: "chunk", content: line.content, lineNumber: null },
				isChunk: true,
				chunkInfo: match
					? {
							oldStart: parseInt(match[1], 10),
							newStart: parseInt(match[3], 10),
							oldCount: match[2] ? parseInt(match[2], 10) : 1,
							newCount: match[4] ? parseInt(match[4], 10) : 1,
						}
					: undefined,
			});
			i++;
			continue;
		}

		if (line.type === "context") {
			result.push({
				left: {
					type: "context",
					content: line.content,
					lineNumber: line.lineNumber?.old ?? null,
				},
				right: {
					type: "context",
					content: line.content,
					lineNumber: line.lineNumber?.new ?? null,
				},
			});
			i++;
			continue;
		}

		if (line.type === "remove") {
			const removedLines: DiffLine[] = [];
			while (i < lines.length && lines[i].type === "remove") {
				removedLines.push(lines[i]);
				i++;
			}

			const addedLines: DiffLine[] = [];
			while (i < lines.length && lines[i].type === "add") {
				addedLines.push(lines[i]);
				i++;
			}

			const maxLen = Math.max(removedLines.length, addedLines.length);
			for (let j = 0; j < maxLen; j++) {
				const removed = removedLines[j];
				const added = addedLines[j];

				result.push({
					left: removed
						? {
								type: "remove",
								content: removed.content,
								lineNumber: removed.lineNumber?.old ?? null,
							}
						: { type: "empty", content: "", lineNumber: null },
					right: added
						? {
								type: "add",
								content: added.content,
								lineNumber: added.lineNumber?.new ?? null,
							}
						: { type: "empty", content: "", lineNumber: null },
				});
			}
			continue;
		}

		if (line.type === "add") {
			result.push({
				left: { type: "empty", content: "", lineNumber: null },
				right: {
					type: "add",
					content: line.content,
					lineNumber: line.lineNumber?.new ?? null,
				},
			});
			i++;
			continue;
		}

		i++;
	}

	return result;
}

function highlightCode(code: string): React.ReactNode[] {
	const keywords = [
		"import",
		"export",
		"from",
		"const",
		"let",
		"var",
		"function",
		"return",
		"if",
		"else",
		"for",
		"while",
		"class",
		"interface",
		"type",
		"async",
		"await",
		"try",
		"catch",
		"throw",
		"new",
		"this",
		"super",
		"extends",
		"implements",
		"default",
		"switch",
		"case",
		"break",
		"continue",
		"true",
		"false",
		"null",
		"undefined",
	];

	const parts: React.ReactNode[] = [];
	let remaining = code;
	let key = 0;

	while (remaining.length > 0) {
		// Check for string literals
		const stringMatch = remaining.match(/^(["'`])(?:(?!\1)[^\\]|\\.)*\1/);
		if (stringMatch) {
			parts.push(
				<Text key={key++} style={styles.syntaxString}>
					{stringMatch[0]}
				</Text>,
			);
			remaining = remaining.slice(stringMatch[0].length);
			continue;
		}

		// Check for comments
		const commentMatch = remaining.match(/^\/\/[^\n]*/);
		if (commentMatch) {
			parts.push(
				<Text key={key++} style={styles.syntaxComment}>
					{commentMatch[0]}
				</Text>,
			);
			remaining = remaining.slice(commentMatch[0].length);
			continue;
		}

		// Check for numbers
		const numberMatch = remaining.match(/^\b\d+\.?\d*\b/);
		if (numberMatch) {
			parts.push(
				<Text key={key++} style={styles.syntaxNumber}>
					{numberMatch[0]}
				</Text>,
			);
			remaining = remaining.slice(numberMatch[0].length);
			continue;
		}

		// Check for keywords
		const wordMatch = remaining.match(/^\b[a-zA-Z_]\w*\b/);
		if (wordMatch) {
			const word = wordMatch[0];
			if (keywords.includes(word)) {
				parts.push(
					<Text key={key++} style={styles.syntaxKeyword}>
						{word}
					</Text>,
				);
			} else {
				parts.push(<Text key={key++}>{word}</Text>);
			}
			remaining = remaining.slice(word.length);
			continue;
		}

		// Default: single character
		parts.push(<Text key={key++}>{remaining[0]}</Text>);
		remaining = remaining.slice(1);
	}

	return parts;
}

function DiffLineComponent({
	line,
	isFirst,
	isLast,
	isNarrow,
}: {
	line: DiffLine;
	isFirst?: boolean;
	isLast?: boolean;
	isNarrow?: boolean;
}) {
	const { colors, isDark } = useTheme();

	const lineNumberWidth = isNarrow ? 32 : 36;

	const getLineStyle = () => {
		switch (line.type) {
			case "add":
				return {
					bg: isDark ? "rgba(74, 222, 128, 0.15)" : "rgba(34, 197, 94, 0.1)",
					sign: colors.success,
				};
			case "remove":
				return {
					bg: isDark ? "rgba(248, 113, 113, 0.15)" : "rgba(239, 68, 68, 0.1)",
					sign: colors.destructive,
				};
			case "chunk":
				return {
					bg: isDark ? "rgba(96, 165, 250, 0.1)" : "rgba(59, 130, 246, 0.05)",
					sign: colors.info,
				};
			case "header":
				return {
					bg: colors.muted,
					sign: colors.mutedForeground,
				};
			default:
				return {
					bg: "transparent",
					sign: colors.mutedForeground,
				};
		}
	};

	const style = getLineStyle();

	const getSign = () => {
		switch (line.type) {
			case "add":
				return "+";
			case "remove":
				return "-";
			default:
				return " ";
		}
	};

	const getOldLineNum = () => {
		if (line.type === "remove" || line.type === "context") {
			return line.lineNumber?.old?.toString() ?? "";
		}
		return "";
	};

	const getNewLineNum = () => {
		if (line.type === "add" || line.type === "context") {
			return line.lineNumber?.new?.toString() ?? "";
		}
		return "";
	};

	const borderRadiusStyle = {
		borderTopLeftRadius: isFirst ? 8 : 0,
		borderTopRightRadius: isFirst ? 8 : 0,
		borderBottomLeftRadius: isLast ? 8 : 0,
		borderBottomRightRadius: isLast ? 8 : 0,
	};

	if (line.type === "header" || line.type === "chunk") {
		return (
			<View
				style={[
					styles.diffLine,
					{ backgroundColor: style.bg },
					borderRadiusStyle,
				]}
			>
				<View style={styles.headerPadding} />
				<Text
					style={[typography.code, { color: style.sign, fontSize: 11 }]}
					numberOfLines={1}
				>
					{line.content}
				</Text>
			</View>
		);
	}

	return (
		<View
			style={[
				styles.diffLine,
				{ backgroundColor: style.bg },
				borderRadiusStyle,
			]}
		>
			<View
				style={[
					styles.lineNumberContainer,
					{ borderRightColor: colors.border },
				]}
			>
				<View style={[styles.lineNumberOld, { width: lineNumberWidth }]}>
					<Text
						style={[
							typography.code,
							{ color: colors.mutedForeground, fontSize: 10 },
						]}
					>
						{getOldLineNum()}
					</Text>
				</View>
				<View style={[styles.lineNumberNew, { width: lineNumberWidth }]}>
					<Text
						style={[
							typography.code,
							{ color: colors.mutedForeground, fontSize: 10 },
						]}
					>
						{getNewLineNum()}
					</Text>
				</View>
			</View>
			<Text style={[styles.lineSign, { color: style.sign }]}>{getSign()}</Text>
			<ScrollView horizontal showsHorizontalScrollIndicator={false}>
				<Text
					style={[typography.code, { color: colors.foreground, fontSize: 12 }]}
				>
					{highlightCode(line.content)}
				</Text>
			</ScrollView>
		</View>
	);
}

const SideBySideColumn = memo(function SideBySideColumn({
	line,
	side,
	width,
}: {
	line: SideBySideLine["left"] | SideBySideLine["right"];
	side: "left" | "right";
	width: number;
}) {
	const { colors, isDark } = useTheme();
	const lineNumberWidth = 32;

	const getBackgroundColor = () => {
		switch (line.type) {
			case "add":
				return isDark ? "rgba(74, 222, 128, 0.15)" : "rgba(34, 197, 94, 0.1)";
			case "remove":
				return isDark ? "rgba(248, 113, 113, 0.15)" : "rgba(239, 68, 68, 0.1)";
			case "empty":
				return isDark
					? "rgba(128, 128, 128, 0.05)"
					: "rgba(128, 128, 128, 0.03)";
			case "chunk":
				return isDark ? "rgba(96, 165, 250, 0.1)" : "rgba(59, 130, 246, 0.05)";
			case "header":
				return colors.muted;
			default:
				return "transparent";
		}
	};

	const getSign = () => {
		switch (line.type) {
			case "add":
				return "+";
			case "remove":
				return "-";
			default:
				return " ";
		}
	};

	const getSignColor = () => {
		switch (line.type) {
			case "add":
				return colors.success;
			case "remove":
				return colors.destructive;
			default:
				return colors.mutedForeground;
		}
	};

	// Border between left and right columns
	const borderStyle =
		side === "left"
			? { borderRightWidth: 1, borderRightColor: colors.border }
			: {};

	if (line.type === "header" || line.type === "chunk") {
		return (
			<View
				style={[
					styles.sideBySideColumn,
					{ width, backgroundColor: getBackgroundColor() },
					borderStyle,
				]}
			>
				<View
					style={[styles.sideBySideLineNumber, { width: lineNumberWidth }]}
				/>
				<Text
					style={[typography.code, { color: colors.info, fontSize: 10 }]}
					numberOfLines={1}
				>
					{side === "left" ? line.content : ""}
				</Text>
			</View>
		);
	}

	if (line.type === "empty") {
		return (
			<View
				style={[
					styles.sideBySideColumn,
					{ width, backgroundColor: getBackgroundColor() },
					borderStyle,
				]}
			>
				<View
					style={[styles.sideBySideLineNumber, { width: lineNumberWidth }]}
				/>
				<Text style={[styles.lineSign, { color: colors.mutedForeground }]}>
					{" "}
				</Text>
			</View>
		);
	}

	return (
		<View
			style={[
				styles.sideBySideColumn,
				{ width, backgroundColor: getBackgroundColor() },
				borderStyle,
			]}
		>
			<View
				style={[
					styles.sideBySideLineNumber,
					{ width: lineNumberWidth, borderRightColor: colors.border },
				]}
			>
				<Text
					style={[
						typography.code,
						{ color: colors.mutedForeground, fontSize: 10 },
					]}
				>
					{line.lineNumber ?? ""}
				</Text>
			</View>
			<Text style={[styles.lineSign, { color: getSignColor() }]}>
				{getSign()}
			</Text>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				nestedScrollEnabled={true}
				style={{ flex: 1 }}
			>
				<Text
					style={[typography.code, { color: colors.foreground, fontSize: 11 }]}
				>
					{highlightCode(line.content)}
				</Text>
			</ScrollView>
		</View>
	);
});

function SideBySideDiffView({ lines }: { lines: DiffLine[] }) {
	const pairs = useMemo(() => createSideBySidePairs(lines), [lines]);
	const { colors } = useTheme();
	const { width } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	// Fix: account for margin (24px total) and border between columns (1px)
	const horizontalMargin = 24; // 12px each side from styles.diffList
	const borderWidth = 1; // border between left and right columns
	const availableWidth = width - horizontalMargin;
	const columnWidth = Math.floor((availableWidth - borderWidth) / 2);

	const renderItem = useCallback(
		({ item, index }: { item: SideBySideLine; index: number }) => {
			const isFirst = index === 0;
			const isLast = index === pairs.length - 1;

			// Apply border radius to row container for cleaner corners
			const rowBorderRadius = {
				borderTopLeftRadius: isFirst ? 8 : 0,
				borderTopRightRadius: isFirst ? 8 : 0,
				borderBottomLeftRadius: isLast ? 8 : 0,
				borderBottomRightRadius: isLast ? 8 : 0,
				overflow: "hidden" as const,
			};

			return (
				<View style={[styles.sideBySideRow, rowBorderRadius]}>
					<SideBySideColumn line={item.left} side="left" width={columnWidth} />
					<SideBySideColumn
						line={item.right}
						side="right"
						width={columnWidth}
					/>
				</View>
			);
		},
		[columnWidth, pairs.length],
	);

	// Fixed row height for getItemLayout optimization
	const ROW_HEIGHT = 22; // matches minHeight in styles.sideBySideColumn

	return (
		<FlatList
			data={pairs}
			keyExtractor={(_, index) => index.toString()}
			renderItem={renderItem}
			getItemLayout={(_, index) => ({
				length: ROW_HEIGHT,
				offset: ROW_HEIGHT * index,
				index,
			})}
			style={[styles.diffList, { backgroundColor: colors.card }]}
			contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
			initialNumToRender={30}
			maxToRenderPerBatch={20}
			windowSize={10}
			removeClippedSubviews={true}
		/>
	);
}

function DiffViewToggle({
	mode,
	onModeChange,
}: {
	mode: DiffViewMode;
	onModeChange: (mode: DiffViewMode) => void;
}) {
	const { colors } = useTheme();

	// Toggle to the opposite mode when pressed
	const handlePress = () => {
		onModeChange(mode === "side-by-side" ? "unified" : "side-by-side");
	};

	// Show the icon of the mode you'll switch TO (opposite of current)
	// When in side-by-side, show unified icon (3 lines)
	// When in unified, show side-by-side icon (columns)
	return (
		<TouchableOpacity
			onPress={handlePress}
			activeOpacity={0.6}
			style={styles.viewToggleButton}
		>
			{mode === "side-by-side" ? (
				// Show unified icon (3 horizontal lines) - RiAlignJustify equivalent
				<Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
					<Path
						d="M4 6h16M4 12h16M4 18h16"
						stroke={colors.mutedForeground}
						strokeWidth={2}
						strokeLinecap="round"
					/>
				</Svg>
			) : (
				// Show side-by-side icon (two columns) - RiLayoutColumnLine equivalent
				<Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
					<Path
						d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h4m6-18h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"
						stroke={colors.mutedForeground}
						strokeWidth={2}
						strokeLinecap="round"
					/>
				</Svg>
			)}
		</TouchableOpacity>
	);
}

function FileSelector({
	files,
	selectedPath,
	onSelect,
	diffStats,
	isOpen,
	onToggle,
}: {
	files: GitStatusFile[];
	selectedPath: string | null;
	onSelect: (path: string) => void;
	diffStats?: Record<string, { insertions: number; deletions: number }>;
	isOpen: boolean;
	onToggle: () => void;
}) {
	const { colors } = useTheme();

	const selectedFile = files.find((f) => f.path === selectedPath);
	const stats = selectedPath ? diffStats?.[selectedPath] : undefined;

	return (
		<View style={styles.fileSelectorContainer}>
			<Pressable
				onPress={onToggle}
				style={[
					styles.fileSelectorButton,
					{
						backgroundColor: colors.card,
						borderColor: colors.border,
					},
				]}
			>
				<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
					<Path
						d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
						stroke={colors.foreground}
						strokeWidth={2}
					/>
					<Path d="M14 2v6h6" stroke={colors.foreground} strokeWidth={2} />
				</Svg>
				<Text
					style={[typography.meta, { color: colors.foreground, flex: 1 }]}
					numberOfLines={1}
				>
					{selectedFile?.path ?? "Select a file..."}
				</Text>
				{stats && (
					<View style={styles.statsInline}>
						{stats.insertions > 0 && (
							<Text
								style={[
									typography.micro,
									{ color: colors.success, fontWeight: "600" },
								]}
							>
								+{stats.insertions}
							</Text>
						)}
						{stats.deletions > 0 && (
							<Text
								style={[
									typography.micro,
									{ color: colors.destructive, fontWeight: "600" },
								]}
							>
								-{stats.deletions}
							</Text>
						)}
					</View>
				)}
				<Svg
					width={16}
					height={16}
					viewBox="0 0 24 24"
					fill="none"
					style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
				>
					<Path
						d="M6 9l6 6 6-6"
						stroke={colors.mutedForeground}
						strokeWidth={2}
						strokeLinecap="round"
					/>
				</Svg>
			</Pressable>

			{isOpen && (
				<View
					style={[
						styles.fileDropdown,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<FlatList
						data={files}
						keyExtractor={(item) => item.path}
						style={styles.fileList}
						renderItem={({ item }) => {
							const itemStats = diffStats?.[item.path];
							const isSelected = item.path === selectedPath;

							return (
								<Pressable
									onPress={() => {
										onSelect(item.path);
										onToggle();
									}}
									style={[
										styles.fileDropdownItem,
										isSelected && { backgroundColor: `${colors.primary}15` },
									]}
								>
									<Text
										style={[
											typography.meta,
											{
												color: isSelected ? colors.primary : colors.foreground,
												flex: 1,
											},
										]}
										numberOfLines={1}
									>
										{item.path}
									</Text>
									{itemStats && (
										<View style={styles.statsInline}>
											{itemStats.insertions > 0 && (
												<Text
													style={[
														typography.micro,
														{ color: colors.success, fontWeight: "600" },
													]}
												>
													+{itemStats.insertions}
												</Text>
											)}
											{itemStats.deletions > 0 && (
												<Text
													style={[
														typography.micro,
														{ color: colors.destructive, fontWeight: "600" },
													]}
												>
													-{itemStats.deletions}
												</Text>
											)}
										</View>
									)}
								</Pressable>
							);
						}}
					/>
				</View>
			)}
		</View>
	);
}

function EmptyState({ title, message }: { title: string; message: string }) {
	const { colors } = useTheme();

	return (
		<View style={styles.emptyState}>
			<Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
				<Path
					d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
					stroke={colors.mutedForeground}
					strokeWidth={1.5}
				/>
				<Path
					d="M14 2v6h6M9 13h6M9 17h6"
					stroke={colors.mutedForeground}
					strokeWidth={1.5}
					strokeLinecap="round"
				/>
			</Svg>
			<Text style={[typography.uiHeader, { color: colors.foreground }]}>
				{title}
			</Text>
			<Text
				style={[
					typography.meta,
					{ color: colors.mutedForeground, textAlign: "center" },
				]}
			>
				{message}
			</Text>
		</View>
	);
}

export default function DiffScreen() {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	const { isConnected, directory } = useConnectionStore();
	const { width: screenWidth } = useWindowDimensions();

	const [status, setStatus] = useState<GitStatus | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedFile, setSelectedFile] = useState<string | null>(null);
	const [diffContent, setDiffContent] = useState<string | null>(null);
	const [isLoadingDiff, setIsLoadingDiff] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<DiffViewMode>("unified");

	const isNarrow = screenWidth < SIDE_BY_SIDE_MIN_WIDTH;

	const loadStatus = useCallback(async () => {
		if (!isConnected) {
			setError("Not connected");
			setIsLoading(false);
			return;
		}

		try {
			setError(null);

			if (!directory) {
				setError("No directory selected");
				setIsLoading(false);
				return;
			}

			const isGit = await gitApi.checkIsGitRepository();
			if (!isGit) {
				setError("Not a git repository");
				setStatus(null);
				return;
			}

			const gitStatus = await gitApi.getStatus();
			setStatus(gitStatus);

			if (!selectedFile && gitStatus.files.length > 0) {
				setSelectedFile(gitStatus.files[0].path);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load status");
			setStatus(null);
		} finally {
			setIsLoading(false);
		}
	}, [isConnected, directory, selectedFile]);

	const loadDiff = useCallback(
		async (path: string) => {
			setIsLoadingDiff(true);
			try {
				// Find the file to check if changes are staged or unstaged
				const file = status?.files.find((f) => f.path === path);
				const hasUnstagedChanges =
					file?.working_dir && file.working_dir !== " ";
				const hasStagedChanges =
					file?.index && file.index !== " " && file.index !== "?";

				let diffText = "";

				// Try unstaged changes first
				if (hasUnstagedChanges) {
					const result = await gitApi.getDiff(path, false);
					diffText = result.diff || "";
				}

				// If no unstaged diff, try staged changes
				if (!diffText && hasStagedChanges) {
					const result = await gitApi.getDiff(path, true);
					diffText = result.diff || "";
				}

				// If still no diff (for untracked files), try to get file content
				if (!diffText && file?.index === "?") {
					// Untracked file - no diff available yet
					diffText = `New untracked file: ${path}\n(Add to staging to see diff)`;
				}

				setDiffContent(diffText || null);
			} catch (err) {
				console.error("Failed to load diff:", err);
				setDiffContent(null);
			} finally {
				setIsLoadingDiff(false);
			}
		},
		[status?.files],
	);

	useEffect(() => {
		loadStatus();
	}, [loadStatus]);

	useEffect(() => {
		if (selectedFile) {
			loadDiff(selectedFile);
		}
	}, [selectedFile, loadDiff]);

	const changedFiles = useMemo(() => status?.files ?? [], [status?.files]);
	const parsedDiff = useMemo(
		() => (diffContent ? parseDiff(diffContent) : []),
		[diffContent],
	);

	if (isLoading) {
		return (
			<View
				style={[
					styles.container,
					styles.centered,
					{ backgroundColor: colors.background },
				]}
			>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	if (error) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<EmptyState title="Unable to load" message={error} />
			</View>
		);
	}

	if (changedFiles.length === 0) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<EmptyState
					title="No changes"
					message="Working tree is clean. Make some changes to see diffs."
				/>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<View
				style={[styles.selectorWrapper, { borderBottomColor: colors.border }]}
			>
				<View style={styles.headerRow}>
					<FileSelector
						files={changedFiles}
						selectedPath={selectedFile}
						onSelect={setSelectedFile}
						diffStats={status?.diffStats}
						isOpen={isDropdownOpen}
						onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
					/>
					<DiffViewToggle
						mode={viewMode}
						onModeChange={setViewMode}
					/>
				</View>
			</View>

			{isLoadingDiff ? (
				<View style={[styles.centered, { flex: 1 }]}>
					<ActivityIndicator size="small" color={colors.primary} />
				</View>
			) : parsedDiff.length > 0 ? (
				viewMode === "side-by-side" ? (
					<SideBySideDiffView lines={parsedDiff} />
				) : (
					<FlatList
						data={parsedDiff}
						keyExtractor={(_, index) => index.toString()}
						renderItem={({ item, index }) => (
							<DiffLineComponent
								line={item}
								isFirst={index === 0}
								isLast={index === parsedDiff.length - 1}
								isNarrow={isNarrow}
							/>
						)}
						style={[styles.diffList, { backgroundColor: colors.card }]}
						contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
					/>
				)
			) : (
				<View style={[styles.centered, { flex: 1 }]}>
					<Text style={[typography.meta, { color: colors.mutedForeground }]}>
						No diff available
					</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	centered: {
		alignItems: "center",
		justifyContent: "center",
	},
	selectorWrapper: {
		padding: 12,
		borderBottomWidth: 1,
		zIndex: 10,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	fileSelectorContainer: {
		position: "relative",
		flex: 1,
	},
	fileSelectorButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		borderRadius: 8,
		borderWidth: 1,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	viewToggleButton: {
		width: 28,
		height: 28,
		alignItems: "center",
		justifyContent: "center",
		opacity: 0.6,
	},
	statsInline: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	fileDropdown: {
		position: "absolute",
		top: "100%",
		left: 0,
		right: 0,
		marginTop: 4,
		borderRadius: 8,
		borderWidth: 1,
		maxHeight: 250,
		overflow: "hidden",
		zIndex: 100,
		elevation: 100,
	},
	fileList: {
		maxHeight: 250,
	},
	fileDropdownItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	diffList: {
		flex: 1,
		overflow: "hidden",
		borderRadius: 8,
		margin: 12,
	},
	diffLine: {
		flexDirection: "row",
		alignItems: "stretch",
		minHeight: 22,
		paddingRight: 8,
	},
	headerPadding: {
		width: 92,
	},
	lineNumberContainer: {
		flexDirection: "row",
		borderRightWidth: 1,
	},
	lineNumberOld: {
		alignItems: "flex-end",
		justifyContent: "center",
		paddingHorizontal: 4,
	},
	lineNumberNew: {
		alignItems: "flex-end",
		justifyContent: "center",
		paddingHorizontal: 4,
	},
	lineSign: {
		width: 20,
		textAlign: "center",
		fontFamily: "IBMPlexMono-Medium",
		fontSize: 12,
	},
	emptyState: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
		paddingHorizontal: 32,
	},
	syntaxKeyword: {
		color: "#C586C0",
	},
	syntaxString: {
		color: "#CE9178",
	},
	syntaxComment: {
		color: "#6A9955",
	},
	syntaxNumber: {
		color: "#B5CEA8",
	},
	sideBySideRow: {
		flexDirection: "row",
	},
	sideBySideColumn: {
		flexDirection: "row",
		alignItems: "stretch",
		minHeight: 22,
		paddingRight: 4,
	},
	sideBySideLineNumber: {
		alignItems: "flex-end",
		justifyContent: "center",
		paddingHorizontal: 4,
		borderRightWidth: 1,
	},
});
