import { useEffect, useRef, useCallback } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useConnectionStore } from "../stores/useConnectionStore";

const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;
const CONNECTION_TIMEOUT_MS = 30000;

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
	const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastProcessedIndexRef = useRef(0);
	const isConnectingRef = useRef(false);
	const onEventRef = useRef(onEvent);
	const sessionIdRef = useRef(sessionId);
	const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY_MS);
	const isActiveRef = useRef(true);
	const appStateRef = useRef<AppStateStatus>(AppState.currentState);
	const connectRef = useRef<() => void>(() => {});

	onEventRef.current = onEvent;
	sessionIdRef.current = sessionId;

	const clearTimers = useCallback(() => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}
		if (connectionTimeoutRef.current) {
			clearTimeout(connectionTimeoutRef.current);
			connectionTimeoutRef.current = null;
		}
	}, []);

	const abortConnection = useCallback(() => {
		if (xhrRef.current) {
			xhrRef.current.abort();
			xhrRef.current = null;
		}
		isConnectingRef.current = false;
	}, []);

	const doScheduleReconnect = useCallback(() => {
		if (!isActiveRef.current || !isConnected) {
			return;
		}

		clearTimers();
		
		const delay = reconnectDelayRef.current;
		console.log(`[EventStream] Scheduling reconnect in ${delay}ms`);
		
		reconnectTimeoutRef.current = setTimeout(() => {
			if (isActiveRef.current && isConnected) {
				connectRef.current();
			}
		}, delay);

		reconnectDelayRef.current = Math.min(
			reconnectDelayRef.current * 2, 
			MAX_RECONNECT_DELAY_MS
		);
	}, [isConnected, clearTimers]);

	const connect = useCallback(() => {
		if (!serverUrl || !authToken || !isConnected) {
			console.log("[EventStream] Not connected, skipping");
			return;
		}

		if (isConnectingRef.current || xhrRef.current) {
			console.log("[EventStream] Already connecting or connected");
			return;
		}

		if (appStateRef.current !== "active") {
			console.log("[EventStream] App not active, skipping connection");
			return;
		}

		isConnectingRef.current = true;
		clearTimers();

		let normalizedUrl = serverUrl.trim();
		if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
			normalizedUrl = `http://${normalizedUrl}`;
		}
		if (normalizedUrl.endsWith("/")) {
			normalizedUrl = normalizedUrl.slice(0, -1);
		}

		const url = new URL("/api/event", normalizedUrl);
		if (directory) {
			url.searchParams.set("directory", directory);
		}

		console.log(`[EventStream] Connecting to: ${url.toString()}`);

		const xhr = new XMLHttpRequest();
		xhrRef.current = xhr;
		lastProcessedIndexRef.current = 0;

		connectionTimeoutRef.current = setTimeout(() => {
			if (xhrRef.current === xhr && isConnectingRef.current) {
				console.warn("[EventStream] Connection timeout");
				xhr.abort();
			}
		}, CONNECTION_TIMEOUT_MS);

		xhr.open("GET", url.toString(), true);
		xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
		xhr.setRequestHeader("Accept", "text/event-stream");
		xhr.setRequestHeader("Cache-Control", "no-cache");

		xhr.onreadystatechange = () => {
			if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
				if (connectionTimeoutRef.current) {
					clearTimeout(connectionTimeoutRef.current);
					connectionTimeoutRef.current = null;
				}

				if (xhr.status === 200) {
					console.log("[EventStream] Connected successfully");
					isConnectingRef.current = false;
					reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;
				} else {
					console.error(`[EventStream] Connection failed: ${xhr.status}`);
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
							} catch {
							}
						}
					}
				}
			}

			if (xhr.readyState === XMLHttpRequest.DONE) {
				console.log("[EventStream] Connection closed");
				xhrRef.current = null;
				isConnectingRef.current = false;
				
				if (isActiveRef.current && isConnected) {
					doScheduleReconnect();
				}
			}
		};

		xhr.onerror = () => {
			console.error("[EventStream] XHR error");
			if (connectionTimeoutRef.current) {
				clearTimeout(connectionTimeoutRef.current);
				connectionTimeoutRef.current = null;
			}
			xhrRef.current = null;
			isConnectingRef.current = false;

			if (isActiveRef.current && isConnected) {
				doScheduleReconnect();
			}
		};

		xhr.ontimeout = () => {
			console.error("[EventStream] XHR timeout");
			xhrRef.current = null;
			isConnectingRef.current = false;

			if (isActiveRef.current && isConnected) {
				doScheduleReconnect();
			}
		};

		xhr.send();
	}, [serverUrl, authToken, directory, isConnected, clearTimers, doScheduleReconnect]);

	connectRef.current = connect;

	useEffect(() => {
		const handleAppStateChange = (nextAppState: AppStateStatus) => {
			const previousState = appStateRef.current;
			appStateRef.current = nextAppState;

			if (previousState.match(/inactive|background/) && nextAppState === "active") {
				console.log("[EventStream] App became active, reconnecting");
				abortConnection();
				clearTimers();
				reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;
				
				setTimeout(() => {
					if (isConnected) {
						connectRef.current();
					}
				}, 100);
			} else if (nextAppState.match(/inactive|background/)) {
				console.log("[EventStream] App going to background, disconnecting");
				abortConnection();
				clearTimers();
			}
		};

		const subscription = AppState.addEventListener("change", handleAppStateChange);

		return () => {
			subscription.remove();
		};
	}, [isConnected, abortConnection, clearTimers]);

	useEffect(() => {
		isActiveRef.current = true;

		if (isConnected && appStateRef.current === "active") {
			connectRef.current();
		}

		return () => {
			isActiveRef.current = false;
			abortConnection();
			clearTimers();
		};
	}, [isConnected, abortConnection, clearTimers]);

	const disconnect = useCallback(() => {
		isActiveRef.current = false;
		abortConnection();
		clearTimers();
	}, [abortConnection, clearTimers]);

	return { disconnect };
}
