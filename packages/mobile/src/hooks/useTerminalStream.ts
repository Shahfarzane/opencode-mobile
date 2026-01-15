import { useCallback, useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import type { TerminalStreamEvent } from "../api/terminal";
import { useConnectionStore } from "../stores/useConnectionStore";

const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 8000;
const CONNECTION_TIMEOUT_MS = 10000;
const MAX_RETRY_ATTEMPTS = 3;

export interface UseTerminalStreamOptions {
	sessionId: string | null;
	onData: (data: string) => void;
	onConnected: () => void;
	onExit: (exitCode: number, signal: number | null) => void;
	onError: (error: Error) => void;
	onReconnecting?: (attempt: number, maxAttempts: number) => void;
}

export function useTerminalStream(options: UseTerminalStreamOptions) {
	const { sessionId, onData, onConnected, onExit, onError, onReconnecting } =
		options;

	const {
		serverUrl,
		authToken,
		isConnected: isServerConnected,
	} = useConnectionStore();

	const xhrRef = useRef<XMLHttpRequest | null>(null);
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const lastProcessedIndexRef = useRef(0);
	const isConnectingRef = useRef(false);
	const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY_MS);
	const retryCountRef = useRef(0);
	const isActiveRef = useRef(true);
	const appStateRef = useRef<AppStateStatus>(AppState.currentState);
	const terminalExitedRef = useRef(false);
	const outputQueueRef = useRef<string[]>([]);
	const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const onDataRef = useRef(onData);
	const onConnectedRef = useRef(onConnected);
	const onExitRef = useRef(onExit);
	const onErrorRef = useRef(onError);
	const onReconnectingRef = useRef(onReconnecting);
	const sessionIdRef = useRef(sessionId);
	const connectRef = useRef<() => void>(() => {});

	onDataRef.current = onData;
	onConnectedRef.current = onConnected;
	onExitRef.current = onExit;
	onErrorRef.current = onError;
	onReconnectingRef.current = onReconnecting;
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
		outputQueueRef.current = [];
	}, []);

	const flushOutputQueue = useCallback(() => {
		if (outputQueueRef.current.length === 0) return;
		const merged = outputQueueRef.current.join("");
		outputQueueRef.current = [];
		onDataRef.current(merged);
	}, []);

	const enqueueOutput = useCallback(
		(chunk: string) => {
			if (!chunk) return;
			outputQueueRef.current.push(chunk);
			if (flushTimeoutRef.current) return;
			flushTimeoutRef.current = setTimeout(() => {
				flushTimeoutRef.current = null;
				flushOutputQueue();
			}, 16);
		},
		[flushOutputQueue],
	);

	const scheduleReconnect = useCallback(() => {
		if (
			!isActiveRef.current ||
			!isServerConnected ||
			terminalExitedRef.current
		) {
			return;
		}

		if (retryCountRef.current >= MAX_RETRY_ATTEMPTS) {
			console.log("[TerminalStream] Max retries reached");
			onErrorRef.current(
				new Error("Terminal connection failed after max retries"),
			);
			return;
		}

		clearTimers();

		retryCountRef.current += 1;
		const delay = reconnectDelayRef.current;

		console.log(
			`[TerminalStream] Reconnecting in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})`,
		);
		onReconnectingRef.current?.(retryCountRef.current, MAX_RETRY_ATTEMPTS);

		reconnectTimeoutRef.current = setTimeout(() => {
			if (
				isActiveRef.current &&
				isServerConnected &&
				!terminalExitedRef.current
			) {
				connectRef.current();
			}
		}, delay);

		reconnectDelayRef.current = Math.min(
			reconnectDelayRef.current * 2,
			MAX_RECONNECT_DELAY_MS,
		);
	}, [isServerConnected, clearTimers]);

	const connect = useCallback(() => {
		const currentSessionId = sessionIdRef.current;

		if (!serverUrl || !authToken || !isServerConnected || !currentSessionId) {
			console.log("[TerminalStream] Missing required params, skipping");
			return;
		}

		if (terminalExitedRef.current) {
			console.log("[TerminalStream] Terminal already exited, skipping");
			return;
		}

		if (isConnectingRef.current || xhrRef.current) {
			console.log("[TerminalStream] Already connecting or connected");
			return;
		}

		if (appStateRef.current !== "active") {
			console.log("[TerminalStream] App not active, skipping");
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

		const url = `${normalizedUrl}/api/terminal/${currentSessionId}/stream`;
		console.log(`[TerminalStream] Connecting to: ${url}`);

		const xhr = new XMLHttpRequest();
		xhrRef.current = xhr;
		lastProcessedIndexRef.current = 0;

		connectionTimeoutRef.current = setTimeout(() => {
			if (xhrRef.current === xhr && isConnectingRef.current) {
				console.warn("[TerminalStream] Connection timeout");
				xhr.abort();
				scheduleReconnect();
			}
		}, CONNECTION_TIMEOUT_MS);

		xhr.open("GET", url, true);
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
					console.log("[TerminalStream] Connected successfully");
					isConnectingRef.current = false;
					reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;
					retryCountRef.current = 0;
					onConnectedRef.current();
				} else {
					console.error(`[TerminalStream] Connection failed: ${xhr.status}`);
					isConnectingRef.current = false;
					scheduleReconnect();
				}
			}

			if (
				xhr.readyState === XMLHttpRequest.LOADING ||
				xhr.readyState === XMLHttpRequest.DONE
			) {
				const newData = xhr.responseText.slice(lastProcessedIndexRef.current);
				lastProcessedIndexRef.current = xhr.responseText.length;

				if (newData) {
					const lines = newData.split("\n");
					for (const line of lines) {
						if (line.startsWith("data: ")) {
							const data = line.slice(6).trim();
							if (!data || data === "[DONE]") continue;

							try {
								const parsed = JSON.parse(data) as TerminalStreamEvent;

								if (parsed.type === "connected") {
									console.log("[TerminalStream] Received connected event");
								} else if (parsed.type === "data" && parsed.data) {
									enqueueOutput(parsed.data);
								} else if (parsed.type === "exit") {
									console.log("[TerminalStream] Terminal exited", {
										exitCode: parsed.exitCode,
										signal: parsed.signal,
									});
									terminalExitedRef.current = true;
									onExitRef.current(
										parsed.exitCode ?? 0,
										parsed.signal ?? null,
									);
									abortConnection();
									clearTimers();
								}
							} catch {
								if (data.length < 1000) {
									enqueueOutput(data);
								}
							}
						}
					}
				}
			}

			if (
				xhr.readyState === XMLHttpRequest.DONE &&
				!terminalExitedRef.current
			) {
				console.log("[TerminalStream] Connection closed unexpectedly");
				xhrRef.current = null;
				isConnectingRef.current = false;

				if (isActiveRef.current && isServerConnected) {
					scheduleReconnect();
				}
			}
		};

		xhr.onerror = () => {
			console.error("[TerminalStream] XHR error");
			clearTimers();
			xhrRef.current = null;
			isConnectingRef.current = false;

			if (
				isActiveRef.current &&
				isServerConnected &&
				!terminalExitedRef.current
			) {
				scheduleReconnect();
			}
		};

		xhr.ontimeout = () => {
			console.error("[TerminalStream] XHR timeout");
			xhrRef.current = null;
			isConnectingRef.current = false;

			if (
				isActiveRef.current &&
				isServerConnected &&
				!terminalExitedRef.current
			) {
				scheduleReconnect();
			}
		};

		xhr.send();
	}, [
		serverUrl,
		authToken,
		isServerConnected,
		clearTimers,
		scheduleReconnect,
		abortConnection,
		enqueueOutput,
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
				console.log("[TerminalStream] App became active");
				if (sessionIdRef.current && !terminalExitedRef.current) {
					abortConnection();
					clearTimers();
					reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;
					retryCountRef.current = 0;

					setTimeout(() => {
						if (isServerConnected && !terminalExitedRef.current) {
							connectRef.current();
						}
					}, 100);
				}
			} else if (nextAppState.match(/inactive|background/)) {
				console.log("[TerminalStream] App going to background");
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
	}, [isServerConnected, abortConnection, clearTimers]);

	useEffect(() => {
		if (!sessionId) {
			abortConnection();
			clearTimers();
			terminalExitedRef.current = false;
			return;
		}

		isActiveRef.current = true;
		terminalExitedRef.current = false;
		retryCountRef.current = 0;
		reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;

		if (isServerConnected && appStateRef.current === "active") {
			connectRef.current();
		}

		return () => {
			isActiveRef.current = false;
			abortConnection();
			clearTimers();
		};
	}, [sessionId, isServerConnected, abortConnection, clearTimers]);

	const disconnect = useCallback(() => {
		isActiveRef.current = false;
		abortConnection();
		clearTimers();
	}, [abortConnection, clearTimers]);

	const isConnected = xhrRef.current !== null && !isConnectingRef.current;
	const isReconnecting = retryCountRef.current > 0 && isConnectingRef.current;

	return {
		disconnect,
		isConnected,
		isReconnecting,
	};
}
