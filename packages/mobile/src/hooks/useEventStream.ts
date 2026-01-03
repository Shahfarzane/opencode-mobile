import { useEffect, useRef, useCallback } from "react";
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
	const xhrRef = useRef<XMLHttpRequest | null>(null);
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastProcessedIndexRef = useRef(0);
	const isConnectingRef = useRef(false);
	const onEventRef = useRef(onEvent);
	const sessionIdRef = useRef(sessionId);

	onEventRef.current = onEvent;
	sessionIdRef.current = sessionId;

	const connect = useCallback(() => {
		if (!serverUrl || !authToken || !isConnected) {
			return;
		}

		if (isConnectingRef.current || xhrRef.current) {
			return;
		}

		isConnectingRef.current = true;

		const url = new URL("/api/event", serverUrl);
		if (directory) {
			url.searchParams.set("directory", directory);
		}

		const xhr = new XMLHttpRequest();
		xhrRef.current = xhr;
		lastProcessedIndexRef.current = 0;

		xhr.open("GET", url.toString(), true);
		xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
		xhr.setRequestHeader("Accept", "text/event-stream");
		xhr.setRequestHeader("Cache-Control", "no-cache");

		xhr.onreadystatechange = () => {
			if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
				if (xhr.status === 200) {
					console.log("[EventStream] Connected");
					isConnectingRef.current = false;
				} else {
					console.error("[EventStream] Failed to connect:", xhr.status);
					isConnectingRef.current = false;
				}
			}

			if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
				const newData = xhr.responseText.slice(lastProcessedIndexRef.current);
				lastProcessedIndexRef.current = xhr.responseText.length;

				if (newData) {
					const lines = newData.split("\n");
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

								const currentSessionId = sessionIdRef.current;
								if (
									currentSessionId &&
									event.properties?.sessionID &&
									event.properties.sessionID !== currentSessionId
								) {
									continue;
								}

								onEventRef.current(event);
							} catch (e) {
								void e;
							}
						}
					}
				}
			}

			if (xhr.readyState === XMLHttpRequest.DONE) {
				console.log("[EventStream] Connection closed");
				xhrRef.current = null;
				isConnectingRef.current = false;

				if (reconnectTimeoutRef.current) {
					clearTimeout(reconnectTimeoutRef.current);
				}
				reconnectTimeoutRef.current = setTimeout(() => {
					if (isConnected) {
						connect();
					}
				}, 3000);
			}
		};

		xhr.onerror = () => {
			console.error("[EventStream] XHR error");
			xhrRef.current = null;
			isConnectingRef.current = false;

			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
			reconnectTimeoutRef.current = setTimeout(() => {
				if (isConnected) {
					connect();
				}
			}, 3000);
		};

		xhr.send();
	}, [serverUrl, authToken, directory, isConnected]);

	useEffect(() => {
		if (isConnected && sessionId) {
			connect();
		}

		return () => {
			if (xhrRef.current) {
				xhrRef.current.abort();
				xhrRef.current = null;
			}
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
				reconnectTimeoutRef.current = null;
			}
			isConnectingRef.current = false;
		};
	}, [isConnected, sessionId, connect]);

	const disconnect = useCallback(() => {
		if (xhrRef.current) {
			xhrRef.current.abort();
			xhrRef.current = null;
		}
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}
		isConnectingRef.current = false;
	}, []);

	return { disconnect };
}
