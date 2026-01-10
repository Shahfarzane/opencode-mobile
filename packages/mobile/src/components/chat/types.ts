import type { MessagePart as StreamingPart } from "../../lib/streaming";

export type ToolPartState =
	| "pending"
	| "running"
	| "completed"
	| "error"
	| "aborted";

export type MessagePart = {
	type:
		| "text"
		| "tool"
		| "tool-call"
		| "tool-result"
		| "reasoning"
		| "step-start"
		| "step-finish"
		| "file";
	id?: string;
	content?: string;
	text?: string;
	toolName?: string;
	tool?: string;
	toolId?: string;
	callID?: string;
	state?:
		| ToolPartState
		| {
				status?: ToolPartState;
				input?: Record<string, unknown>;
				output?: string;
				error?: string;
				time?: { start?: number; end?: number };
		  };
	input?: Record<string, unknown>;
	output?: string;
	error?: string;
	isCollapsed?: boolean;
	time?: { start?: number; end?: number };
	sessionId?: string;
	filename?: string;
	mime?: string;
	url?: string;
	size?: number;
};

export type TokenBreakdown = {
	input?: number;
	output?: number;
	reasoning?: number;
	cache?: { read?: number; write?: number };
};

export type Message = {
	id: string;
	role: "user" | "assistant";
	content: string;
	isStreaming?: boolean;
	parts?: MessagePart[];
	createdAt?: number;
	// Model/agent info for assistant messages
	modelName?: string;
	providerId?: string;
	agentName?: string;
	// Token usage info
	tokens?: number | TokenBreakdown;
};

/**
 * Infers provider ID from model name for fallback when providerId is not available
 */
export function inferProviderIdFromModelName(modelName?: string): string | undefined {
	if (!modelName) return undefined;
	const lower = modelName.toLowerCase();
	if (lower.includes("claude") || lower.includes("anthropic")) return "anthropic";
	if (lower.includes("gpt") || lower.includes("openai") || lower.includes("o1") || lower.includes("o3")) return "openai";
	if (lower.includes("gemini") || lower.includes("google")) return "google";
	if (lower.includes("mistral")) return "mistral";
	if (lower.includes("llama")) return "meta";
	if (lower.includes("deepseek")) return "deepseek";
	if (lower.includes("groq")) return "groq";
	if (lower.includes("ollama")) return "ollama";
	if (lower.includes("openrouter")) return "openrouter";
	if (lower.includes("xai") || lower.includes("grok")) return "xai";
	if (lower.includes("cohere")) return "cohere";
	if (lower.includes("perplexity")) return "perplexity";
	return undefined;
}

export function convertStreamingPart(part: StreamingPart): MessagePart {
	if (part.type === "tool") {
		const toolPart = part as StreamingPart & { type: "tool" };
		return {
			type: "tool",
			id: toolPart.id,
			toolName: toolPart.tool,
			tool: toolPart.tool,
			callID: toolPart.callID,
			state: toolPart.state,
		};
	}

	if (part.type === "text") {
		const textPart = part as StreamingPart & { type: "text" };
		return {
			type: "text",
			id: textPart.id,
			content: textPart.text || textPart.content,
			text: textPart.text || textPart.content,
		};
	}

	if (part.type === "reasoning") {
		const reasoningPart = part as StreamingPart & { type: "reasoning" };
		return {
			type: "reasoning",
			id: reasoningPart.id,
			content: reasoningPart.text || reasoningPart.content,
			text: reasoningPart.text || reasoningPart.content,
			time: reasoningPart.time,
		};
	}

	if (part.type === "file") {
		const filePart = part as StreamingPart & {
			type: "file";
			filename?: string;
			mime?: string;
			url?: string;
			size?: number;
		};
		return {
			type: "file",
			id: filePart.id,
			filename: filePart.filename,
			mime: filePart.mime,
			url: filePart.url,
			size: filePart.size,
		};
	}

	return {
		type: part.type as MessagePart["type"],
		id: part.id,
	};
}
