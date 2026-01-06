import { useMemo } from "react";

// Tool name to human-readable status phrase mapping
const TOOL_STATUS_PHRASES: Record<string, string> = {
	read: "reading file",
	write: "writing file",
	edit: "editing file",
	bash: "running command",
	grep: "searching content",
	glob: "finding files",
	webfetch: "fetching URL",
	websearch: "searching web",
	task: "delegating task",
	todoread: "reading tasks",
	todowrite: "updating tasks",
	mcp: "using tool",
};

export type ActivityType = "text" | "tool" | "reasoning" | "editing" | null;

export interface AssistantStatus {
	isActive: boolean;
	activityType: ActivityType;
	statusText: string;
	toolName: string | null;
}

export interface MessagePart {
	type: string;
	state?: string;
	toolName?: string;
	text?: string;
	[key: string]: unknown;
}

function getToolStatusPhrase(toolName: string): string {
	const normalized = toolName.toLowerCase().replace(/[^a-z]/g, "");

	// Check for exact match first
	if (TOOL_STATUS_PHRASES[normalized]) {
		return TOOL_STATUS_PHRASES[normalized];
	}

	// Check for partial matches
	for (const [key, phrase] of Object.entries(TOOL_STATUS_PHRASES)) {
		if (normalized.includes(key) || key.includes(normalized)) {
			return phrase;
		}
	}

	// MCP tools often have prefixes like "mcp__server__tool"
	if (normalized.startsWith("mcp")) {
		return "using tool";
	}

	return "working";
}

export function useAssistantStatus(
	parts: MessagePart[],
	isStreaming: boolean,
): AssistantStatus {
	return useMemo(() => {
		if (!isStreaming || !parts || parts.length === 0) {
			return {
				isActive: false,
				activityType: null,
				statusText: "",
				toolName: null,
			};
		}

		// Find the most recent active part (running tool or streaming text)
		let activeToolPart: MessagePart | null = null;
		let hasStreamingText = false;
		let hasThinking = false;

		for (let i = parts.length - 1; i >= 0; i--) {
			const part = parts[i];

			// Check for running tool
			if (part.type === "tool-invocation" && part.state === "running") {
				activeToolPart = part;
				break;
			}

			// Check for streaming text (text part without complete state)
			if (part.type === "text" && part.state !== "complete") {
				hasStreamingText = true;
			}

			// Check for thinking/reasoning
			if (
				part.type === "reasoning" ||
				part.type === "thinking" ||
				(part.type === "text" && part.text?.startsWith("<thinking>"))
			) {
				hasThinking = true;
			}
		}

		// Determine activity type and status
		if (activeToolPart && activeToolPart.toolName) {
			const toolName = activeToolPart.toolName;
			const statusPhrase = getToolStatusPhrase(toolName);

			// Capitalize first letter
			const capitalizedStatus =
				statusPhrase.charAt(0).toUpperCase() + statusPhrase.slice(1);

			return {
				isActive: true,
				activityType: toolName.toLowerCase().includes("edit")
					? "editing"
					: "tool",
				statusText: `${capitalizedStatus}...`,
				toolName,
			};
		}

		if (hasThinking) {
			return {
				isActive: true,
				activityType: "reasoning",
				statusText: "Thinking...",
				toolName: null,
			};
		}

		if (hasStreamingText) {
			return {
				isActive: true,
				activityType: "text",
				statusText: "Writing...",
				toolName: null,
			};
		}

		// Default streaming state
		return {
			isActive: true,
			activityType: "text",
			statusText: "Working...",
			toolName: null,
		};
	}, [parts, isStreaming]);
}
