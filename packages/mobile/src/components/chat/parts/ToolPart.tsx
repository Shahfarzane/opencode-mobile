import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { ChevronDownIcon, ChevronRightIcon } from "@/components/icons";
import { Fonts, Radius, fontStyle, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";
import { ToolOutputDialog } from "./ToolOutputDialog";

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

function formatGlobOutput(input: Record<string, unknown>, output?: string): string {
	const pattern = input.pattern as string | undefined;
	const path = input.path as string | undefined;
	
	let displayPath = pattern || path || "";
	
	if (displayPath.includes("**")) {
		displayPath = displayPath.split("**")[0];
	} else if (displayPath.includes("*")) {
		displayPath = displayPath.split("*")[0];
	}
	
	if (displayPath && !displayPath.endsWith("/") && !displayPath.includes(".")) {
		displayPath = `${displayPath}/`;
	}
	
	if (output && output.trim().length > 0) {
		const lines = output.trim().split("\n").filter(line => line.trim().length > 0);
		const fileCount = lines.length;
		if (fileCount > 0) {
			return `${displayPath || "."} - ${fileCount} file${fileCount !== 1 ? "s" : ""}`;
		}
	}
	
	return displayPath || "";
}

function formatGlobExpandedOutput(output: string, maxFiles: number = 5): string {
	const lines = output.trim().split("\n").filter(line => line.trim().length > 0);
	const fileCount = lines.length;
	
	if (fileCount === 0) {
		return "No files found";
	}
	
	if (fileCount <= maxFiles) {
		return lines.map(line => line.split("/").pop() || line).join("\n");
	}
	
	const preview = lines
		.slice(0, maxFiles)
		.map(line => line.split("/").pop() || line)
		.join("\n");
	const remaining = fileCount - maxFiles;
	return `${preview}\n...and ${remaining} more file${remaining !== 1 ? "s" : ""}`;
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

	if (part.toolName === "glob") {
		return formatGlobOutput(input, part.output);
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

	const handlePress = () => {
		setIsExpanded(!isExpanded);
	};

	return (
		<View style={{ marginVertical: 4 }}>
			<Pressable
				onPress={handlePress}
				style={({ pressed }) => ({
					flexDirection: "row",
					alignItems: "center",
					gap: 8,
					paddingHorizontal: 10,
					paddingVertical: 8,
					minHeight: 40,
					backgroundColor: pressed
						? withOpacity(colors.toolBackground, OPACITY.secondary)
						: withOpacity(colors.toolBackground, OPACITY.half),
					borderColor: withOpacity(colors.toolBorder, OPACITY.half),
					borderWidth: 1,
					borderRadius: Radius.lg,
				})}
			>
				<View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
					<View style={{ width: 16, height: 16, justifyContent: "center", alignItems: "center" }}>
						{isExpanded ? (
							<ChevronDownIcon size={14} color={colors.mutedForeground} />
						) : (
							<ChevronRightIcon size={14} color={colors.mutedForeground} />
						)}
					</View>
					<View style={{ width: 14, height: 14, justifyContent: "center", alignItems: "center" }}>
						{getToolIcon(
							toolName,
							part.state === "error"
								? colors.destructive
								: colors.mutedForeground,
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
							style={[typography.micro, { color: withOpacity(colors.mutedForeground, OPACITY.secondary), flex: 1 }]}
							numberOfLines={1}
						>
							{description}
						</Text>
					)}
				</View>
				<View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 0 }}>
					{part.state === "running" && (
						<Text style={[typography.micro, { color: colors.info }]}>●</Text>
					)}
				</View>
			</Pressable>

			{isExpanded && (
				<View
					className="mt-2 ml-5 pl-3 border-l gap-2"
					style={{
						borderColor: withOpacity(colors.toolBorder, OPACITY.half),
						backgroundColor: withOpacity(colors.toolBackground, OPACITY.light),
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
								{toolName.toLowerCase() === "glob" && part.output
									? formatGlobExpandedOutput(part.output)
									: (part.output?.slice(0, 1000) ?? "") + ((part.output?.length ?? 0) > 1000 ? "..." : "")}
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
							style={{ backgroundColor: withOpacity(colors.primary, OPACITY.active) }}
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
							style={{ backgroundColor: withOpacity(colors.info, OPACITY.active) }}
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
