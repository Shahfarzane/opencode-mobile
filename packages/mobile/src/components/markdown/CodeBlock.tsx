import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useTheme, typography } from "@/theme";

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

export function CodeBlock({ code, language }: CodeBlockProps) {
	const { colors } = useTheme();
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
				showsHorizontalScrollIndicator={false}
				style={{ backgroundColor: colors.card }}
			>
				<View style={styles.codeContent}>
					<View style={styles.lineNumbers}>
						{lines.map((line, lineNum) => (
							<Text
								key={`num-${lineNum}-${line.length}`}
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
					<View>
						{lines.map((line, lineNum) => (
							<Text
								key={`line-${lineNum}-${line.slice(0, 10)}`}
								style={[typography.code, styles.codeLine, { color: colors.foreground }]}
							>
								{line || " "}
							</Text>
						))}
					</View>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginVertical: 8,
		overflow: 'hidden',
		borderRadius: 8,
		borderWidth: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	languageInfo: {
		flexDirection: 'row',
		alignItems: 'center',
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
	codeContent: {
		flexDirection: 'row',
		padding: 12,
	},
	lineNumbers: {
		marginRight: 12,
		alignItems: 'flex-end',
	},
	lineNumber: {
		lineHeight: 20,
		opacity: 0.5,
	},
	codeLine: {
		lineHeight: 20,
	},
});
