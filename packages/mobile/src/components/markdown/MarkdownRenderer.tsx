import MarkdownLib from "@ronradtke/react-native-markdown-display";
import type { ComponentType, ReactNode } from "react";
import { Text, View, type TextStyle, type ViewStyle } from "react-native";
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
		code_block: (node: RuleNode) => (
			<CodeBlock
				key={node.key}
				code={node.content ?? ""}
				language="text"
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
					fontSize: 14,
					lineHeight: 20,
					backgroundColor: colors.muted,
					color: colors.foreground,
					paddingHorizontal: 6,
					paddingVertical: 2,
					borderRadius: 4,
					overflow: "hidden",
				}}
			>
				{node.content}
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
		// Headings use Sans font with em-proportional sizes (matching PWA streamdown)
		// PWA uses: h1=1.125em, h2=1.0625em, h3=1em, h4-h6=1em relative to body
		heading1: {
			color: colors.foreground,
			fontFamily: FontFamilySans.semiBold,
			fontSize: Math.round(FontSizes.markdown * 1.125), // ~18px (PWA: 1.125em)
			lineHeight: Math.round(FontSizes.markdown * 1.125 * 1.25), // tight line-height
			marginTop: FontSizes.markdown, // 1em = 16px
			marginBottom: FontSizes.markdown * 0.5, // 0.5em = 8px
		},
		heading2: {
			color: colors.foreground,
			fontFamily: FontFamilySans.semiBold,
			fontSize: Math.round(FontSizes.markdown * 1.0625), // ~17px (PWA: 1.0625em)
			lineHeight: Math.round(FontSizes.markdown * 1.0625 * 1.25),
			marginTop: FontSizes.markdown, // 1em = 16px
			marginBottom: FontSizes.markdown * 0.5, // 0.5em = 8px
		},
		heading3: {
			color: colors.foreground,
			fontFamily: FontFamilySans.semiBold,
			fontSize: FontSizes.markdown, // 16px (PWA: 1em)
			lineHeight: Math.round(FontSizes.markdown * 1.25),
			marginTop: FontSizes.markdown * 0.75, // 0.75em = 12px
			marginBottom: FontSizes.markdown * 0.5, // 0.5em = 8px
		},
		heading4: {
			color: colors.foreground,
			fontFamily: FontFamilySans.semiBold,
			fontSize: FontSizes.markdown, // 16px (PWA: 1em)
			lineHeight: Math.round(FontSizes.markdown * 1.25),
			marginTop: FontSizes.markdown * 0.75,
			marginBottom: FontSizes.markdown * 0.5,
		},
		heading5: {
			color: colors.foreground,
			fontFamily: FontFamilySans.semiBold,
			fontSize: FontSizes.markdown,
			lineHeight: Math.round(FontSizes.markdown * 1.25),
			marginTop: FontSizes.markdown * 0.75,
			marginBottom: FontSizes.markdown * 0.5,
		},
		heading6: {
			color: colors.foreground,
			fontFamily: FontFamilySans.semiBold,
			fontSize: FontSizes.markdown,
			lineHeight: Math.round(FontSizes.markdown * 1.25),
			marginTop: FontSizes.markdown * 0.75,
			marginBottom: FontSizes.markdown * 0.5,
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
		// Code blocks - minimal style since CodeBlock component handles rendering
		code_block: {
			backgroundColor: "transparent",
			padding: 0,
			margin: 0,
		},
		fence: {
			backgroundColor: "transparent",
			padding: 0,
			margin: 0,
		},
		hr: {
			backgroundColor: colors.border,
			height: 1,
			marginVertical: 16,
		},
		table: {
			borderWidth: 1,
			borderColor: colors.border,
			borderRadius: 8,
			marginVertical: 8,
			overflow: "hidden",
		},
		thead: {
			backgroundColor: colors.muted,
		},
		tbody: {},
		tr: {
			borderBottomWidth: 1,
			borderBottomColor: colors.border,
			flexDirection: "row" as const,
		},
		th: {
			padding: 10,
			fontFamily: FontFamilySans.semiBold,
			fontSize: FontSizes.uiLabel,
			color: colors.foreground,
			flex: 1,
			borderRightWidth: 1,
			borderRightColor: colors.border,
		},
		td: {
			padding: 10,
			fontSize: FontSizes.uiLabel,
			color: colors.foreground,
			flex: 1,
			borderRightWidth: 1,
			borderRightColor: colors.border,
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
