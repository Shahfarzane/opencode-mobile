import MarkdownLib from "@ronradtke/react-native-markdown-display";
import type { ComponentType, ReactNode } from "react";
import { Text, type TextStyle, type ViewStyle } from "react-native";
import { FontSizes, FixedLineHeights, FontFamilySans, FontFamilyMono, useTheme } from "@/theme";
import { CodeBlock } from "./CodeBlock";

const Markdown = MarkdownLib as unknown as ComponentType<{
	style?: Record<string, unknown>;
	rules?: Record<string, unknown>;
	children?: ReactNode;
}>;

type MarkdownRendererProps = {
	content: string;
};

interface RuleNode {
	key: string;
	content?: string;
	sourceInfo?: string;
}

interface RuleStyles {
	paragraph?: TextStyle;
	textgroup?: TextStyle;
	[key: string]: TextStyle | ViewStyle | undefined;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
	const { colors } = useTheme();

	const rules = {
		fence: (node: RuleNode) => (
			<CodeBlock
				key={node.key}
				code={node.content ?? ""}
				language={node.sourceInfo || "text"}
			/>
		),
		paragraph: (
			node: RuleNode,
			children: ReactNode,
			_parent: unknown,
			styles: RuleStyles,
		) => (
			<Text key={node.key} style={styles.paragraph}>
				{children}
			</Text>
		),
		textgroup: (
			node: RuleNode,
			children: ReactNode,
			_parent: unknown,
			styles: RuleStyles,
		) => (
			<Text key={node.key} style={styles.textgroup}>
				{children}
			</Text>
		),
		code_inline: (node: RuleNode) => (
			<Text
				key={node.key}
				style={{
					fontFamily: FontFamilyMono.regular,
					fontSize: FontSizes.code,
					backgroundColor: colors.muted,
					color: colors.foreground,
				}}
			>
				{` ${node.content} `}
			</Text>
		),
	};

	const styles = {
		// Body text uses Sans font (matches desktop --font-sans)
		body: {
			color: colors.foreground,
			fontFamily: FontFamilySans.regular,
			fontSize: FontSizes.markdown,
			lineHeight: FixedLineHeights.body, // Fixed 24px (matches desktop)
		},
		// Headings use Sans font
		heading1: {
			color: colors.foreground,
			fontFamily: FontFamilySans.bold,
			fontSize: FontSizes.h1,
			marginTop: 16,
			marginBottom: 8,
		},
		heading2: {
			color: colors.foreground,
			fontFamily: FontFamilySans.semiBold,
			fontSize: FontSizes.h2,
			marginTop: 14,
			marginBottom: 6,
		},
		heading3: {
			color: colors.foreground,
			fontFamily: FontFamilySans.semiBold,
			fontSize: FontSizes.h3,
			marginTop: 12,
			marginBottom: 4,
		},
		paragraph: {
			marginTop: 0,
			marginBottom: 8,
			flexDirection: "row" as const,
			flexWrap: "wrap" as const,
		},
		textgroup: {
			flexDirection: "row" as const,
			flexWrap: "wrap" as const,
		},
		link: {
			color: colors.primary,
			textDecorationLine: "underline" as const,
		},
		blockquote: {
			borderLeftColor: colors.border,
			borderLeftWidth: 4,
			paddingLeft: 12,
			marginLeft: 0,
			backgroundColor: colors.muted,
			borderRadius: 4,
		},
		list_item: {
			marginBottom: 4,
			flexDirection: "row" as const,
			flexWrap: "wrap" as const,
		},
		bullet_list: {
			marginBottom: 8,
		},
		ordered_list: {
			marginBottom: 8,
		},
		// Code blocks use Mono font
		code_block: {
			backgroundColor: colors.muted,
			borderRadius: 8,
			padding: 12,
			fontFamily: FontFamilyMono.regular,
			fontSize: FontSizes.code,
		},
		hr: {
			backgroundColor: colors.border,
			height: 1,
			marginVertical: 16,
		},
		table: {
			borderColor: colors.border,
			borderWidth: 1,
			borderRadius: 8,
			overflow: "hidden" as const,
		},
		thead: {
			backgroundColor: colors.muted,
		},
		th: {
			padding: 8,
			fontFamily: FontFamilySans.semiBold,
		},
		td: {
			padding: 8,
			borderTopColor: colors.border,
			borderTopWidth: 1,
		},
		strong: {
			fontFamily: FontFamilySans.semiBold,
		},
		em: {
			fontStyle: "italic" as const,
		},
		s: {
			textDecorationLine: "line-through" as const,
		},
	};

	return (
		<Markdown style={styles} rules={rules}>
			{content}
		</Markdown>
	);
}
