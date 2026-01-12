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
	toolId?: string;
	tool?: string;
	toolName?: string;
	state?: {
		status?: "pending" | "running" | "completed" | "error" | "aborted";
		input?: Record<string, unknown>;
		output?: string;
		error?: string;
		time?: { start?: number; end?: number };
	};
	input?: Record<string, unknown>;
	output?: string;
	error?: string;
}

export interface ToolCallPart {
	type: "tool-call";
	id?: string;
	callID?: string;
	toolId?: string;
	tool?: string;
	toolName?: string;
	state?: {
		status?: "pending" | "running" | "completed" | "error" | "aborted";
		input?: Record<string, unknown>;
		output?: string;
		error?: string;
		time?: { start?: number; end?: number };
	};
	input?: Record<string, unknown>;
	output?: string;
	error?: string;
}

export interface ToolResultPart {
	type: "tool-result";
	id?: string;
	callID?: string;
	toolId?: string;
	tool?: string;
	toolName?: string;
	state?: {
		status?: "pending" | "running" | "completed" | "error" | "aborted";
		input?: Record<string, unknown>;
		output?: string;
		error?: string;
		time?: { start?: number; end?: number };
	};
	input?: Record<string, unknown>;
	output?: string;
	error?: string;
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

export interface FilePart {
	type: "file";
	id?: string;
	filename?: string;
	mime?: string;
	url?: string;
	size?: number;
}

export type MessagePart =
	| TextPart
	| ToolPart
	| ToolCallPart
	| ToolResultPart
	| ReasoningPart
	| StepStartPart
	| StepFinishPart
	| FilePart;

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

