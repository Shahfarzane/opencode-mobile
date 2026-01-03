import { fetch } from "expo/fetch";

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

export async function* streamChat(
	serverUrl: string,
	sessionId: string,
	message: string,
	token: string,
	providerID?: string,
	modelID?: string,
): AsyncGenerator<StreamEvent> {
	const body: Record<string, unknown> = {
		parts: [{ type: "text", text: message }],
	};
	
	if (providerID && modelID) {
		body.model = { providerID, modelID };
	}
	
	const response = await fetch(
		`${serverUrl}/api/session/${sessionId}/prompt`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
				Accept: "text/event-stream",
			},
			body: JSON.stringify(body),
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to send message: ${response.status}`);
	}

	if (!response.body) {
		throw new Error("No response body");
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() || "";

		for (const line of lines) {
			if (line.startsWith("data: ")) {
				const data = line.slice(6);
				if (data === "[DONE]") return;
				try {
					const parsed = JSON.parse(data);
					yield {
						type: parsed.type || "unknown",
						properties: parsed.properties || parsed,
					} as StreamEvent;
				} catch (error) {
					console.error("Failed to parse stream event:", error);
				}
			}
		}
	}
}

export async function* streamEvents(
	serverUrl: string,
	sessionId: string,
	token: string,
): AsyncGenerator<StreamEvent> {
	const response = await fetch(`${serverUrl}/api/session/${sessionId}/events`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "text/event-stream",
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to connect to event stream: ${response.status}`);
	}

	if (!response.body) {
		throw new Error("No response body");
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() || "";

		for (const line of lines) {
			if (line.startsWith("data: ")) {
				const data = line.slice(6);
				try {
					yield JSON.parse(data) as StreamEvent;
				} catch (error) {
					console.error("Failed to parse stream event:", error);
				}
			}
		}
	}
}
