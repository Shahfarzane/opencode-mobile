import { ScrollView, StyleSheet, Text, View } from "react-native";
import { FontSizes, Fonts, fontStyle, typography, useTheme } from "@/theme";
import type { Permission } from "./types";

interface PermissionDetailsProps {
	permission: Permission;
}

function getMeta(
	metadata: Record<string, unknown>,
	key: string,
	fallback: string = "",
): string {
	const val = metadata[key];
	return typeof val === "string"
		? val
		: typeof val === "number"
			? String(val)
			: fallback;
}

function getMetaNum(
	metadata: Record<string, unknown>,
	key: string,
): number | undefined {
	const val = metadata[key];
	return typeof val === "number" ? val : undefined;
}

function BashDetails({ permission }: { permission: Permission }) {
	const { colors } = useTheme();
	const command =
		getMeta(permission.metadata, "command") ||
		getMeta(permission.metadata, "cmd") ||
		getMeta(permission.metadata, "script");
	const description = getMeta(permission.metadata, "description");
	const workingDir =
		getMeta(permission.metadata, "cwd") ||
		getMeta(permission.metadata, "working_directory") ||
		getMeta(permission.metadata, "directory");
	const timeout = getMetaNum(permission.metadata, "timeout");

	return (
		<View style={styles.content}>
			{description && (
				<Text
					style={[
						typography.meta,
						styles.description,
						{ color: colors.mutedForeground },
					]}
				>
					{description}
				</Text>
			)}
			{workingDir && (
				<View style={styles.metaRow}>
					<Text
						style={[
							typography.micro,
							styles.metaLabel,
							{ color: colors.mutedForeground },
						]}
					>
						Directory:
					</Text>
					<View style={[styles.codeInline, { backgroundColor: colors.muted }]}>
						<Text
							style={[typography.code, { color: colors.foreground }]}
							numberOfLines={1}
						>
							{workingDir}
						</Text>
					</View>
				</View>
			)}
			{command && (
				<View style={[styles.codeBlock, { backgroundColor: colors.muted }]}>
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						<Text style={[typography.code, { color: colors.foreground }]}>
							{command}
						</Text>
					</ScrollView>
				</View>
			)}
			{timeout && (
				<Text style={[typography.micro, { color: colors.mutedForeground }]}>
					Timeout: {Math.floor(timeout / 1000)}s
				</Text>
			)}
		</View>
	);
}

function EditDetails({ permission }: { permission: Permission }) {
	const { colors } = useTheme();
	const filePath =
		getMeta(permission.metadata, "file_path") ||
		getMeta(permission.metadata, "path") ||
		getMeta(permission.metadata, "file");
	const description = getMeta(permission.metadata, "description");

	return (
		<View style={styles.content}>
			{description && (
				<Text
					style={[
						typography.meta,
						styles.description,
						{ color: colors.mutedForeground },
					]}
				>
					{description}
				</Text>
			)}
			{filePath && (
				<View style={styles.metaRow}>
					<Text
						style={[
							typography.micro,
							styles.metaLabel,
							{ color: colors.mutedForeground },
						]}
					>
						File:
					</Text>
					<View style={[styles.codeInline, { backgroundColor: colors.muted }]}>
						<Text
							style={[typography.code, { color: colors.foreground }]}
							numberOfLines={1}
						>
							{filePath}
						</Text>
					</View>
				</View>
			)}
		</View>
	);
}

function WriteDetails({ permission }: { permission: Permission }) {
	const { colors } = useTheme();
	const filePath =
		getMeta(permission.metadata, "file_path") ||
		getMeta(permission.metadata, "path");
	const description = getMeta(permission.metadata, "description");

	return (
		<View style={styles.content}>
			{description && (
				<Text
					style={[
						typography.meta,
						styles.description,
						{ color: colors.mutedForeground },
					]}
				>
					{description}
				</Text>
			)}
			{filePath && (
				<View style={styles.metaRow}>
					<Text
						style={[
							typography.micro,
							styles.metaLabel,
							{ color: colors.mutedForeground },
						]}
					>
						File:
					</Text>
					<View style={[styles.codeInline, { backgroundColor: colors.muted }]}>
						<Text
							style={[typography.code, { color: colors.foreground }]}
							numberOfLines={1}
						>
							{filePath}
						</Text>
					</View>
				</View>
			)}
		</View>
	);
}

