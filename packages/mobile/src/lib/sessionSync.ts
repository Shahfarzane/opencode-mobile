import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import {
	type Session,
	type SessionMessage,
	sessionsApi,
} from "../api/sessions";
import {
	type CachedSession,
	cacheMessages,
	cacheSessionList,
	getCachedMessages,
	getCachedSessionList,
	initializeCache,
	isSessionListStale,
	removeCachedSession,
	updateCachedSession,
} from "./offlineCache";

export type NetworkStatus = "online" | "offline" | "unknown";

export interface SyncState {
	networkStatus: NetworkStatus;
	lastSyncAt: number | null;
	isSyncing: boolean;
	syncError: string | null;
}

let currentNetworkStatus: NetworkStatus = "unknown";
let networkListeners: Array<(status: NetworkStatus) => void> = [];

export function getNetworkStatus(): NetworkStatus {
	return currentNetworkStatus;
}

export function subscribeToNetworkStatus(
	callback: (status: NetworkStatus) => void,
): () => void {
	networkListeners.push(callback);
	callback(currentNetworkStatus);

	return () => {
		networkListeners = networkListeners.filter((cb) => cb !== callback);
	};
}

function notifyNetworkListeners(status: NetworkStatus): void {
	for (const listener of networkListeners) {
		listener(status);
	}
}

function mapNetInfoToStatus(state: NetInfoState): NetworkStatus {
	if (state.isConnected === null) return "unknown";
	return state.isConnected ? "online" : "offline";
}

let unsubscribeNetInfo: (() => void) | null = null;

export function initializeNetworkMonitoring(): void {
	if (unsubscribeNetInfo) return;

	unsubscribeNetInfo = NetInfo.addEventListener((state) => {
		const newStatus = mapNetInfoToStatus(state);
		if (newStatus !== currentNetworkStatus) {
			currentNetworkStatus = newStatus;
			notifyNetworkListeners(newStatus);
			console.log("[SessionSync] Network status changed:", newStatus);
		}
	});

	NetInfo.fetch().then((state) => {
		currentNetworkStatus = mapNetInfoToStatus(state);
		notifyNetworkListeners(currentNetworkStatus);
	});
}

export function cleanupNetworkMonitoring(): void {
	if (unsubscribeNetInfo) {
		unsubscribeNetInfo();
		unsubscribeNetInfo = null;
	}
	networkListeners = [];
}

export async function fetchSessionsWithCache(): Promise<{
	sessions: Session[];
	fromCache: boolean;
	stale: boolean;
}> {
	const isStale = await isSessionListStale();
	const { sessions: cachedSessions } = await getCachedSessionList();

	if (currentNetworkStatus === "offline") {
		return {
			sessions: cachedSessions,
			fromCache: true,
			stale: isStale,
		};
	}

	try {
		const freshSessions = await sessionsApi.list();
		await cacheSessionList(freshSessions);

		return {
			sessions: freshSessions,
			fromCache: false,
			stale: false,
		};
	} catch (error) {
		console.error(
			"[SessionSync] Failed to fetch sessions, using cache:",
			error,
		);

		if (cachedSessions.length > 0) {
			return {
				sessions: cachedSessions,
				fromCache: true,
				stale: true,
			};
		}

		throw error;
	}
}

