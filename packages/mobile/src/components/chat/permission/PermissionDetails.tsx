import { ScrollView, Text, View } from "react-native";
import { FixedLineHeights, FontSizes, Fonts, fontStyle, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";
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
		<View className="p-3 gap-2">
			{description && (
				<Text
					style={[
						typography.meta,
						{ color: colors.mutedForeground, lineHeight: FixedLineHeights.heading },
					]}
				>
					{description}
				</Text>
			)}
			{workingDir && (
				<View className="flex-row items-center gap-2 flex-wrap">
					<Text
						style={[
							typography.micro,
							{ color: colors.mutedForeground, fontFamily: Fonts.medium },
						]}
					>
						Directory:
					</Text>
					<View
						className="flex-1 px-2 py-1 rounded"
						style={{ backgroundColor: colors.muted }}
					>
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
				<View
					className="p-2 rounded-md"
					style={{ backgroundColor: colors.muted }}
				>
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
		<View className="p-3 gap-2">
			{description && (
				<Text
					style={[
						typography.meta,
						{ color: colors.mutedForeground, lineHeight: FixedLineHeights.heading },
					]}
				>
					{description}
				</Text>
			)}
			{filePath && (
				<View className="flex-row items-center gap-2 flex-wrap">
					<Text
						style={[
							typography.micro,
							{ color: colors.mutedForeground, fontFamily: Fonts.medium },
						]}
					>
						File:
					</Text>
					<View
						className="flex-1 px-2 py-1 rounded"
						style={{ backgroundColor: colors.muted }}
					>
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
		<View className="p-3 gap-2">
			{description && (
				<Text
					style={[
						typography.meta,
						{ color: colors.mutedForeground, lineHeight: FixedLineHeights.heading },
					]}
				>
					{description}
				</Text>
			)}
			{filePath && (
				<View className="flex-row items-center gap-2 flex-wrap">
					<Text
						style={[
							typography.micro,
							{ color: colors.mutedForeground, fontFamily: Fonts.medium },
						]}
					>
						File:
					</Text>
					<View
						className="flex-1 px-2 py-1 rounded"
						style={{ backgroundColor: colors.muted }}
					>
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
				return colors.destructive;
			default:
				return colors.mutedForeground;
		}
	};

	return (
		<View className="p-3 gap-2">
			{description && (
				<Text
					style={[
						typography.meta,
						{ color: colors.mutedForeground, lineHeight: FixedLineHeights.heading },
					]}
				>
					{description}
				</Text>
			)}
			{url && (
				<View className="flex-row items-start gap-2">
					<View
						className="px-1.5 py-0.5 rounded"
						style={{ backgroundColor: withOpacity(getMethodColor(), OPACITY.active) }}
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
						className="flex-1 px-2 py-1 rounded"
						style={{ backgroundColor: colors.muted }}
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
		<View className="p-3 gap-2">
			{description && (
				<Text
					style={[
						typography.meta,
						{ color: colors.mutedForeground, lineHeight: FixedLineHeights.heading },
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
		<View
			className="p-2 rounded-md gap-1"
			style={{ backgroundColor: colors.muted }}
		>
			<Text
				style={[
					typography.micro,
					{ color: colors.mutedForeground, fontFamily: Fonts.medium, marginBottom: 2 },
				]}
			>
				Pattern:
			</Text>
			{patterns.map((p) => (
				<Text
					key={p}
					style={[
						typography.code,
						{ color: colors.foreground, fontSize: FontSizes.xs },
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
				<View className="px-3 pb-3">
					<PatternDisplay pattern={permission.pattern} />
				</View>
			)}
		</View>
	);
}
