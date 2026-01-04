export interface TextPart {
	type: "text";
	id?: string;
	text?: string;
	content?: string;
	time?: { start?: number; end?: number };
}

export interface ToolPart {
	type: "tool";
	id?: string;
	callID?: string;
	tool?: string;
	state?: {
		status?: "pending" | "running" | "completed" | "error" | "aborted";
		input?: Record<string, unknown>;
		output?: string;
		error?: string;
		time?: { start?: number; end?: number };
	};
}

export interface ReasoningPart {
	type: "reasoning";
	id?: string;
	text?: string;
	content?: string;
	time?: { start?: number; end?: number };
}

export interface StepStartPart {
	type: "step-start";
	id?: string;
}

export interface StepFinishPart {
	type: "step-finish";
	id?: string;
}

export type MessagePart = TextPart | ToolPart | ReasoningPart | StepStartPart | StepFinishPart;

export interface StreamEvent {
	type: string;
	properties?: {
		sessionID?: string;
		messageID?: string;
		part?: MessagePart;
		info?: {
			id?: string;
			sessionID?: string;
			role?: "user" | "assistant";
			finish?: string;
			time?: { created?: number; completed?: number };
		};
		parts?: MessagePart[];
	};
}

export function extractPartText(part: MessagePart): string {
	if (part.type === "text") {
		return (part as TextPart).text || (part as TextPart).content || "";
	}
	if (part.type === "reasoning") {
		return (part as ReasoningPart).text || (part as ReasoningPart).content || "";
	}
	return "";
}

export function normalizePart(part: MessagePart): MessagePart {
	if (!part) return part;
	
	const normalized = { ...part };
	if (!normalized.type) {
		(normalized as { type: string }).type = "text";
	}
	
	return normalized;
}
