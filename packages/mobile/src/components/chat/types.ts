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
		| "step-finish";
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
};

export type Message = {
	id: string;
	role: "user" | "assistant";
	content: string;
	isStreaming?: boolean;
	parts?: MessagePart[];
	createdAt?: number;
};

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

	return {
		type: part.type as MessagePart["type"],
		id: part.id,
	};
}
