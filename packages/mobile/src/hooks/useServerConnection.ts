import * as Device from "expo-device";
import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { useConnectionStore } from "../stores/useConnectionStore";

const CONNECTION_TIMEOUT_MS = 15000;
const AUTH_TIMEOUT_MS = 10000;

interface ServerConnectionState {
	isConnecting: boolean;
	error: Error | null;
}

interface PairingData {
	url: string;
	pairCode: string;
	pairSecret: string;
}

interface XHRResponse {
	status: number;
	data: string;
}

function parsePairingUrl(url: string): PairingData {
	const urlObj = new URL(url);
	const serverUrl = urlObj.searchParams.get("url");
	const pairCode = urlObj.searchParams.get("code");
	const pairSecret = urlObj.searchParams.get("secret");

	if (!serverUrl || !pairCode || !pairSecret) {
		throw new Error("Invalid pairing QR code");
	}

	return { url: serverUrl, pairCode, pairSecret };
}

async function getDeviceName(): Promise<string> {
	const deviceName = Device.deviceName;
	const modelName = Device.modelName;
	return deviceName || modelName || `${Platform.OS === "ios" ? "iOS" : "Android"} Device`;
}

function normalizeServerUrl(url: string): string {
	let normalized = url.trim();
	
	if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
		normalized = `http://${normalized}`;
	}
	
	if (normalized.endsWith("/")) {
		normalized = normalized.slice(0, -1);
	}
	
	return normalized;
}

function xhrRequest(
	method: string,
	url: string,
	headers: Record<string, string>,
	body: string | null,
	timeoutMs: number,
): Promise<XHRResponse> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		let settled = false;

		const timeoutId = setTimeout(() => {
			if (!settled) {
				settled = true;
				xhr.abort();
				reject(new Error("Connection timed out. Check the server URL and try again."));
			}
		}, timeoutMs);

		xhr.onreadystatechange = () => {
			if (xhr.readyState === XMLHttpRequest.DONE && !settled) {
				settled = true;
				clearTimeout(timeoutId);

				if (xhr.status === 0) {
					reject(new Error(
						"Cannot reach server. Make sure:\n" +
						"• The server is running\n" +
						"• Your device is on the same network\n" +
						"• The URL is correct"
					));
					return;
				}

				resolve({
					status: xhr.status,
					data: xhr.responseText,
				});
			}
		};

		xhr.onerror = () => {
			if (!settled) {
				settled = true;
				clearTimeout(timeoutId);
				reject(new Error(
					"Cannot reach server. Make sure:\n" +
					"• The server is running\n" +
					"• Your device is on the same network\n" +
					"• The URL is correct"
				));
			}
		};

		xhr.ontimeout = () => {
			if (!settled) {
				settled = true;
				clearTimeout(timeoutId);
				reject(new Error("Connection timed out. Check the server URL and try again."));
			}
		};

		xhr.open(method, url, true);
		xhr.timeout = timeoutMs;

		for (const [key, value] of Object.entries(headers)) {
			xhr.setRequestHeader(key, value);
		}

		xhr.send(body);
	});
}

export function useServerConnection() {
	const [state, setState] = useState<ServerConnectionState>({
		isConnecting: false,
		error: null,
	});

	const { setConnection, disconnect: storeDisconnect } = useConnectionStore();

	const pairWithQRCode = useCallback(
		async (qrData: string) => {
			setState({ isConnecting: true, error: null });

			try {
				const pairingData = parsePairingUrl(qrData);
				const normalizedUrl = normalizeServerUrl(pairingData.url);
				const deviceName = await getDeviceName();

				console.log(`[Connection] Pairing with server: ${normalizedUrl}`);

				const response = await xhrRequest(
					"POST",
					`${normalizedUrl}/api/auth/pair`,
					{ "Content-Type": "application/json" },
					JSON.stringify({
						pairCode: pairingData.pairCode,
						pairSecret: pairingData.pairSecret,
						deviceName,
					}),
					AUTH_TIMEOUT_MS
				);

				if (response.status < 200 || response.status >= 300) {
					let errorMessage = "Failed to pair with server";
					try {
						const errorData = JSON.parse(response.data);
						if (errorData.message) {
							errorMessage = errorData.message;
						}
					} catch {
					}
					throw new Error(errorMessage);
				}

				const { token } = JSON.parse(response.data);
				await setConnection(normalizedUrl, token);

				setState({ isConnecting: false, error: null });
				return { token, serverUrl: normalizedUrl };
			} catch (error) {
				const err = error instanceof Error ? error : new Error("Unknown error");
				console.error(`[Connection] Pairing failed:`, err.message);
				setState({ isConnecting: false, error: err });
				throw err;
			}
		},
		[setConnection],
	);

	const connectWithPassword = useCallback(
		async (serverUrl: string, password: string) => {
			setState({ isConnecting: true, error: null });

			try {
				const normalizedUrl = normalizeServerUrl(serverUrl);
				console.log(`[Connection] Connecting to: ${normalizedUrl}`);
				console.log(`[Connection] Platform: ${Platform.OS}`);

				let healthResponse: XHRResponse | null = null;
				try {
					healthResponse = await xhrRequest(
						"GET",
						`${normalizedUrl}/health`,
						{},
						null,
						CONNECTION_TIMEOUT_MS
					);
				} catch (error) {
					console.error(`[Connection] Health check failed:`, error);
					throw new Error(
						"Cannot reach server. Check the URL and ensure:\n" +
						"• The server is running (openchamber command)\n" +
						"• Your device is on the same network\n" +
						"• For physical devices, use your computer's IP address"
					);
				}

				if (!healthResponse || healthResponse.status < 200 || healthResponse.status >= 300) {
					throw new Error(
						"Cannot reach server. Check the URL and ensure:\n" +
						"• The server is running (openchamber command)\n" +
						"• Your device is on the same network\n" +
						"• For physical devices, use your computer's IP address"
					);
				}

				console.log(`[Connection] Health check passed, attempting login`);

				const loginResponse = await xhrRequest(
					"POST",
					`${normalizedUrl}/api/auth/login`,
					{ "Content-Type": "application/json" },
					JSON.stringify({ password }),
					AUTH_TIMEOUT_MS
				);

				if (loginResponse.status === 401) {
					throw new Error("Invalid password");
				}

				if (loginResponse.status < 200 || loginResponse.status >= 300) {
					throw new Error(`Authentication failed (${loginResponse.status})`);
				}

				const { token } = JSON.parse(loginResponse.data);
				await setConnection(normalizedUrl, token);

				console.log(`[Connection] Successfully connected`);
				setState({ isConnecting: false, error: null });
				return { token, serverUrl: normalizedUrl };
			} catch (error) {
				const err = error instanceof Error ? error : new Error("Unknown error");
				console.error(`[Connection] Connection failed:`, err.message);
				setState({ isConnecting: false, error: err });
				throw err;
			}
		},
		[setConnection],
	);

	const disconnect = useCallback(async () => {
		await storeDisconnect();
	}, [storeDisconnect]);

	const getStoredConnection = useCallback(async () => {
		const state = useConnectionStore.getState();
		return state.serverUrl && state.authToken
			? { token: state.authToken, serverUrl: state.serverUrl }
			: null;
	}, []);

	return {
		...state,
		pairWithQRCode,
		connectWithPassword,
		disconnect,
		getStoredConnection,
	};
}
