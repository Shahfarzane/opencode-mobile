import { useCallback, useEffect, useRef } from "react";
import { useConnectionStore } from "../stores/useConnectionStore";

export interface StreamEvent {
	type: string;
	properties?: {
		sessionID?: string;
		messageID?: string;
		part?: {
			type: string;
			id?: string;
			text?: string;
			content?: string;
			tool?: string;
			callID?: string;
			state?: unknown;
			time?: { start?: number; end?: number };
		};
		info?: {
			id?: string;
			sessionID?: string;
			role?: "user" | "assistant";
			finish?: string;
			time?: { created?: number; completed?: number };
		};
		parts?: Array<{
			type: string;
			id?: string;
			text?: string;
			content?: string;
			tool?: string;
			callID?: string;
			state?: unknown;
		}>;
	};
}

type EventHandler = (event: StreamEvent) => void;

export function useEventStream(sessionId: string | null, onEvent: EventHandler) {
	const { serverUrl, authToken, directory, isConnected } = useConnectionStore();
	const abortControllerRef = useRef<AbortController | null>(null);
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const connect = useCallback(async () => {
		if (!serverUrl || !authToken || !isConnected) {
			return;
		}

		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		try {
			const url = new URL("/api/event", serverUrl);
			if (directory) {
				url.searchParams.set("directory", directory);
			}

			const response = await fetch(url.toString(), {
				method: "GET",
				headers: {
					Authorization: `Bearer ${authToken}`,
					Accept: "text/event-stream",
					"Cache-Control": "no-cache",
				},
				signal: abortController.signal,
			});

			if (!response.ok) {
				console.error("[EventStream] Failed to connect:", response.status);
				return;
			}

			if (!response.body) {
				console.error("[EventStream] No response body");
				return;
			}

			console.log("[EventStream] Connected to event stream");

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					console.log("[EventStream] Stream ended");
					break;
				}

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() || "";

				for (const line of lines) {
					if (line.startsWith("data: ")) {
						const data = line.slice(6).trim();
						if (!data || data === "[DONE]") continue;

						try {
							const parsed = JSON.parse(data);
							const event: StreamEvent = {
								type: parsed.type || "unknown",
								properties: parsed.properties || parsed,
							};

							if (
								sessionId &&
								event.properties?.sessionID &&
								event.properties.sessionID !== sessionId
							) {
								continue;
							}

							onEvent(event);
						} catch (error) {
							console.error("[EventStream] Failed to parse event:", error);
						}
					}
				}
			}
		} catch (error) {
			if ((error as Error)?.name === "AbortError") {
				console.log("[EventStream] Aborted");
				return;
			}
			console.error("[EventStream] Error:", error);
		} finally {
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
			if (!abortController.signal.aborted && isConnected) {
				console.log("[EventStream] Scheduling reconnect...");
				reconnectTimeoutRef.current = setTimeout(connect, 3000);
			}
		}
	}, [serverUrl, authToken, directory, isConnected, sessionId, onEvent]);

	useEffect(() => {
		if (isConnected && sessionId) {
			connect();
		}

		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
		};
	}, [isConnected, sessionId, connect]);

	const disconnect = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
		}
	}, []);

	return { disconnect };
}
