import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const STORAGE_KEYS = {
	SERVER_URL: "openchamber_server_url",
	AUTH_TOKEN: "openchamber_auth_token",
	DIRECTORY: "openchamber_directory",
} as const;

interface ConnectionState {
	serverUrl: string | null;
	authToken: string | null;
	directory: string | null;
	homeDirectory: string | null;
	isConnected: boolean;
	isInitialized: boolean;
}

interface ConnectionActions {
	initialize: () => Promise<void>;
	setConnection: (serverUrl: string, authToken: string) => Promise<void>;
	setDirectory: (directory: string) => Promise<void>;
	syncServerDirectory: () => Promise<void>;
	disconnect: () => Promise<void>;
}

type ConnectionStore = ConnectionState & ConnectionActions;

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
	serverUrl: null,
	authToken: null,
	directory: null,
	homeDirectory: null,
	isConnected: false,
	isInitialized: false,

	initialize: async () => {
		try {
			const [serverUrl, authToken, directory] = await Promise.all([
				SecureStore.getItemAsync(STORAGE_KEYS.SERVER_URL),
				SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN),
				SecureStore.getItemAsync(STORAGE_KEYS.DIRECTORY),
			]);

			set({
				serverUrl,
				authToken,
				directory,
				isConnected: Boolean(serverUrl && authToken),
				isInitialized: true,
			});
		} catch {
			set({ isInitialized: true, isConnected: false });
		}
	},

	setConnection: async (serverUrl: string, authToken: string) => {
		await Promise.all([
			SecureStore.setItemAsync(STORAGE_KEYS.SERVER_URL, serverUrl),
			SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, authToken),
		]);

		set({
			serverUrl,
			authToken,
			isConnected: true,
		});

		// After connecting, sync the server's working directory
		const state = get();
		if (!state.directory) {
			await state.syncServerDirectory();
		}
	},

	setDirectory: async (directory: string) => {
		await SecureStore.setItemAsync(STORAGE_KEYS.DIRECTORY, directory);
		set({ directory });
	},

	/**
	 * Sync the directory from the server's current working directory.
	 * This is called when no local directory is set to initialize with
	 * the directory where the server is running.
	 */
	syncServerDirectory: async () => {
		const { serverUrl, authToken } = get();
		if (!serverUrl || !authToken) return;

		try {
			const response = await fetch(`${serverUrl}/api/fs/cwd`, {
				headers: {
					Authorization: `Bearer ${authToken}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				if (data.cwd) {
					await SecureStore.setItemAsync(STORAGE_KEYS.DIRECTORY, data.cwd);
					set({
						directory: data.cwd,
						homeDirectory: data.home || null,
					});
				}
			}
		} catch (error) {
			console.warn("Failed to sync server directory:", error);
		}
	},

	disconnect: async () => {
		await Promise.all([
			SecureStore.deleteItemAsync(STORAGE_KEYS.SERVER_URL),
			SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN),
			SecureStore.deleteItemAsync(STORAGE_KEYS.DIRECTORY),
		]);

		set({
			serverUrl: null,
			authToken: null,
			directory: null,
			homeDirectory: null,
			isConnected: false,
		});
	},
}));

export const getConnectionState = () => useConnectionStore.getState();
