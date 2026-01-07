import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { Fonts, fontStyle, typography, useTheme } from "@/theme";
import { ToolOutputDialog } from "./ToolOutputDialog";

function ChevronDownIcon({
	size = 14,
	color,
}: {
	size?: number;
	color: string;
}) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
			<Path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z" />
		</Svg>
	);
}

export interface ToolPartData {
	type: "tool" | "tool-call" | "tool-result";
	toolName?: string;
	toolId?: string;
	state?: "pending" | "running" | "completed" | "error" | "aborted";
	content?: string;
	input?: Record<string, unknown>;
	output?: string;
	error?: string;
	sessionId?: string;
}

interface ToolPartProps {
	part: ToolPartData;
	onSelectSession?: (sessionId: string) => void;
}

function getToolIcon(toolName: string, color: string) {
	const name = toolName.toLowerCase();

	if (name === "edit" || name === "write" || name === "str_replace") {
		return (
			<Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
				<Path
					d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
					stroke={color}
					strokeWidth={2}
					strokeLinecap="round"
				/>
				<Path
					d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
					stroke={color}
					strokeWidth={2}
					strokeLinecap="round"
				/>
			</Svg>
		);
	}

	if (name === "read" || name === "cat") {
		return (
			<Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
				<Path
					d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
					stroke={color}
					strokeWidth={2}
					strokeLinecap="round"
				/>
				<Path
					d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
					stroke={color}
					strokeWidth={2}
				/>
			</Svg>
		);
	}

	if (name === "bash" || name === "shell" || name === "terminal") {
		return (
			<Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
				<Rect
					x="2"
					y="4"
					width="20"
					height="16"
					rx="2"
					stroke={color}
					strokeWidth={2}
				/>
				<Path
					d="M6 9l3 3-3 3M12 15h6"
					stroke={color}
					strokeWidth={2}
					strokeLinecap="round"
				/>
			</Svg>
		);
	}

	if (name === "grep" || name === "search" || name === "glob") {
		return (
			<Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
				<Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} />
				<Path
					d="M21 21l-4.35-4.35"
					stroke={color}
					strokeWidth={2}
					strokeLinecap="round"
				/>
			</Svg>
		);
	}

	if (name === "task") {
		return (
			<Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
				<Path
					d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
					stroke={color}
					strokeWidth={2}
					strokeLinecap="round"
				/>
			</Svg>
		);
	}

	if (name === "external_link") {
		return (
			<Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
				<Path
					d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"
					stroke={color}
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</Svg>
		);
	}

	return (
		<Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
			<Path
				d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

function tryParseSessionId(output: string): string | undefined {
	const patterns = [
		/session[_\s]?id[:\s]*["']?([a-zA-Z0-9_-]+)["']?/i,
		/["']sessionId["']\s*:\s*["']([a-zA-Z0-9_-]+)["']/,
	];
	for (const pattern of patterns) {
		const match = output.match(pattern);
		if (match?.[1]) return match[1];
	}
	return undefined;
}

function formatToolDescription(part: ToolPartData): string {
	const input = part.input;
	if (!input) return "";

	if (part.toolName === "edit" || part.toolName === "write") {
		const filePath = input.filePath || input.file_path || input.path;
		if (typeof filePath === "string") {
			return filePath.split("/").pop() || filePath;
		}
	}

	if (part.toolName === "bash" && typeof input.command === "string") {
		const firstLine = input.command.split("\n")[0];
		return firstLine.length > 40 ? `${firstLine.slice(0, 40)}...` : firstLine;
	}

	if (part.toolName === "read" && typeof input.filePath === "string") {
		return input.filePath.split("/").pop() || input.filePath;
	}

	if (part.toolName === "task" && typeof input.description === "string") {
		return input.description.length > 40
			? `${input.description.slice(0, 40)}...`
			: input.description;
	}

	return "";
}

export function ToolPart({ part, onSelectSession }: ToolPartProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [showDialog, setShowDialog] = useState(false);
	const { colors } = useTheme();

	const toolName = part.toolName || "Tool";
	const description = formatToolDescription(part);
	const hasOutput = part.output && part.output.trim().length > 0;
	const hasError = part.error && part.error.trim().length > 0;

	const isTaskTool = toolName.toLowerCase() === "task";
	const subAgentSessionId =
		part.sessionId ||
		(part.input?.sessionId as string) ||
		(part.output && tryParseSessionId(part.output));

	return (
		<View className="my-1">
			<Pressable
				onPress={() => setIsExpanded(!isExpanded)}
				className="flex-row items-center gap-2 rounded-xl px-2 py-1.5"
			>
				<View className="flex-row items-center gap-2 flex-1 min-w-0">
					<View className="w-3.5 h-3.5 justify-center items-center">
						{isExpanded ? (
							<ChevronDownIcon size={14} color={colors.mutedForeground} />
						) : (
							getToolIcon(
								toolName,
								part.state === "error"
									? colors.destructive
									: colors.mutedForeground,
							)
						)}
					</View>
					<Text
						style={[
							typography.meta,
							fontStyle("500"),
							{
								color:
									part.state === "error"
										? colors.destructive
										: colors.foreground,
							},
						]}
					>
						{toolName}
					</Text>
					{description && (
						<Text
							className="flex-1"
							style={[typography.micro, { color: `${colors.mutedForeground}B3` }]}
							numberOfLines={1}
						>
							{description}
						</Text>
					)}
				</View>
				<View className="flex-row items-center gap-1 shrink-0">
					{part.state === "running" && (
						<Text style={[typography.micro, { color: colors.info }]}>●</Text>
					)}
				</View>
			</Pressable>

			{isExpanded && (
				<View
					className="mt-2 ml-5 pl-3 border-l gap-2"
					style={{
						borderColor: `${colors.border}80`,
						backgroundColor: colors.background,
					}}
				>
					{part.input && Object.keys(part.input).length > 0 && (
						<View>
							<Text
								className="mb-1"
								style={[
									typography.micro,
									{ color: colors.mutedForeground, fontFamily: Fonts.medium },
								]}
							>
								Input:
							</Text>
							<Text style={[typography.code, { color: colors.foreground }]}>
								{JSON.stringify(part.input, null, 2).slice(0, 500)}
								{JSON.stringify(part.input).length > 500 && "..."}
							</Text>
						</View>
					)}

					{hasOutput && (
						<View className={part.input ? "mt-2" : ""}>
							<Text
								className="mb-1"
								style={[
									typography.micro,
									{ color: colors.mutedForeground, fontFamily: Fonts.medium },
								]}
							>
								Output:
							</Text>
							<Text style={[typography.code, { color: colors.foreground }]}>
								{part.output?.slice(0, 1000)}
								{(part.output?.length ?? 0) > 1000 && "..."}
							</Text>
						</View>
					)}

					{hasError && (
						<View className={part.input || hasOutput ? "mt-2" : ""}>
							<Text
								className="mb-1"
								style={[
									typography.micro,
									{ color: colors.destructive, fontFamily: Fonts.medium },
								]}
							>
								Error:
							</Text>
							<Text style={[typography.code, { color: colors.destructive }]}>
								{part.error}
							</Text>
						</View>
					)}

					{(hasOutput ||
						hasError ||
						(part.input && Object.keys(part.input).length > 0)) && (
						<Pressable
							onPress={() => setShowDialog(true)}
							className="mt-2 py-2 px-3 rounded-lg items-center"
							style={{ backgroundColor: `${colors.primary}15` }}
						>
							<Text style={[typography.micro, { color: colors.primary }]}>
								View Full Output
							</Text>
						</Pressable>
					)}

					{isTaskTool && subAgentSessionId && onSelectSession && (
						<Pressable
							onPress={() => onSelectSession(subAgentSessionId)}
							className="mt-2 py-2 px-3 rounded-lg flex-row items-center justify-center gap-1.5"
							style={{ backgroundColor: `${colors.info}15` }}
						>
							{getToolIcon("external_link", colors.info)}
							<Text style={[typography.micro, { color: colors.info }]}>
								Open SubAgent Session
							</Text>
						</Pressable>
					)}
				</View>
			)}

			<ToolOutputDialog
				visible={showDialog}
				onClose={() => setShowDialog(false)}
				part={part}
			/>
		</View>
	);
}
