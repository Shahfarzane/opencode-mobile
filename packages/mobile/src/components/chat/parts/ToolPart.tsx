import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useTheme, typography } from "@/theme";
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
}

interface ToolPartProps {
	part: ToolPartData;
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
				<Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={2} />
			</Svg>
		);
	}

	if (name === "bash" || name === "shell" || name === "terminal") {
		return (
			<Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
				<Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth={2} />
				<Path d="M6 9l3 3-3 3M12 15h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
			</Svg>
		);
	}

	if (name === "grep" || name === "search" || name === "glob") {
		return (
			<Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
				<Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} />
				<Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth={2} strokeLinecap="round" />
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
	const [showDialog, setShowDialog] = useState(false);
	const { colors } = useTheme();

	const toolName = part.toolName || "Tool";
	const description = formatToolDescription(part);
	const hasOutput = part.output && part.output.trim().length > 0;
	const hasError = part.error && part.error.trim().length > 0;

	const getStatusColor = (state?: string) => {
		switch (state) {
			case "completed":
				return colors.success;
			case "error":
				return colors.destructive;
			case "aborted":
				return colors.warning;
			case "running":
				return colors.info;
			default:
				return colors.mutedForeground;
		}
	};

	return (
		<View style={styles.container}>
			<Pressable
				onPress={() => setIsExpanded(!isExpanded)}
				style={[
					styles.header,
					{
						borderColor: colors.border,
						backgroundColor: `${colors.muted}80`,
					},
				]}
			>
				<View style={styles.headerLeft}>
					{getToolIcon(toolName, colors.info)}
					<Text style={[typography.uiLabel, { color: colors.foreground }]}>
						{toolName}
					</Text>
					{description && (
						<Text
							style={[typography.micro, { color: colors.mutedForeground, flex: 1 }]}
							numberOfLines={1}
						>
							{description}
						</Text>
					)}
				</View>
				<View style={styles.headerRight}>
					<Text style={{ color: getStatusColor(part.state) }}>
						{getStatusIndicator(part.state)}
					</Text>
					<Text style={[typography.micro, { color: colors.mutedForeground }]}>
						{isExpanded ? "▼" : "▶"}
					</Text>
				</View>
			</Pressable>

			{isExpanded && (
				<View
					style={[
						styles.expandedContent,
						{
							borderColor: `${colors.border}80`,
							backgroundColor: colors.background,
						},
					]}
				>
					{part.input && Object.keys(part.input).length > 0 && (
						<View style={styles.section}>
							<Text style={[typography.micro, styles.sectionLabel, { color: colors.mutedForeground }]}>
								Input:
							</Text>
							<Text style={[typography.code, { color: colors.foreground }]}>
								{JSON.stringify(part.input, null, 2).slice(0, 500)}
								{JSON.stringify(part.input).length > 500 && "..."}
							</Text>
						</View>
					)}

					{hasOutput && (
						<View style={[styles.section, part.input ? styles.sectionMargin : undefined]}>
							<Text style={[typography.micro, styles.sectionLabel, { color: colors.mutedForeground }]}>
								Output:
							</Text>
							<Text style={[typography.code, { color: colors.foreground }]}>
								{part.output!.slice(0, 1000)}
								{part.output!.length > 1000 && "..."}
							</Text>
						</View>
					)}

				{hasError && (
					<View style={[styles.section, (part.input || hasOutput) ? styles.sectionMargin : undefined]}>
						<Text style={[typography.micro, styles.sectionLabel, { color: colors.destructive }]}>
							Error:
						</Text>
						<Text style={[typography.code, { color: colors.destructive }]}>
							{part.error}
						</Text>
					</View>
				)}

				{(hasOutput || hasError || (part.input && Object.keys(part.input).length > 0)) && (
					<Pressable
						onPress={() => setShowDialog(true)}
						style={[
							styles.viewFullButton,
							{ backgroundColor: `${colors.primary}15` },
						]}
					>
						<Text style={[typography.micro, { color: colors.primary }]}>
							View Full Output
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

const styles = StyleSheet.create({
	container: {
		marginBottom: 8,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		borderRadius: 8,
		borderWidth: 1,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	headerLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		flex: 1,
	},
	headerRight: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	expandedContent: {
		marginTop: 4,
		borderRadius: 8,
		borderWidth: 1,
		padding: 12,
	},
	section: {},
	sectionMargin: {
		marginTop: 8,
	},
	viewFullButton: {
		marginTop: 12,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 6,
		alignItems: 'center',
	},
	sectionLabel: {
		marginBottom: 4,
	},
});
