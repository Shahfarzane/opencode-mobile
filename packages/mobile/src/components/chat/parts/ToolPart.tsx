import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export interface ToolPartData {
	type: "tool" | "tool-call" | "tool-result";
	toolName?: string;
	toolId?: string;
	state?: "pending" | "running" | "completed" | "error" | "aborted";
	content?: string;
	input?: Record<string, unknown>;
	output?: string;
	error?: string;
}

interface ToolPartProps {
	part: ToolPartData;
}

function getToolIcon(toolName: string) {
	const name = toolName.toLowerCase();

	if (name === "edit" || name === "write" || name === "str_replace") {
		return (
			<Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
				<Path
					d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
					stroke="#4385BE"
					strokeWidth={2}
					strokeLinecap="round"
				/>
				<Path
					d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
					stroke="#4385BE"
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
					stroke="#4385BE"
					strokeWidth={2}
					strokeLinecap="round"
				/>
				<Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#4385BE" strokeWidth={2} />
			</Svg>
		);
	}

	if (name === "bash" || name === "shell" || name === "terminal") {
		return (
			<Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
				<Rect x="2" y="4" width="20" height="16" rx="2" stroke="#4385BE" strokeWidth={2} />
				<Path d="M6 9l3 3-3 3M12 15h6" stroke="#4385BE" strokeWidth={2} strokeLinecap="round" />
			</Svg>
		);
	}

	if (name === "grep" || name === "search" || name === "glob") {
		return (
			<Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
				<Circle cx="11" cy="11" r="8" stroke="#4385BE" strokeWidth={2} />
				<Path d="M21 21l-4.35-4.35" stroke="#4385BE" strokeWidth={2} strokeLinecap="round" />
			</Svg>
		);
	}

	if (name === "task") {
		return (
			<Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
				<Path
					d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
					stroke="#4385BE"
					strokeWidth={2}
					strokeLinecap="round"
				/>
			</Svg>
		);
	}

	return (
		<Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
			<Path
				d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
				stroke="#4385BE"
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

function getStatusColor(state?: string) {
	switch (state) {
		case "completed":
			return "#A0AF54";
		case "error":
			return "#D14D41";
		case "aborted":
			return "#CE5D13";
		case "running":
			return "#4385BE";
		default:
			return "#878580";
	}
}

function getStatusIndicator(state?: string) {
	switch (state) {
		case "completed":
			return "✓";
		case "error":
			return "✗";
		case "aborted":
			return "⊘";
		case "running":
			return "●";
		default:
			return "○";
	}
}

function formatToolDescription(part: ToolPartData): string {
	const input = part.input;
	if (!input) return "";

	if (part.toolName === "edit" || part.toolName === "write") {
		const filePath =
			input.filePath || input.file_path || input.path;
		if (typeof filePath === "string") {
			return filePath.split("/").pop() || filePath;
		}
	}

	if (part.toolName === "bash" && typeof input.command === "string") {
		const firstLine = input.command.split("\n")[0];
		return firstLine.length > 40 ? firstLine.slice(0, 40) + "..." : firstLine;
	}

	if (part.toolName === "read" && typeof input.filePath === "string") {
		return input.filePath.split("/").pop() || input.filePath;
	}

	if (part.toolName === "task" && typeof input.description === "string") {
		return input.description.length > 40
			? input.description.slice(0, 40) + "..."
			: input.description;
	}

	return "";
}

export function ToolPart({ part }: ToolPartProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const toolName = part.toolName || "Tool";
	const description = formatToolDescription(part);
	const hasOutput = part.output && part.output.trim().length > 0;
	const hasError = part.error && part.error.trim().length > 0;

	return (
		<View className="mb-2">
			<Pressable
				onPress={() => setIsExpanded(!isExpanded)}
				className="flex-row items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2"
			>
				<View className="flex-row items-center gap-2 flex-1">
					{getToolIcon(toolName)}
					<Text className="font-mono text-sm font-medium text-foreground">
						{toolName}
					</Text>
					{description && (
						<Text
							className="font-mono text-xs text-muted-foreground flex-1"
							numberOfLines={1}
						>
							{description}
						</Text>
					)}
				</View>
				<View className="flex-row items-center gap-2">
					<Text style={{ color: getStatusColor(part.state) }}>
						{getStatusIndicator(part.state)}
					</Text>
					<Text className="font-mono text-xs text-muted-foreground">
						{isExpanded ? "▼" : "▶"}
					</Text>
				</View>
			</Pressable>

			{isExpanded && (
				<View className="mt-1 rounded-lg border border-border/50 bg-background p-3">
					{part.input && Object.keys(part.input).length > 0 && (
						<View className="mb-2">
							<Text className="font-mono text-xs font-medium text-muted-foreground mb-1">
								Input:
							</Text>
							<Text className="font-mono text-xs text-foreground">
								{JSON.stringify(part.input, null, 2).slice(0, 500)}
								{JSON.stringify(part.input).length > 500 && "..."}
							</Text>
						</View>
					)}

					{hasOutput && (
						<View className={part.input ? "mt-2" : ""}>
							<Text className="font-mono text-xs font-medium text-muted-foreground mb-1">
								Output:
							</Text>
							<Text className="font-mono text-xs text-foreground">
								{part.output!.slice(0, 1000)}
								{part.output!.length > 1000 && "..."}
							</Text>
						</View>
					)}

					{hasError && (
						<View className={part.input || hasOutput ? "mt-2" : ""}>
							<Text className="font-mono text-xs font-medium text-destructive mb-1">
								Error:
							</Text>
							<Text className="font-mono text-xs text-destructive">
								{part.error}
							</Text>
						</View>
					)}
				</View>
			)}
		</View>
	);
}
