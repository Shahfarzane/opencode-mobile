import MarkdownLib from "@ronradtke/react-native-markdown-display";
import type { ComponentType } from "react";
import { useTheme } from "@/theme";
import { CodeBlock } from "./CodeBlock";

// React 19 compatibility: library types are incompatible with React 19's stricter render() return type
const Markdown = MarkdownLib as unknown as ComponentType<{
	style?: Record<string, unknown>;
	rules?: Record<string, unknown>;
	children?: React.ReactNode;
}>;

type MarkdownRendererProps = {
	content: string;
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
	const { colors } = useTheme();

	const rules = {
		fence: (node: { key: string; content: string; sourceInfo: string }) => (
			<CodeBlock
				key={node.key}
				code={node.content}
				language={node.sourceInfo || "text"}
			/>
		),
		code_inline: (node: { key: string; content: string }) => (
			<Markdown
				key={node.key}
				style={{
					code_inline: {
						fontFamily: "IBMPlexMono-Regular",
						fontSize: 13,
						backgroundColor: colors.muted,
						color: colors.foreground,
						paddingHorizontal: 4,
						paddingVertical: 2,
						borderRadius: 4,
					},
				}}
			>
				{`\`${node.content}\``}
			</Markdown>
		),
	};

	const styles = {
		body: {
			color: colors.foreground,
			fontFamily: "IBMPlexMono-Regular",
			fontSize: 15,
			lineHeight: 22,
		},
		heading1: {
			color: colors.foreground,
			fontFamily: "IBMPlexMono-Bold",
			fontSize: 20,
			marginTop: 16,
			marginBottom: 8,
		},
		heading2: {
			color: colors.foreground,
			fontFamily: "IBMPlexMono-SemiBold",
			fontSize: 18,
			marginTop: 14,
			marginBottom: 6,
		},
		heading3: {
			color: colors.foreground,
			fontFamily: "IBMPlexMono-SemiBold",
			fontSize: 16,
			marginTop: 12,
			marginBottom: 4,
		},
		paragraph: {
			marginTop: 0,
			marginBottom: 8,
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
		},
		bullet_list: {
			marginBottom: 8,
		},
		ordered_list: {
			marginBottom: 8,
		},
		code_block: {
			backgroundColor: colors.muted,
			borderRadius: 8,
			padding: 12,
			fontFamily: "IBMPlexMono-Regular",
			fontSize: 13,
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
			fontFamily: "IBMPlexMono-SemiBold",
		},
		td: {
			padding: 8,
			borderTopColor: colors.border,
			borderTopWidth: 1,
		},
		strong: {
			fontFamily: "IBMPlexMono-SemiBold",
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
