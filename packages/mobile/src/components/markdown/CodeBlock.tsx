import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { typography, useTheme } from "@/theme";

type CodeBlockProps = {
	code: string;
	language: string;
};

const LANGUAGE_COLORS: Record<string, string> = {
	typescript: "#3178C6",
	javascript: "#F7DF1E",
	python: "#3776AB",
	rust: "#DEA584",
	go: "#00ADD8",
	ruby: "#CC342D",
	java: "#B07219",
	swift: "#F05138",
	kotlin: "#A97BFF",
	css: "#1572B6",
	html: "#E34F26",
	json: "#292929",
	yaml: "#CB171E",
	bash: "#4EAA25",
	shell: "#4EAA25",
	sql: "#336791",
	graphql: "#E10098",
	markdown: "#083FA1",
	tsx: "#3178C6",
	jsx: "#61DAFB",
};

// Simple syntax highlighting tokens
type TokenType =
	| "keyword"
	| "string"
	| "comment"
	| "number"
	| "function"
	| "default";

interface Token {
	type: TokenType;
	text: string;
}

// Get syntax highlighting colors based on theme
function getTokenColor(type: TokenType, isDark: boolean): string {
	const colors = isDark
		? {
				keyword: "#C586C0", // purple
				string: "#CE9178", // orange
				comment: "#6A9955", // green
				number: "#B5CEA8", // light green
				function: "#DCDCAA", // yellow
				default: "#D4D4D4", // light gray
			}
		: {
				keyword: "#AF00DB", // purple
				string: "#A31515", // red
				comment: "#008000", // green
				number: "#098658", // teal
				function: "#795E26", // brown
				default: "#000000", // black
			};
	return colors[type];
}

// Keywords for common languages
const KEYWORDS: Record<string, Set<string>> = {
	typescript: new Set([
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
		"import",
		"export",
		"from",
		"async",
		"await",
		"try",
		"catch",
		"throw",
		"new",
		"this",
		"true",
		"false",
		"null",
		"undefined",
		"extends",
		"implements",
		"private",
		"public",
		"protected",
		"static",
		"readonly",
	]),
	javascript: new Set([
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
		"import",
		"export",
		"from",
		"async",
		"await",
		"try",
		"catch",
		"throw",
		"new",
		"this",
		"true",
		"false",
		"null",
		"undefined",
	]),
	python: new Set([
		"def",
		"class",
		"return",
		"if",
		"else",
		"elif",
		"for",
		"while",
		"import",
		"from",
		"try",
		"except",
		"raise",
		"with",
		"as",
		"True",
		"False",
		"None",
		"and",
		"or",
		"not",
		"in",
		"is",
		"lambda",
		"pass",
		"break",
		"continue",
	]),
	rust: new Set([
		"fn",
		"let",
		"mut",
		"const",
		"if",
		"else",
		"for",
		"while",
		"loop",
		"match",
		"impl",
		"struct",
		"enum",
		"trait",
		"pub",
		"use",
		"mod",
		"return",
		"self",
		"true",
		"false",
		"async",
		"await",
		"move",
		"ref",
		"where",
	]),
	go: new Set([
		"func",
		"var",
		"const",
		"if",
		"else",
		"for",
		"range",
		"switch",
		"case",
		"return",
		"struct",
		"interface",
		"package",
		"import",
		"type",
		"true",
		"false",
		"nil",
		"go",
		"defer",
		"chan",
		"map",
		"make",
		"new",
	]),
};

