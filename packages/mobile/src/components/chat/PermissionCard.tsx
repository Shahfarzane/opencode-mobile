import React, { useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useTheme, typography } from "@/theme";
import {
	CheckIcon,
	ClockIcon,
	FileEditIcon,
	GlobeIcon,
	PencilIcon,
	QuestionIcon,
	TerminalIcon,
	ToolIcon,
	XIcon,
} from "@/components/icons";

export interface Permission {
	id: string;
	type: string;
	pattern?: string | string[];
	sessionID: string;
	messageID: string;
	callID?: string;
	title: string;
	metadata: Record<string, unknown>;
	time: {
		created: number;
	};
}

export type PermissionResponse = "once" | "always" | "reject";

interface PermissionCardProps {
	permission: Permission;
	onResponse?: (response: PermissionResponse) => Promise<void>;
}

function getToolIcon(toolName: string, color: string, size: number = 14) {
	const tool = toolName.toLowerCase();

	if (
		tool === "edit" ||
		tool === "multiedit" ||
		tool === "str_replace" ||
		tool === "str_replace_based_edit_tool"
	) {
		return <PencilIcon size={size} color={color} />;
	}

	if (tool === "write" || tool === "create" || tool === "file_write") {
		return <FileEditIcon size={size} color={color} />;
	}

	if (
		tool === "bash" ||
		tool === "shell" ||
		tool === "cmd" ||
		tool === "terminal" ||
		tool === "shell_command"
	) {
		return <TerminalIcon size={size} color={color} />;
	}

	if (
		tool === "webfetch" ||
		tool === "fetch" ||
		tool === "curl" ||
		tool === "wget"
	) {
		return <GlobeIcon size={size} color={color} />;
	}

	return <ToolIcon size={size} color={color} />;
}

function getToolDisplayName(toolName: string): string {
	const tool = toolName.toLowerCase();

	if (
		tool === "edit" ||
		tool === "multiedit" ||
		tool === "str_replace" ||
		tool === "str_replace_based_edit_tool"
	) {
		return "edit";
	}
	if (tool === "write" || tool === "create" || tool === "file_write") {
		return "write";
	}
	if (
		tool === "bash" ||
		tool === "shell" ||
		tool === "cmd" ||
		tool === "terminal" ||
		tool === "shell_command"
	) {
		return "bash";
	}
	if (
		tool === "webfetch" ||
		tool === "fetch" ||
		tool === "curl" ||
		tool === "wget"
	) {
		return "webfetch";
	}

	return toolName;
}

