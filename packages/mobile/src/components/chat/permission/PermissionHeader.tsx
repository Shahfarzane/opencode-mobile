import { Text, View } from "react-native";
import {
	ClockIcon,
	FileEditIcon,
	GlobeIcon,
	PencilIcon,
	QuestionIcon,
	TerminalIcon,
	ToolIcon,
} from "@/components/icons";
import { fontStyle, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";
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
		<View
			className="flex-row justify-between items-center px-3 py-2 border-b"
			style={{ borderBottomColor: colors.border }}
		>
			<View className="flex-row items-center gap-2">
				<View
					className="w-6 h-6 rounded-md items-center justify-center"
					style={{ backgroundColor: withOpacity(colors.warning, OPACITY.emphasized) }}
				>
					{getToolIcon(toolName, colors.warning, 16)}
				</View>
				<View className="flex-row items-center gap-1">
					<Text
						style={[
							typography.uiLabel,
							fontStyle("600"),
							{ color: colors.foreground },
						]}
					>
						{displayName}
					</Text>
					<QuestionIcon size={14} color={colors.mutedForeground} />
				</View>
			</View>
			<View className="flex-row items-center gap-1">
				<ClockIcon size={12} color={colors.mutedForeground} />
				<Text style={[typography.micro, { color: colors.mutedForeground }]}>
					{formatRelativeTime(createdTime)}
				</Text>
			</View>
		</View>
	);
}