// Simple tokenizer for syntax highlighting
function tokenize(code: string, language: string): Token[] {
	const tokens: Token[] = [];
	const lang = language
		.toLowerCase()
		.replace("tsx", "typescript")
		.replace("jsx", "javascript");
	const keywords = KEYWORDS[lang] || KEYWORDS.typescript || new Set();

	let i = 0;
	while (i < code.length) {
		// Skip whitespace
		if (/\s/.test(code[i])) {
			let ws = "";
			while (i < code.length && /\s/.test(code[i])) {
				ws += code[i++];
			}
			tokens.push({ type: "default", text: ws });
			continue;
		}

		// Comments
		if (code.slice(i, i + 2) === "//") {
			let comment = "";
			while (i < code.length && code[i] !== "\n") {
				comment += code[i++];
			}
			tokens.push({ type: "comment", text: comment });
			continue;
		}

		// Multi-line comments
		if (code.slice(i, i + 2) === "/*") {
			let comment = "";
			while (i < code.length && code.slice(i, i + 2) !== "*/") {
				comment += code[i++];
			}
			comment += code.slice(i, i + 2);
			i += 2;
			tokens.push({ type: "comment", text: comment });
			continue;
		}

		// Strings
		if (code[i] === '"' || code[i] === "'" || code[i] === "`") {
			const quote = code[i];
			let str = code[i++];
			while (i < code.length && code[i] !== quote) {
				if (code[i] === "\\") str += code[i++];
				if (i < code.length) str += code[i++];
			}
			if (i < code.length) str += code[i++];
			tokens.push({ type: "string", text: str });
			continue;
		}

		// Numbers
		if (/[0-9]/.test(code[i])) {
			let num = "";
			while (i < code.length && /[0-9.xXa-fA-F]/.test(code[i])) {
				num += code[i++];
			}
			tokens.push({ type: "number", text: num });
			continue;
		}

		// Words (keywords, identifiers, functions)
		if (/[a-zA-Z_$]/.test(code[i])) {
			let word = "";
			while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
				word += code[i++];
			}
			// Check if it's a function call
			const isFunction = code[i] === "(";
			if (keywords.has(word)) {
				tokens.push({ type: "keyword", text: word });
			} else if (isFunction) {
				tokens.push({ type: "function", text: word });
			} else {
				tokens.push({ type: "default", text: word });
			}
			continue;
		}

		// Operators and punctuation
		tokens.push({ type: "default", text: code[i++] });
	}

	return tokens;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
	const { colors, isDark } = useTheme();
	const [copied, setCopied] = useState(false);

	const languageColor =
		LANGUAGE_COLORS[language.toLowerCase()] || colors.mutedForeground;

	const handleCopy = useCallback(async () => {
		await Clipboard.setStringAsync(code);
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [code]);

	const trimmedCode = code.replace(/\n$/, "");
	const lines = trimmedCode.split("\n");

	// Tokenize each line for syntax highlighting
	const highlightedLines = useMemo(() => {
		return lines.map((line) => tokenize(line, language));
	}, [lines, language]);

	return (
		<View style={[styles.container, { borderColor: colors.border }]}>
			<View style={[styles.header, { backgroundColor: colors.muted }]}>
				<View style={styles.languageInfo}>
					<View
						style={[styles.languageDot, { backgroundColor: languageColor }]}
					/>
					<Text style={[typography.micro, { color: colors.mutedForeground }]}>
						{language || "text"}
					</Text>
				</View>
				<Pressable onPress={handleCopy} style={styles.copyButton}>
					<Text style={[typography.micro, { color: colors.mutedForeground }]}>
						{copied ? "Copied!" : "Copy"}
					</Text>
				</Pressable>
			</View>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={true}
				style={[styles.codeScrollView, { backgroundColor: colors.card }]}
				contentContainerStyle={styles.codeScrollContent}
				nestedScrollEnabled={true}
			>
				<ScrollView
					nestedScrollEnabled={true}
					showsVerticalScrollIndicator={true}
					style={styles.verticalScrollView}
					contentContainerStyle={styles.verticalScrollContent}
				>
					<View style={styles.codeContent}>
						<View style={styles.lineNumbers}>
							{lines.map((_, lineNum) => (
								<Text
									key={`num-${lines[lineNum]}-${lineNum}`}
									style={[
										typography.code,
										styles.lineNumber,
										{ color: colors.mutedForeground },
									]}
								>
									{lineNum + 1}
								</Text>
							))}
						</View>
						<View style={styles.codeLines}>
							{highlightedLines.map((tokens, lineNum) => (
								<Text
									key={`line-${lineNum}-${tokens.length}`}
									style={[typography.code, styles.codeLine]}
									numberOfLines={1}
								>
									{tokens.length > 0 ? (
										tokens.map((token, tokenIdx) => (
											<Text
												key={`token-${lineNum}-${tokenIdx}-${token.text}`}
												style={{ color: getTokenColor(token.type, isDark) }}
											>
												{token.text}
											</Text>
										))
									) : (
										<Text style={{ color: colors.foreground }}> </Text>
									)}
								</Text>
							))}
						</View>
					</View>
				</ScrollView>
			</ScrollView>
		</View>
	);
}

const MAX_CODE_BLOCK_HEIGHT = 400;

const styles = StyleSheet.create({
	container: {
		marginVertical: 8,
		overflow: "hidden",
		borderRadius: 8,
		borderWidth: 1,
		width: "100%",
		alignSelf: "stretch",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	languageInfo: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	languageDot: {
		height: 10,
		width: 10,
		borderRadius: 5,
	},
	copyButton: {
		borderRadius: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	codeScrollView: {
		maxHeight: MAX_CODE_BLOCK_HEIGHT,
	},
	codeScrollContent: {
		flexGrow: 1,
	},
	verticalScrollView: {
		flex: 1,
	},
	verticalScrollContent: {
		flexGrow: 1,
	},
	codeContent: {
		flexDirection: "row",
		padding: 12,
	},
	codeLines: {
		flexShrink: 0,
	},
	lineNumbers: {
		marginRight: 12,
		alignItems: "flex-end",
	},
	lineNumber: {
		lineHeight: 20,
		opacity: 0.5,
	},
	codeLine: {
		lineHeight: 20,
	},
});
