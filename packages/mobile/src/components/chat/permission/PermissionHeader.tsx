import { StyleSheet, Text, View } from "react-native";
import {
	ClockIcon,
	FileEditIcon,
	GlobeIcon,
	PencilIcon,
	QuestionIcon,
	TerminalIcon,
	ToolIcon,
} from "@/components/icons";
import { typography, useTheme } from "@/theme";
import { getToolDisplayName } from "./utils";

interface PermissionHeaderProps {
	toolName: string;
	createdTime: number;
}

function getToolIcon(toolName: string, color: string, size: number = 16) {
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

function formatRelativeTime(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp;

	if (diff < 60000) return "just now";
	if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
	if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
	return `${Math.floor(diff / 86400000)}d ago`;
}

export function PermissionHeader({
	toolName,
	createdTime,
}: PermissionHeaderProps) {
	const { colors } = useTheme();
	const displayName = getToolDisplayName(toolName);

	return (
		<View style={[styles.header, { borderBottomColor: colors.border }]}>
			<View style={styles.headerLeft}>
				<View
					style={[
						styles.iconContainer,
						{ backgroundColor: `${colors.warning}20` },
					]}
				>
					{getToolIcon(toolName, colors.warning, 16)}
				</View>
				<View style={styles.titleContainer}>
					<Text
						style={[
							typography.uiLabel,
							{ color: colors.foreground, fontWeight: "600" },
						]}
					>
						{displayName}
					</Text>
					<QuestionIcon size={14} color={colors.mutedForeground} />
				</View>
			</View>
			<View style={styles.headerRight}>
				<ClockIcon size={12} color={colors.mutedForeground} />
				<Text style={[typography.micro, { color: colors.mutedForeground }]}>
					{formatRelativeTime(createdTime)}
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	headerLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	iconContainer: {
		width: 28,
		height: 28,
		borderRadius: 6,
		alignItems: "center",
		justifyContent: "center",
	},
	titleContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	headerRight: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
});
