import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import type { Session, SessionMessage } from "../api/sessions";

export interface CacheConfig {
	maxSessions: number;
	fullCacheSessions: number;
	maxMessagesPerSession: number;
	maxCacheSize: number;
	cacheTTL: number;
	sessionListTTL: number;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
	maxSessions: 50,
	fullCacheSessions: 10,
	maxMessagesPerSession: 500,
	maxCacheSize: 100 * 1024 * 1024,
	cacheTTL: 7 * 24 * 60 * 60 * 1000,
	sessionListTTL: 5 * 60 * 1000,
};

const STORAGE_KEYS = {
	SESSION_LIST: "oc.cache.sessions",
	SESSION_LIST_META: "oc.cache.sessions.meta",
	LRU_ORDER: "oc.cache.lru",
	CACHE_STATS: "oc.cache.stats",
	MODEL_FAVORITES: "oc.cache.model.favorites",
	MODEL_RECENTS: "oc.cache.model.recents",
} as const;

const MESSAGE_CACHE_DIR = new Directory(Paths.cache, "message_cache");

export interface CachedSession extends Session {
	cachedAt: number;
	syncedAt: number;
	isFullCache: boolean;
	messageCount: number;
}

export interface SessionListMeta {
	fetchedAt: number;
	totalCount: number;
	isComplete: boolean;
}

export interface CacheStats {
	totalSize: number;
	sessionsWithMessages: number;
	lastCleanup: number;
	hits: number;
	misses: number;
}

export interface CachedMessages {
	sessionId: string;
	messages: SessionMessage[];
	cachedAt: number;
	syncedAt: number;
	isComplete: boolean;
}

let lruOrder: string[] = [];
let lruLoaded = false;

async function loadLRUOrder(): Promise<string[]> {
	if (lruLoaded) return lruOrder;

	try {
		const stored = await AsyncStorage.getItem(STORAGE_KEYS.LRU_ORDER);
		lruOrder = stored ? JSON.parse(stored) : [];
		lruLoaded = true;
	} catch (error) {
		console.error("[OfflineCache] Failed to load LRU order:", error);
		lruOrder = [];
		lruLoaded = true;
	}
	return lruOrder;
}

async function saveLRUOrder(): Promise<void> {
	try {
		await AsyncStorage.setItem(STORAGE_KEYS.LRU_ORDER, JSON.stringify(lruOrder));
	} catch (error) {
		console.error("[OfflineCache] Failed to save LRU order:", error);
	}
}

async function touchSession(sessionId: string): Promise<void> {
	await loadLRUOrder();

	const index = lruOrder.indexOf(sessionId);
	if (index > -1) {
		lruOrder.splice(index, 1);
	}
	lruOrder.unshift(sessionId);

	await saveLRUOrder();
}

async function getLeastRecentlyUsed(count: number): Promise<string[]> {
	await loadLRUOrder();
	return lruOrder.slice(-count);
}

async function removeFromLRU(sessionId: string): Promise<void> {
	await loadLRUOrder();
	const index = lruOrder.indexOf(sessionId);
	if (index > -1) {
		lruOrder.splice(index, 1);
		await saveLRUOrder();
	}
}

let cacheStats: CacheStats = {
	totalSize: 0,
	sessionsWithMessages: 0,
	lastCleanup: 0,
	hits: 0,
	misses: 0,
};

async function loadCacheStats(): Promise<CacheStats> {
	try {
		const stored = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_STATS);
		if (stored) {
			cacheStats = JSON.parse(stored);
		}
	} catch (error) {
		console.error("[OfflineCache] Failed to load cache stats:", error);
	}
	return cacheStats;
}

async function saveCacheStats(): Promise<void> {
	try {
		await AsyncStorage.setItem(STORAGE_KEYS.CACHE_STATS, JSON.stringify(cacheStats));
	} catch (error) {
		console.error("[OfflineCache] Failed to save cache stats:", error);
	}
}

export async function getCacheStats(): Promise<CacheStats> {
	return loadCacheStats();
}

async function ensureCacheDir(): Promise<void> {
	if (!MESSAGE_CACHE_DIR.exists) {
		await MESSAGE_CACHE_DIR.create();
	}
}

function getMessageCacheFile(sessionId: string): File {
	const safeId = sessionId.replace(/[^a-zA-Z0-9_-]/g, "_");
	return new File(MESSAGE_CACHE_DIR, `${safeId}.json`);
}

