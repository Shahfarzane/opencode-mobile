import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { FixedLineHeights, FontSizes, Radius, typography, useTheme } from "@/theme";
import { MAX_CODE_BLOCK_HEIGHT } from "./CodeBlock.styles";

// Chevron icon component
function ChevronIcon({
	expanded,
	color,
}: {
	expanded: boolean;
	color: string;
}) {
	return (
		<Svg
			width={12}
			height={12}
			viewBox="0 0 24 24"
			fill="none"
			style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}
		>
			<Path
				d="M9 18l6-6-6-6"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

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
	const [expanded, setExpanded] = useState(true);

	const languageColor =
		LANGUAGE_COLORS[language.toLowerCase()] || colors.mutedForeground;

	const handleCopy = useCallback(async () => {
		await Clipboard.setStringAsync(code);
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [code]);

	const handleToggle = useCallback(() => {
		Haptics.selectionAsync();
		setExpanded((prev) => !prev);
	}, []);

	const trimmedCode = code.replace(/\n$/, "");
	const lines = trimmedCode.split("\n");

	// Tokenize each line for syntax highlighting
	const highlightedLines = useMemo(() => {
		return lines.map((line) => tokenize(line, language));
	}, [lines, language]);

	return (
		<View
			style={{
				marginVertical: 8,
				borderRadius: Radius.lg,
				borderColor: colors.border,
				borderWidth: 1,
				overflow: "hidden",
			}}
		>
			{/* Header - always visible, tappable to toggle */}
			<Pressable
				onPress={handleToggle}
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingHorizontal: 12,
					paddingVertical: 8,
					backgroundColor: colors.muted,
				}}
			>
				<View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
					<ChevronIcon expanded={expanded} color={colors.mutedForeground} />
					<View
						style={{
							width: 10,
							height: 10,
							borderRadius: Radius.full,
							backgroundColor: languageColor,
						}}
					/>
					<Text style={[typography.micro, { color: colors.mutedForeground }]}>
						{language || "text"}
					</Text>
					<Text
						style={[
							typography.micro,
							{ color: colors.mutedForeground, opacity: 0.6 },
						]}
					>
						({lines.length} {lines.length === 1 ? "line" : "lines"})
					</Text>
				</View>
				<Pressable
					onPress={(e) => {
						e.stopPropagation();
						handleCopy();
					}}
					style={{ paddingHorizontal: 8, paddingVertical: 4 }}
				>
					<Text style={[typography.micro, { color: colors.mutedForeground }]}>
						{copied ? "Copied!" : "Copy"}
					</Text>
				</Pressable>
			</Pressable>

			{/* Code content - collapsible */}
			{expanded && (
				<ScrollView
					horizontal
					style={{ backgroundColor: colors.card }}
					showsHorizontalScrollIndicator={true}
					contentContainerStyle={{ flexGrow: 0 }}
				>
					<View
						style={{
							flexDirection: "row",
							padding: 12,
							maxHeight: MAX_CODE_BLOCK_HEIGHT,
						}}
					>
						<View style={{ marginRight: 12, alignItems: "flex-end" }}>
							{lines.map((_, lineNum) => (
								<Text
									key={`num-${lineNum + 1}`}
									style={{
										fontFamily: typography.code.fontFamily,
										fontSize: FontSizes.code,
										lineHeight: FixedLineHeights.code,
										color: colors.mutedForeground,
										opacity: 0.5,
									}}
								>
									{lineNum + 1}
								</Text>
							))}
						</View>
						<View>
							{highlightedLines.map((tokens, lineNum) => (
								<View
									key={`line-${lineNum + 1}`}
									style={{ flexDirection: "row", flexWrap: "nowrap" }}
								>
									{tokens.length > 0 ? (
										tokens.map((token, tokenIdx) => (
											<Text
												key={`token-${lineNum + 1}-${tokenIdx + 1}`}
												style={{
													fontFamily: typography.code.fontFamily,
													fontSize: FontSizes.code,
													lineHeight: FixedLineHeights.code,
													color: getTokenColor(token.type, isDark),
												}}
											>
												{token.text}
											</Text>
										))
									) : (
										<Text
											style={{
												fontFamily: typography.code.fontFamily,
												fontSize: FontSizes.code,
												lineHeight: FixedLineHeights.code,
												color: colors.foreground,
											}}
										>
											{" "}
										</Text>
									)}
								</View>
							))}
						</View>
					</View>
				</ScrollView>
			)}
		</View>
	);
}
