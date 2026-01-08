import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const STORAGE_KEYS = {
	SERVER_URL: "openchamber_server_url",
	AUTH_TOKEN: "openchamber_auth_token",
	DIRECTORY: "openchamber_directory",
	PINNED_DIRECTORIES: "openchamber_pinned_directories",
} as const;

interface ConnectionState {
	serverUrl: string | null;
	authToken: string | null;
	directory: string | null;
	homeDirectory: string | null;
	pinnedDirectories: string[];
	isConnected: boolean;
	isInitialized: boolean;
}

interface ConnectionActions {
	initialize: () => Promise<void>;
	setConnection: (serverUrl: string, authToken: string) => Promise<void>;
	setDirectory: (directory: string) => Promise<void>;
	syncServerDirectory: () => Promise<void>;
	loadPinnedDirectories: () => Promise<void>;
	togglePinnedDirectory: (path: string) => Promise<void>;
	disconnect: () => Promise<void>;
}

type ConnectionStore = ConnectionState & ConnectionActions;

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
	serverUrl: null,
	authToken: null,
	directory: null,
	homeDirectory: null,
	pinnedDirectories: [],
	isConnected: false,
	isInitialized: false,

	initialize: async () => {
		try {
			const [serverUrl, authToken, directory, pinnedDirectoriesRaw] = await Promise.all([
				SecureStore.getItemAsync(STORAGE_KEYS.SERVER_URL),
				SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN),
				SecureStore.getItemAsync(STORAGE_KEYS.DIRECTORY),
				SecureStore.getItemAsync(STORAGE_KEYS.PINNED_DIRECTORIES),
			]);

			let pinnedDirectories: string[] = [];
			if (pinnedDirectoriesRaw) {
				try {
					pinnedDirectories = JSON.parse(pinnedDirectoriesRaw);
				} catch {
					pinnedDirectories = [];
				}
			}

			set({
				serverUrl,
				authToken,
				directory,
				pinnedDirectories,
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

	loadPinnedDirectories: async () => {
		const { serverUrl, authToken } = get();
		if (!serverUrl || !authToken) return;

		try {
			// Try to fetch from server
			const response = await fetch(`${serverUrl}/api/config/settings`, {
				headers: {
					Authorization: `Bearer ${authToken}`,
					Accept: "application/json",
				},
			});

			if (response.ok) {
				const data = await response.json();
				const pinnedDirectories = Array.isArray(data?.pinnedDirectories)
					? data.pinnedDirectories
					: [];

				// Cache locally
				await SecureStore.setItemAsync(
					STORAGE_KEYS.PINNED_DIRECTORIES,
					JSON.stringify(pinnedDirectories)
				);

				set({ pinnedDirectories });
			}
		} catch (error) {
			console.warn("Failed to load pinned directories:", error);
			// Fall back to cached data (already loaded in initialize)
		}
	},

	togglePinnedDirectory: async (path: string) => {
		const { serverUrl, authToken, pinnedDirectories } = get();
		if (!serverUrl || !authToken) return;

		// Toggle the path in the array
		const isPinned = pinnedDirectories.includes(path);
		const newPinnedDirectories = isPinned
			? pinnedDirectories.filter((p) => p !== path)
			: [...pinnedDirectories, path];

		// Optimistically update local state
		set({ pinnedDirectories: newPinnedDirectories });

		// Cache locally
		await SecureStore.setItemAsync(
			STORAGE_KEYS.PINNED_DIRECTORIES,
			JSON.stringify(newPinnedDirectories)
		);

		// Sync to server
		try {
			await fetch(`${serverUrl}/api/config/settings`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${authToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					pinnedDirectories: newPinnedDirectories,
				}),
			});
		} catch (error) {
			console.warn("Failed to sync pinned directories to server:", error);
			// Keep local state even if server sync fails
		}
	},

	disconnect: async () => {
		await Promise.all([
			SecureStore.deleteItemAsync(STORAGE_KEYS.SERVER_URL),
			SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN),
			SecureStore.deleteItemAsync(STORAGE_KEYS.DIRECTORY),
			SecureStore.deleteItemAsync(STORAGE_KEYS.PINNED_DIRECTORIES),
		]);

		set({
			serverUrl: null,
			authToken: null,
			directory: null,
			homeDirectory: null,
			pinnedDirectories: [],
			isConnected: false,
		});
	},
}));

export const getConnectionState = () => useConnectionStore.getState();