export async function getCachedSessionList(): Promise<{
	sessions: CachedSession[];
	meta: SessionListMeta | null;
}> {
	try {
		const [sessionsJson, metaJson] = await Promise.all([
			AsyncStorage.getItem(STORAGE_KEYS.SESSION_LIST),
			AsyncStorage.getItem(STORAGE_KEYS.SESSION_LIST_META),
		]);

		const sessions: CachedSession[] = sessionsJson ? JSON.parse(sessionsJson) : [];
		const meta: SessionListMeta | null = metaJson ? JSON.parse(metaJson) : null;

		cacheStats.hits++;
		await saveCacheStats();

		return { sessions, meta };
	} catch (error) {
		console.error("[OfflineCache] Failed to get cached session list:", error);
		cacheStats.misses++;
		await saveCacheStats();
		return { sessions: [], meta: null };
	}
}

export async function cacheSessionList(
	sessions: Session[],
	config: CacheConfig = DEFAULT_CACHE_CONFIG,
): Promise<void> {
	try {
		const now = Date.now();

		const { sessions: existingCached } = await getCachedSessionList();
		const existingMap = new Map(existingCached.map((s) => [s.id, s]));

		const cachedSessions: CachedSession[] = sessions.slice(0, config.maxSessions).map((session) => {
			const existing = existingMap.get(session.id);
			return {
				...session,
				cachedAt: existing?.cachedAt ?? now,
				syncedAt: now,
				isFullCache: existing?.isFullCache ?? false,
				messageCount: existing?.messageCount ?? 0,
			};
		});

		const meta: SessionListMeta = {
			fetchedAt: now,
			totalCount: sessions.length,
			isComplete: sessions.length <= config.maxSessions,
		};

		await Promise.all([
			AsyncStorage.setItem(STORAGE_KEYS.SESSION_LIST, JSON.stringify(cachedSessions)),
			AsyncStorage.setItem(STORAGE_KEYS.SESSION_LIST_META, JSON.stringify(meta)),
		]);

		for (const session of cachedSessions) {
			await touchSession(session.id);
		}
	} catch (error) {
		console.error("[OfflineCache] Failed to cache session list:", error);
	}
}

export async function isSessionListStale(config: CacheConfig = DEFAULT_CACHE_CONFIG): Promise<boolean> {
	try {
		const metaJson = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_LIST_META);
		if (!metaJson) return true;

		const meta: SessionListMeta = JSON.parse(metaJson);
		return Date.now() - meta.fetchedAt > config.sessionListTTL;
	} catch {
		return true;
	}
}

export async function updateCachedSession(session: Session): Promise<void> {
	try {
		const { sessions } = await getCachedSessionList();
		const index = sessions.findIndex((s) => s.id === session.id);

		if (index > -1) {
			sessions[index] = {
				...sessions[index],
				...session,
				syncedAt: Date.now(),
			};
		} else {
			sessions.unshift({
				...session,
				cachedAt: Date.now(),
				syncedAt: Date.now(),
				isFullCache: false,
				messageCount: 0,
			});
		}

		await AsyncStorage.setItem(STORAGE_KEYS.SESSION_LIST, JSON.stringify(sessions));
		await touchSession(session.id);
	} catch (error) {
		console.error("[OfflineCache] Failed to update cached session:", error);
	}
}

export async function removeCachedSession(sessionId: string): Promise<void> {
	try {
		const { sessions } = await getCachedSessionList();
		const filtered = sessions.filter((s) => s.id !== sessionId);
		await AsyncStorage.setItem(STORAGE_KEYS.SESSION_LIST, JSON.stringify(filtered));

		await clearCachedMessages(sessionId);
		await removeFromLRU(sessionId);
	} catch (error) {
		console.error("[OfflineCache] Failed to remove cached session:", error);
	}
}

export async function getCachedMessages(sessionId: string): Promise<CachedMessages | null> {
	try {
		await ensureCacheDir();
		const cacheFile = getMessageCacheFile(sessionId);

		if (!cacheFile.exists) {
			cacheStats.misses++;
			await saveCacheStats();
			return null;
		}

		const content = await cacheFile.text();
		const cached: CachedMessages = JSON.parse(content);

		if (Date.now() - cached.cachedAt > DEFAULT_CACHE_CONFIG.cacheTTL) {
			await clearCachedMessages(sessionId);
			cacheStats.misses++;
			await saveCacheStats();
			return null;
		}

		await touchSession(sessionId);

		cacheStats.hits++;
		await saveCacheStats();

		return cached;
	} catch (error) {
		console.error("[OfflineCache] Failed to get cached messages:", error);
		cacheStats.misses++;
		await saveCacheStats();
		return null;
	}
}

