import * as Device from "expo-device";
import { useCallback, useState } from "react";
import { useConnectionStore } from "../stores/useConnectionStore";

interface ServerConnectionState {
	isConnecting: boolean;
	error: Error | null;
}

interface PairingData {
	url: string;
	pairCode: string;
	pairSecret: string;
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
	return deviceName || modelName || "iOS Device";
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
				const deviceName = await getDeviceName();

				const response = await fetch(`${pairingData.url}/api/auth/pair`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						pairCode: pairingData.pairCode,
						pairSecret: pairingData.pairSecret,
						deviceName,
					}),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(errorData.message || "Failed to pair with server");
				}

				const { token } = await response.json();

				await setConnection(pairingData.url, token);

				setState({ isConnecting: false, error: null });
				return { token, serverUrl: pairingData.url };
			} catch (error) {
				const err = error instanceof Error ? error : new Error("Unknown error");
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
				const healthResponse = await fetch(`${serverUrl}/api/health`, {
					method: "GET",
				}).catch(() => null);

				if (!healthResponse?.ok) {
					throw new Error("Cannot reach server. Check the URL and try again.");
				}

				const loginResponse = await fetch(`${serverUrl}/api/auth/login`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ password }),
				});

				if (!loginResponse.ok) {
					if (loginResponse.status === 401) {
						throw new Error("Invalid password");
					}
					throw new Error("Failed to authenticate");
				}

				const { token } = await loginResponse.json();

				await setConnection(serverUrl, token);

				setState({ isConnecting: false, error: null });
				return { token, serverUrl };
			} catch (error) {
				const err = error instanceof Error ? error : new Error("Unknown error");
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