export async function fetchMessagesWithCache(
	sessionId: string,
	forceRefresh: boolean = false,
): Promise<{
	messages: SessionMessage[];
	fromCache: boolean;
	isComplete: boolean;
}> {
	if (!forceRefresh) {
		const cached = await getCachedMessages(sessionId);
		if (cached) {
			if (currentNetworkStatus === "offline") {
				return {
					messages: cached.messages,
					fromCache: true,
					isComplete: cached.isComplete,
				};
			}

			const cacheAge = Date.now() - cached.syncedAt;
			const CACHE_FRESH_THRESHOLD = 30 * 1000;
			if (cacheAge < CACHE_FRESH_THRESHOLD) {
				return {
					messages: cached.messages,
					fromCache: true,
					isComplete: cached.isComplete,
				};
			}
		}
	}

	if (currentNetworkStatus === "offline") {
		const cached = await getCachedMessages(sessionId);
		return {
			messages: cached?.messages ?? [],
			fromCache: true,
			isComplete: cached?.isComplete ?? false,
		};
	}

	try {
		const freshMessages = await sessionsApi.getMessages(sessionId);
		await cacheMessages(sessionId, freshMessages, true);

		return {
			messages: freshMessages,
			fromCache: false,
			isComplete: true,
		};
	} catch (error) {
		console.error(
			"[SessionSync] Failed to fetch messages, using cache:",
			error,
		);

		const cached = await getCachedMessages(sessionId);
		if (cached) {
			return {
				messages: cached.messages,
				fromCache: true,
				isComplete: cached.isComplete,
			};
		}

		throw error;
	}
}

export async function createSessionWithSync(): Promise<Session> {
	if (currentNetworkStatus === "offline") {
		throw new Error("Cannot create session while offline");
	}

	const newSession = await sessionsApi.create();

	const session: Session = {
		id: newSession.id,
		time: {
			created: Date.now(),
			updated: Date.now(),
		},
	};

	await updateCachedSession(session);

	return session;
}

export async function deleteSessionWithSync(sessionId: string): Promise<void> {
	await removeCachedSession(sessionId);

	if (currentNetworkStatus === "online") {
		try {
			await sessionsApi.delete(sessionId);
		} catch (error) {
			console.error("[SessionSync] Failed to delete session on server:", error);
		}
	}
}

export async function updateSessionWithSync(
	sessionId: string,
	updates: Partial<Session>,
): Promise<Session> {
	const { sessions } = await getCachedSessionList();
	const existing = sessions.find((s) => s.id === sessionId);

	const updatedSession: Session = {
		...existing,
		id: sessionId,
		...updates,
		time: {
			created: existing?.time?.created ?? Date.now(),
			updated: Date.now(),
		},
	};

	await updateCachedSession(updatedSession);

	if (currentNetworkStatus === "online" && updates.title) {
		try {
			await sessionsApi.updateTitle(sessionId, updates.title);
		} catch (error) {
			console.error(
				"[SessionSync] Failed to update session title on server:",
				error,
			);
		}
	}

	return updatedSession;
}

export async function syncSessionsOnResume(): Promise<void> {
	if (currentNetworkStatus !== "online") return;

	console.log("[SessionSync] Syncing sessions on app resume...");

	try {
		const freshSessions = await sessionsApi.list();
		await cacheSessionList(freshSessions);
		console.log("[SessionSync] Sessions synced:", freshSessions.length);
	} catch (error) {
		console.error("[SessionSync] Failed to sync sessions on resume:", error);
	}
}

export function getCachedSessionById(
	sessions: CachedSession[],
	sessionId: string,
): CachedSession | undefined {
	return sessions.find((s) => s.id === sessionId);
}

export function isSessionCached(
	sessions: CachedSession[],
	sessionId: string,
): boolean {
	const session = getCachedSessionById(sessions, sessionId);
	return session?.isFullCache ?? false;
}

export function getSessionCacheInfo(session: CachedSession): {
	isCached: boolean;
	messageCount: number;
	lastSynced: Date | null;
} {
	return {
		isCached: session.isFullCache,
		messageCount: session.messageCount,
		lastSynced: session.syncedAt ? new Date(session.syncedAt) : null,
	};
}

export async function initializeSessionSync(): Promise<void> {
	await initializeCache();
	initializeNetworkMonitoring();
	console.log("[SessionSync] Initialized");
}

export async function cleanupSessionSync(): Promise<void> {
	cleanupNetworkMonitoring();
	console.log("[SessionSync] Cleaned up");
}