export async function cacheMessages(
	sessionId: string,
	messages: SessionMessage[],
	isComplete: boolean = true,
	config: CacheConfig = DEFAULT_CACHE_CONFIG,
): Promise<void> {
	try {
		await ensureCacheDir();

		const limitedMessages = messages.slice(0, config.maxMessagesPerSession);

		const cached: CachedMessages = {
			sessionId,
			messages: limitedMessages,
			cachedAt: Date.now(),
			syncedAt: Date.now(),
			isComplete: isComplete && messages.length <= config.maxMessagesPerSession,
		};

		const content = JSON.stringify(cached);
		const cacheFile = getMessageCacheFile(sessionId);

		await evictIfNeeded(content.length, config);

		await cacheFile.write(content);

		await updateSessionCacheMetadata(sessionId, limitedMessages.length, true);

		cacheStats.totalSize += content.length;
		cacheStats.sessionsWithMessages++;
		await saveCacheStats();

		await touchSession(sessionId);
	} catch (error) {
		console.error("[OfflineCache] Failed to cache messages:", error);
	}
}

export async function appendCachedMessages(
	sessionId: string,
	newMessages: SessionMessage[],
	config: CacheConfig = DEFAULT_CACHE_CONFIG,
): Promise<void> {
	try {
		const existing = await getCachedMessages(sessionId);
		const existingMessages = existing?.messages ?? [];

		const messageMap = new Map<string, SessionMessage>();
		for (const msg of existingMessages) {
			messageMap.set(msg.info.id, msg);
		}
		for (const msg of newMessages) {
			messageMap.set(msg.info.id, msg);
		}

		const merged = Array.from(messageMap.values()).sort(
			(a, b) => (a.info.createdAt ?? 0) - (b.info.createdAt ?? 0),
		);

		await cacheMessages(sessionId, merged, existing?.isComplete ?? false, config);
	} catch (error) {
		console.error("[OfflineCache] Failed to append cached messages:", error);
	}
}

export async function clearCachedMessages(sessionId: string): Promise<void> {
	try {
		const cacheFile = getMessageCacheFile(sessionId);

		if (cacheFile.exists) {
			const fileInfo = cacheFile.size;
			if (typeof fileInfo === "number") {
				cacheStats.totalSize = Math.max(0, cacheStats.totalSize - fileInfo);
				cacheStats.sessionsWithMessages = Math.max(0, cacheStats.sessionsWithMessages - 1);
			}

			await cacheFile.delete();
			await saveCacheStats();
		}

		await updateSessionCacheMetadata(sessionId, 0, false);
	} catch (error) {
		console.error("[OfflineCache] Failed to clear cached messages:", error);
	}
}

async function updateSessionCacheMetadata(
	sessionId: string,
	messageCount: number,
	isFullCache: boolean,
): Promise<void> {
	try {
		const { sessions } = await getCachedSessionList();
		const index = sessions.findIndex((s) => s.id === sessionId);

		if (index > -1) {
			sessions[index].messageCount = messageCount;
			sessions[index].isFullCache = isFullCache;
			await AsyncStorage.setItem(STORAGE_KEYS.SESSION_LIST, JSON.stringify(sessions));
		}
	} catch (error) {
		console.error("[OfflineCache] Failed to update session cache metadata:", error);
	}
}

async function evictIfNeeded(newSize: number, config: CacheConfig): Promise<void> {
	await loadCacheStats();

	if (cacheStats.totalSize + newSize <= config.maxCacheSize) {
		return;
	}

	console.log("[OfflineCache] Evicting to make room for new data...");

	const toEvict = await getLeastRecentlyUsed(
		Math.ceil((cacheStats.totalSize + newSize - config.maxCacheSize) / (config.maxCacheSize / config.maxSessions)),
	);

	for (const sessionId of toEvict) {
		await clearCachedMessages(sessionId);

		if (cacheStats.totalSize + newSize <= config.maxCacheSize) {
			break;
		}
	}

	cacheStats.lastCleanup = Date.now();
	await saveCacheStats();
}

