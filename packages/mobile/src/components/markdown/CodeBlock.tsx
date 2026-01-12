import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ChevronRightIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { FixedLineHeights, FontSizes, Radius, Spacing, typography, useTheme } from "@/theme";
import { MAX_CODE_BLOCK_HEIGHT } from "./CodeBlock.styles";

type CodeBlockProps = {
	code: string;
	language: string;
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
	const { colors } = useTheme();
	const [copied, setCopied] = useState(false);
	const [expanded, setExpanded] = useState(true);

	const languageColor = colors.syntaxType;

	const tokenColors = useMemo(
		() => ({
			keyword: colors.syntaxKeyword,
			string: colors.syntaxString,
			comment: colors.syntaxComment,
			number: colors.syntaxNumber,
			function: colors.syntaxFunction,
			default: colors.syntaxForeground,
		}),
		[colors],
	);

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
				marginVertical: Spacing[2],
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
					paddingHorizontal: Spacing[3],
					paddingVertical: Spacing[2],
					backgroundColor: colors.muted,
				}}
			>
				<View style={{ flexDirection: "row", alignItems: "center", gap: Spacing[2] }}>
					<ChevronRightIcon
						size={12}
						color={colors.mutedForeground}
						style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}
					/>
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
				<Button
					variant="ghost"
					size="sm"
					onPress={(e) => {
						e.stopPropagation();
						handleCopy();
					}}
					style={{ paddingHorizontal: Spacing[2], paddingVertical: Spacing[1] }}
				>
					<Text style={[typography.micro, { color: colors.mutedForeground }]}>
						{copied ? "Copied!" : "Copy"}
					</Text>
				</Button>
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
							padding: Spacing[3],
							maxHeight: MAX_CODE_BLOCK_HEIGHT,
						}}
					>
						<View style={{ marginRight: Spacing[3], alignItems: "flex-end" }}>
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
													color: tokenColors[token.type] ?? tokenColors.default,
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