function WebFetchDetails({ permission }: { permission: Permission }) {
	const { colors } = useTheme();
	const url =
		getMeta(permission.metadata, "url") ||
		getMeta(permission.metadata, "endpoint");
	const method = getMeta(permission.metadata, "method", "GET").toUpperCase();
	const description =
		getMeta(permission.metadata, "description") ||
		getMeta(permission.metadata, "prompt");

	const getMethodColor = () => {
		switch (method) {
			case "GET":
				return colors.info;
			case "POST":
				return colors.success;
			case "PUT":
			case "PATCH":
				return colors.warning;
			case "DELETE":
				return colors.error;
			default:
				return colors.mutedForeground;
		}
	};

	return (
		<View style={styles.content}>
			{description && (
				<Text
					style={[
						typography.meta,
						styles.description,
						{ color: colors.mutedForeground },
					]}
				>
					{description}
				</Text>
			)}
			{url && (
				<View style={styles.requestRow}>
					<View
						style={[
							styles.methodBadge,
							{ backgroundColor: `${getMethodColor()}20` },
						]}
					>
						<Text
							style={[
								typography.micro,
								fontStyle("600"),
								{ color: getMethodColor() },
							]}
						>
							{method}
						</Text>
					</View>
					<View
						style={[styles.urlContainer, { backgroundColor: colors.muted }]}
					>
						<Text
							style={[typography.code, { color: colors.foreground }]}
							numberOfLines={2}
						>
							{url}
						</Text>
					</View>
				</View>
			)}
		</View>
	);
}

function GenericDetails({ permission }: { permission: Permission }) {
	const { colors } = useTheme();
	const description = getMeta(permission.metadata, "description");
	const title = permission.title;

	return (
		<View style={styles.content}>
			{description && (
				<Text
					style={[
						typography.meta,
						styles.description,
						{ color: colors.mutedForeground },
					]}
				>
					{description}
				</Text>
			)}
			{title && !description && (
				<Text style={[typography.meta, { color: colors.foreground }]}>
					{title}
				</Text>
			)}
		</View>
	);
}

function PatternDisplay({ pattern }: { pattern: string | string[] }) {
	const { colors } = useTheme();
	const patterns = Array.isArray(pattern) ? pattern : [pattern];

	return (
		<View style={[styles.patternContainer, { backgroundColor: colors.muted }]}>
			<Text
				style={[
					typography.micro,
					styles.patternLabel,
					{ color: colors.mutedForeground },
				]}
			>
				Pattern:
			</Text>
			{patterns.map((p, i) => (
				<Text
					key={i}
					style={[
						typography.code,
						styles.patternText,
						{ color: colors.foreground },
					]}
					numberOfLines={1}
				>
					{p}
				</Text>
			))}
		</View>
	);
}

export function PermissionDetails({ permission }: PermissionDetailsProps) {
	const tool = permission.type.toLowerCase();

	const renderToolDetails = () => {
		if (tool === "bash" || tool === "shell" || tool === "shell_command") {
			return <BashDetails permission={permission} />;
		}

		if (
			tool === "edit" ||
			tool === "multiedit" ||
			tool === "str_replace" ||
			tool === "str_replace_based_edit_tool"
		) {
			return <EditDetails permission={permission} />;
		}

		if (tool === "write" || tool === "create" || tool === "file_write") {
			return <WriteDetails permission={permission} />;
		}

		if (
			tool === "webfetch" ||
			tool === "fetch" ||
			tool === "curl" ||
			tool === "wget"
		) {
			return <WebFetchDetails permission={permission} />;
		}

		return <GenericDetails permission={permission} />;
	};

	return (
		<View>
			{renderToolDetails()}
			{permission.pattern && (
				<View style={styles.patternWrapper}>
					<PatternDisplay pattern={permission.pattern} />
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	content: {
		padding: 12,
		gap: 8,
	},
	description: {
		lineHeight: 20,
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		flexWrap: "wrap",
	},
	metaLabel: {
		fontFamily: Fonts.medium,
	},
	codeInline: {
		flex: 1,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	codeBlock: {
		padding: 8,
		borderRadius: 6,
	},
	requestRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
	},
	methodBadge: {
		paddingHorizontal: 6,
		paddingVertical: 3,
		borderRadius: 4,
	},
	urlContainer: {
		flex: 1,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	patternWrapper: {
		paddingHorizontal: 12,
		paddingBottom: 12,
	},
	patternContainer: {
		padding: 8,
		borderRadius: 6,
		gap: 4,
	},
	patternLabel: {
		fontFamily: Fonts.medium,
		marginBottom: 2,
	},
	patternText: {
		fontSize: FontSizes.xs,
	},
});