export async function cleanupExpiredCache(config: CacheConfig = DEFAULT_CACHE_CONFIG): Promise<void> {
	try {
		await ensureCacheDir();

		const files = await MESSAGE_CACHE_DIR.list();
		const now = Date.now();
		let cleanedCount = 0;

		for (const item of files) {
			if (!(item instanceof File) || !item.uri.endsWith(".json")) continue;

			try {
				const content = await item.text();
				const cached: CachedMessages = JSON.parse(content);

				if (now - cached.cachedAt > config.cacheTTL) {
					const fileSize = item.size;
					await item.delete();
					cleanedCount++;

					if (typeof fileSize === "number") {
						cacheStats.totalSize = Math.max(0, cacheStats.totalSize - fileSize);
					}
				}
			} catch {
				await item.delete();
				cleanedCount++;
			}
		}

		if (cleanedCount > 0) {
			console.log(`[OfflineCache] Cleaned up ${cleanedCount} expired cache files`);
			cacheStats.lastCleanup = now;
			cacheStats.sessionsWithMessages = Math.max(0, cacheStats.sessionsWithMessages - cleanedCount);
			await saveCacheStats();
		}
	} catch (error) {
		console.error("[OfflineCache] Failed to cleanup expired cache:", error);
	}
}

export interface ModelPreference {
	providerId: string;
	modelId: string;
}

export async function getModelFavorites(): Promise<ModelPreference[]> {
	try {
		const stored = await AsyncStorage.getItem(STORAGE_KEYS.MODEL_FAVORITES);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

export async function setModelFavorites(favorites: ModelPreference[]): Promise<void> {
	try {
		await AsyncStorage.setItem(STORAGE_KEYS.MODEL_FAVORITES, JSON.stringify(favorites));
	} catch (error) {
		console.error("[OfflineCache] Failed to save model favorites:", error);
	}
}

export async function toggleModelFavorite(model: ModelPreference): Promise<boolean> {
	const favorites = await getModelFavorites();
	const index = favorites.findIndex(
		(f) => f.providerId === model.providerId && f.modelId === model.modelId,
	);

	if (index > -1) {
		favorites.splice(index, 1);
	} else {
		favorites.unshift(model);
	}

	await setModelFavorites(favorites);
	return index === -1;
}

export async function isModelFavorite(model: ModelPreference): Promise<boolean> {
	const favorites = await getModelFavorites();
	return favorites.some(
		(f) => f.providerId === model.providerId && f.modelId === model.modelId,
	);
}

export async function getModelRecents(limit: number = 5): Promise<ModelPreference[]> {
	try {
		const stored = await AsyncStorage.getItem(STORAGE_KEYS.MODEL_RECENTS);
		const recents: ModelPreference[] = stored ? JSON.parse(stored) : [];
		return recents.slice(0, limit);
	} catch {
		return [];
	}
}

export async function addModelToRecents(model: ModelPreference, maxRecents: number = 10): Promise<void> {
	try {
		const recents = await getModelRecents(maxRecents);

		const filtered = recents.filter(
			(r) => !(r.providerId === model.providerId && r.modelId === model.modelId),
		);

		filtered.unshift(model);

		const limited = filtered.slice(0, maxRecents);

		await AsyncStorage.setItem(STORAGE_KEYS.MODEL_RECENTS, JSON.stringify(limited));
	} catch (error) {
		console.error("[OfflineCache] Failed to add model to recents:", error);
	}
}

export async function clearAllCache(): Promise<void> {
	try {
		await Promise.all([
			AsyncStorage.removeItem(STORAGE_KEYS.SESSION_LIST),
			AsyncStorage.removeItem(STORAGE_KEYS.SESSION_LIST_META),
			AsyncStorage.removeItem(STORAGE_KEYS.LRU_ORDER),
			AsyncStorage.removeItem(STORAGE_KEYS.CACHE_STATS),
		]);

		if (MESSAGE_CACHE_DIR.exists) {
			await MESSAGE_CACHE_DIR.delete();
		}

		lruOrder = [];
		lruLoaded = false;
		cacheStats = {
			totalSize: 0,
			sessionsWithMessages: 0,
			lastCleanup: Date.now(),
			hits: 0,
			misses: 0,
		};

		console.log("[OfflineCache] All cache cleared");
	} catch (error) {
		console.error("[OfflineCache] Failed to clear all cache:", error);
	}
}

export async function initializeCache(): Promise<void> {
	try {
		await ensureCacheDir();
		await loadLRUOrder();
		await loadCacheStats();

		await cleanupExpiredCache();

		console.log("[OfflineCache] Initialized", {
			totalSize: `${(cacheStats.totalSize / 1024 / 1024).toFixed(2)}MB`,
			sessionsWithMessages: cacheStats.sessionsWithMessages,
			lruCount: lruOrder.length,
		});
	} catch (error) {
		console.error("[OfflineCache] Failed to initialize:", error);
	}
}
