import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { type GitStatus, type GitStatusFile, gitApi } from "../../src/api";
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { typography, useTheme } from "../../src/theme";

interface DiffLine {
	type: "add" | "remove" | "context" | "header" | "chunk";
	content: string;
	lineNumber?: { old?: number; new?: number };
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

// Simple syntax highlighting for code
function highlightCode(code: string, extension?: string): React.ReactNode[] {
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
				</Text>
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
				</Text>
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
				</Text>
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
					</Text>
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
	extension,
}: {
	line: DiffLine;
	extension?: string;
}) {
	const { colors, isDark } = useTheme();

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

	const getLineNum = () => {
		if (line.type === "add") return line.lineNumber?.new?.toString() ?? "";
		if (line.type === "remove") return line.lineNumber?.old?.toString() ?? "";
		if (line.type === "context")
			return line.lineNumber?.new?.toString() ?? "";
		return "";
	};

	if (line.type === "header" || line.type === "chunk") {
		return (
			<View style={[styles.diffLine, { backgroundColor: style.bg }]}>
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
		<View style={[styles.diffLine, { backgroundColor: style.bg }]}>
			<View style={[styles.lineNumber, { borderRightColor: colors.border }]}>
				<Text
					style={[
						typography.code,
						{ color: colors.mutedForeground, fontSize: 10 },
					]}
				>
					{getLineNum()}
				</Text>
			</View>
			<Text style={[styles.lineSign, { color: style.sign }]}>{getSign()}</Text>
			<ScrollView horizontal showsHorizontalScrollIndicator={false}>
				<Text style={[typography.code, { color: colors.foreground, fontSize: 12 }]}>
					{highlightCode(line.content, extension)}
				</Text>
			</ScrollView>
		</View>
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
					<Path
						d="M14 2v6h6"
						stroke={colors.foreground}
						strokeWidth={2}
					/>
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

function EmptyState({
	title,
	message,
}: {
	title: string;
	message: string;
}) {
	const { colors } = useTheme();

	return (
		<View style={styles.emptyState}>
			<Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
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

	const [status, setStatus] = useState<GitStatus | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedFile, setSelectedFile] = useState<string | null>(null);
	const [diffContent, setDiffContent] = useState<string | null>(null);
	const [isLoadingDiff, setIsLoadingDiff] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadStatus = useCallback(async () => {
		if (!isConnected || !directory) {
			setError("Not connected");
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

			// Auto-select first changed file if none selected
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

	const loadDiff = useCallback(async (path: string) => {
		setIsLoadingDiff(true);
		try {
			const result = await gitApi.getDiff(path);
			setDiffContent(result.diff);
		} catch (err) {
			console.error("Failed to load diff:", err);
			setDiffContent(null);
		} finally {
			setIsLoadingDiff(false);
		}
	}, []);

	useEffect(() => {
		loadStatus();
	}, [loadStatus]);

	useEffect(() => {
		if (selectedFile) {
			loadDiff(selectedFile);
		}
	}, [selectedFile, loadDiff]);

	const changedFiles = status?.files ?? [];
	const parsedDiff = diffContent ? parseDiff(diffContent) : [];
	const fileExtension = selectedFile?.split(".").pop();

	if (isLoading) {
		return (
			<View
				style={[
					styles.container,
					styles.centered,
					{ backgroundColor: colors.background, paddingTop: insets.top },
				]}
			>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	if (error) {
		return (
			<View
				style={[
					styles.container,
					{ backgroundColor: colors.background, paddingTop: insets.top },
				]}
			>
				<EmptyState title="Unable to load" message={error} />
			</View>
		);
	}

	if (changedFiles.length === 0) {
		return (
			<View
				style={[
					styles.container,
					{ backgroundColor: colors.background, paddingTop: insets.top },
				]}
			>
				<EmptyState
					title="No changes"
					message="Working tree is clean. Make some changes to see diffs."
				/>
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
			{/* File Selector */}
			<View style={[styles.selectorWrapper, { borderBottomColor: colors.border }]}>
				<FileSelector
					files={changedFiles}
					selectedPath={selectedFile}
					onSelect={setSelectedFile}
					diffStats={status?.diffStats}
					isOpen={isDropdownOpen}
					onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
				/>
			</View>

			{/* Diff Content */}
			{isLoadingDiff ? (
				<View style={[styles.centered, { flex: 1 }]}>
					<ActivityIndicator size="small" color={colors.primary} />
				</View>
			) : parsedDiff.length > 0 ? (
				<FlatList
					data={parsedDiff}
					keyExtractor={(_, index) => index.toString()}
					renderItem={({ item }) => (
						<DiffLineComponent line={item} extension={fileExtension} />
					)}
					style={styles.diffList}
					contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
				/>
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
	fileSelectorContainer: {
		position: "relative",
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
	},
	diffLine: {
		flexDirection: "row",
		alignItems: "stretch",
		minHeight: 22,
		paddingRight: 8,
	},
	lineNumber: {
		width: 40,
		paddingHorizontal: 4,
		borderRightWidth: 1,
		alignItems: "flex-end",
		justifyContent: "center",
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
});
