import { useCallback, useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useConnectionStore } from "../stores/useConnectionStore";

const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;
const CONNECTION_TIMEOUT_MS = 30000;
const DEBUG_STREAM = __DEV__;

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
		id?: string;
		type?: string;
		pattern?: string | string[];
		callID?: string;
		title?: string;
		metadata?: Record<string, unknown>;
		time?: { created?: number };
	};
}

type EventHandler = (event: StreamEvent) => void;

export function useEventStream(
	sessionId: string | null,
	onEvent: EventHandler,
) {
	const { serverUrl, authToken, directory, isConnected } = useConnectionStore();
	const xhrRef = useRef<XMLHttpRequest | null>(null);
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const lastProcessedIndexRef = useRef(0);
	const isConnectingRef = useRef(false);
	const onEventRef = useRef(onEvent);
	const sessionIdRef = useRef(sessionId);
	const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY_MS);
	const isActiveRef = useRef(true);
	const appStateRef = useRef<AppStateStatus>(AppState.currentState);
	const connectRef = useRef<() => void>(() => {});
	const incompleteLineRef = useRef("");
	const eventQueueRef = useRef<StreamEvent[]>([]);
	const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
		if (flushTimeoutRef.current) {
			clearTimeout(flushTimeoutRef.current);
			flushTimeoutRef.current = null;
		}
	}, []);

	const abortConnection = useCallback(() => {
		if (xhrRef.current) {
			xhrRef.current.abort();
			xhrRef.current = null;
		}
		isConnectingRef.current = false;
		eventQueueRef.current = [];
	}, []);

	const flushEventQueue = useCallback(() => {
		const queued = eventQueueRef.current;
		if (queued.length === 0) return;
		eventQueueRef.current = [];
		for (const queuedEvent of queued) {
			onEventRef.current(queuedEvent);
		}
	}, []);

	const enqueueEvent = useCallback(
		(event: StreamEvent) => {
			eventQueueRef.current.push(event);
			if (flushTimeoutRef.current) return;
			flushTimeoutRef.current = setTimeout(() => {
				flushTimeoutRef.current = null;
				flushEventQueue();
			}, 16);
		},
		[flushEventQueue],
	);

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
			MAX_RECONNECT_DELAY_MS,
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
		if (
			!normalizedUrl.startsWith("http://") &&
			!normalizedUrl.startsWith("https://")
		) {
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
		incompleteLineRef.current = "";

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

			if (
				xhr.readyState === XMLHttpRequest.LOADING ||
				xhr.readyState === XMLHttpRequest.DONE
			) {
				const newData = xhr.responseText.slice(lastProcessedIndexRef.current);
				lastProcessedIndexRef.current = xhr.responseText.length;

				if (newData) {
					const textToParse = incompleteLineRef.current + newData;
					const lines = textToParse.split("\n");

					incompleteLineRef.current = lines.pop() || "";

					for (const line of lines) {
						const trimmedLine = line.trim();
						if (!trimmedLine) continue;

						if (trimmedLine.startsWith("data: ")) {
							const data = trimmedLine.slice(6);
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

								if (DEBUG_STREAM) {
									console.log("[EventStream] Event:", event.type);
								}

								enqueueEvent(event);
							} catch (parseError) {
								if (DEBUG_STREAM) {
									console.warn(
										"[EventStream] JSON parse error:",
										parseError,
										"Data:",
										data.slice(0, 200),
									);
								}
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
	}, [
		serverUrl,
		authToken,
		directory,
		isConnected,
		clearTimers,
		doScheduleReconnect,
		enqueueEvent,
	]);

	connectRef.current = connect;

	useEffect(() => {
		const handleAppStateChange = (nextAppState: AppStateStatus) => {
			const previousState = appStateRef.current;
			appStateRef.current = nextAppState;

			if (
				previousState.match(/inactive|background/) &&
				nextAppState === "active"
			) {
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

		const subscription = AppState.addEventListener(
			"change",
			handleAppStateChange,
		);

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
