import { fetch } from "expo/fetch";

export type StreamEvent = {
	type: string;
	data: unknown;
};

export async function* streamChat(
	serverUrl: string,
	sessionId: string,
	message: string,
	token: string,
): AsyncGenerator<StreamEvent> {
	const response = await fetch(
		`${serverUrl}/api/session/${sessionId}/prompt`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
				Accept: "text/event-stream",
			},
			body: JSON.stringify({
				parts: [{ type: "text", text: message }],
			}),
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
					yield JSON.parse(data) as StreamEvent;
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