export function PermissionCard({ permission, onResponse }: PermissionCardProps) {
	const { colors } = useTheme();
	const [isResponding, setIsResponding] = useState(false);
	const [hasResponded, setHasResponded] = useState(false);

	const handleResponse = async (response: PermissionResponse) => {
		if (!onResponse) return;

		setIsResponding(true);
		try {
			await onResponse(response);
			setHasResponded(true);
		} catch {
		} finally {
			setIsResponding(false);
		}
	};

	if (hasResponded) {
		return null;
	}

	const toolName = permission.type || "Unknown Tool";
	const tool = toolName.toLowerCase();
	const displayToolName = getToolDisplayName(toolName);

	const getMeta = (key: string, fallback: string = ""): string => {
		const val = permission.metadata[key];
		return typeof val === "string"
			? val
			: typeof val === "number"
				? String(val)
				: fallback;
	};

	const getMetaNum = (key: string): number | undefined => {
		const val = permission.metadata[key];
		return typeof val === "number" ? val : undefined;
	};

	const renderToolContent = () => {
		if (tool === "bash" || tool === "shell" || tool === "shell_command") {
			const command =
				getMeta("command") || getMeta("cmd") || getMeta("script");
			const description = getMeta("description");
			const workingDir =
				getMeta("cwd") ||
				getMeta("working_directory") ||
				getMeta("directory") ||
				getMeta("path");
			const timeout = getMetaNum("timeout");
			const commandInTitle = permission.title === command;

			return (
				<>
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
									typography.meta,
									styles.metaLabel,
									{ color: colors.mutedForeground },
								]}
							>
								Working Directory:
							</Text>
							<View
								style={[styles.codeInline, { backgroundColor: colors.muted }]}
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
					{timeout && (
						<Text
							style={[
								typography.meta,
								styles.description,
								{ color: colors.mutedForeground },
							]}
						>
							Timeout: {timeout}ms
						</Text>
					)}
					{command && !commandInTitle && (
						<View
							style={[styles.codeBlock, { backgroundColor: colors.muted }]}
						>
							<Text
								style={[typography.code, { color: colors.foreground }]}
								selectable
							>
								{command}
							</Text>
						</View>
					)}
				</>
			);
		}

		if (
			tool === "edit" ||
			tool === "multiedit" ||
			tool === "str_replace" ||
			tool === "str_replace_based_edit_tool"
		) {
			const filePath =
				getMeta("path") ||
				getMeta("file_path") ||
				getMeta("filename") ||
				getMeta("filePath");
			const changes = getMeta("changes") || getMeta("diff");

			return (
				<>
					{filePath && permission.title !== filePath && (
						<View
							style={[styles.codeInline, { backgroundColor: colors.muted }]}
						>
							<Text style={[typography.code, { color: colors.foreground }]}>
								{filePath}
							</Text>
						</View>
					)}
					{changes && (
						<ScrollView
							style={[styles.scrollableContent, { maxHeight: 200 }]}
							nestedScrollEnabled
						>
							<View
								style={[styles.codeBlock, { backgroundColor: colors.muted }]}
							>
								<Text
									style={[typography.code, { color: colors.foreground }]}
									selectable
								>
									{changes}
								</Text>
							</View>
						</ScrollView>
					)}
				</>
			);
		}

		if (tool === "write" || tool === "create" || tool === "file_write") {
			const content =
				getMeta("content") || getMeta("text") || getMeta("data");

			if (content) {
				return (
					<ScrollView
						style={[styles.scrollableContent, { maxHeight: 200 }]}
						nestedScrollEnabled
					>
						<View
							style={[styles.codeBlock, { backgroundColor: colors.muted }]}
						>
							<Text
								style={[typography.code, { color: colors.foreground }]}
								selectable
							>
								{content.length > 500
									? content.substring(0, 500) + "..."
									: content}
							</Text>
						</View>
					</ScrollView>
				);
			}
			return null;
		}

		if (
			tool === "webfetch" ||
			tool === "fetch" ||
			tool === "curl" ||
			tool === "wget"
		) {
			const url = getMeta("url") || getMeta("uri") || getMeta("endpoint");
			const method = getMeta("method") || "GET";
			const timeout = getMetaNum("timeout");
			const format = getMeta("format") || getMeta("responseType");

			return (
				<>
					{url && (
						<View style={styles.requestRow}>
							<View
								style={[
									styles.methodBadge,
									{ backgroundColor: colors.primaryMuted },
								]}
							>
								<Text
									style={[
										typography.micro,
										{ color: colors.primary, fontWeight: "600" },
									]}
								>
									{method}
								</Text>
							</View>
							<View
								style={[
									styles.urlContainer,
									{ backgroundColor: colors.muted },
								]}
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
					{(timeout || format) && (
						<Text
							style={[
								typography.meta,
								styles.description,
								{ color: colors.mutedForeground },
							]}
						>
							{timeout && `Timeout: ${timeout}ms`}
							{timeout && format && " - "}
							{format && `Response format: ${format}`}
						</Text>
					)}
				</>
			);
		}

		const genericContent =
			getMeta("command") ||
			getMeta("content") ||
			getMeta("action") ||
			getMeta("operation");
		const description = getMeta("description");

		return (
			<>
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
				{genericContent && (
					<View style={[styles.codeBlock, { backgroundColor: colors.muted }]}>
						<Text
							style={[typography.code, { color: colors.foreground }]}
							selectable
						>
							{String(genericContent)}
						</Text>
					</View>
				)}
			</>
		);
	};

	const renderTitle = () => {
		let primaryContent = "";
		let shouldHighlight = false;

		if (tool === "bash" || tool === "shell" || tool === "shell_command") {
			primaryContent =
				getMeta("command") || getMeta("cmd") || getMeta("script");
			shouldHighlight = true;
		} else if (
			tool === "edit" ||
			tool === "multiedit" ||
			tool === "str_replace" ||
			tool === "str_replace_based_edit_tool" ||
			tool === "write" ||
			tool === "create" ||
			tool === "file_write"
		) {
			primaryContent =
				getMeta("path") ||
				getMeta("file_path") ||
				getMeta("filename") ||
				getMeta("filePath");
			shouldHighlight = false;
		} else if (tool === "webfetch" || tool === "fetch") {
			primaryContent =
				getMeta("url") || getMeta("uri") || getMeta("endpoint");
			shouldHighlight = false;
		}

		const titleMatchesContent = permission.title === primaryContent;

		if (titleMatchesContent && primaryContent) {
			if (shouldHighlight) {
				return (
					<View style={[styles.codeBlock, { backgroundColor: colors.muted }]}>
						<Text
							style={[typography.code, { color: colors.foreground }]}
							selectable
						>
							{primaryContent}
						</Text>
					</View>
				);
			}
			return (
				<View style={[styles.codeInline, { backgroundColor: colors.muted }]}>
					<Text style={[typography.code, { color: colors.foreground }]}>
						{primaryContent}
					</Text>
				</View>
			);
		}

		if (permission.title) {
			return (
				<Text style={[typography.uiLabel, { color: colors.foreground }]}>
					{permission.title}
				</Text>
			);
		}

		return null;
	};

	return (
		<View style={[styles.container, { borderColor: colors.border }]}>
			<View
				style={[
					styles.header,
					{ backgroundColor: colors.muted, borderBottomColor: colors.border },
				]}
			>
				<View style={styles.headerLeft}>
					<QuestionIcon size={14} color={colors.warning} />
					<Text
						style={[
							typography.meta,
							{ color: colors.mutedForeground, fontWeight: "500" },
						]}
					>
						Permission Required
					</Text>
				</View>
				<View style={styles.headerRight}>
					{getToolIcon(toolName, colors.mutedForeground)}
					<Text
						style={[
							typography.meta,
							{ color: colors.mutedForeground, fontWeight: "500" },
						]}
					>
						{displayToolName}
					</Text>
				</View>
			</View>

			<View style={styles.content}>
				<View style={styles.titleContainer}>{renderTitle()}</View>
				{renderToolContent()}
			</View>

			<View
				style={[styles.actions, { borderTopColor: colors.border }]}
			>
				<Pressable
					onPress={() => handleResponse("once")}
					disabled={isResponding}
					style={({ pressed }) => [
						styles.actionButton,
						{ backgroundColor: colors.successBackground },
						pressed && styles.actionButtonPressed,
						isResponding && styles.actionButtonDisabled,
					]}
				>
					<CheckIcon size={12} color={colors.success} />
					<Text
						style={[
							typography.meta,
							{ color: colors.success, fontWeight: "500" },
						]}
					>
						Allow Once
					</Text>
				</Pressable>

				<Pressable
					onPress={() => handleResponse("always")}
					disabled={isResponding}
					style={({ pressed }) => [
						styles.actionButton,
						{ backgroundColor: colors.muted },
						pressed && styles.actionButtonPressed,
						isResponding && styles.actionButtonDisabled,
					]}
				>
					<ClockIcon size={12} color={colors.mutedForeground} />
					<Text
						style={[
							typography.meta,
							{ color: colors.mutedForeground, fontWeight: "500" },
						]}
					>
						Always Allow
					</Text>
				</Pressable>

				<Pressable
					onPress={() => handleResponse("reject")}
					disabled={isResponding}
					style={({ pressed }) => [
						styles.actionButton,
						{ backgroundColor: colors.errorBackground },
						pressed && styles.actionButtonPressed,
						isResponding && styles.actionButtonDisabled,
					]}
				>
					<XIcon size={12} color={colors.error} />
					<Text
						style={[
							typography.meta,
							{ color: colors.error, fontWeight: "500" },
						]}
					>
						Deny
					</Text>
				</Pressable>

				{isResponding && (
					<ActivityIndicator
						size="small"
						color={colors.primary}
						style={styles.loader}
					/>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		borderWidth: 1,
		borderRadius: 12,
		overflow: "hidden",
		marginVertical: 8,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderBottomWidth: 1,
	},
	headerLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	headerRight: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	content: {
		padding: 12,
		gap: 8,
	},
	titleContainer: {
		marginBottom: 4,
	},
	description: {
		marginBottom: 4,
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginBottom: 4,
		flexWrap: "wrap",
	},
	metaLabel: {
		fontWeight: "600",
	},
	codeInline: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	codeBlock: {
		padding: 8,
		borderRadius: 6,
	},
	scrollableContent: {
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
	actions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderTopWidth: 1,
	},
	actionButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 6,
	},
	actionButtonPressed: {
		opacity: 0.8,
	},
	actionButtonDisabled: {
		opacity: 0.5,
	},
	loader: {
		marginLeft: "auto",
	},
});
