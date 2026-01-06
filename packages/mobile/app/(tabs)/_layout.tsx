import type BottomSheet from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { gitApi, type Session, sessionsApi } from "../../src/api";
import type { ContextUsage } from "../../src/components/chat";
import { Header } from "../../src/components/layout/Header";
import { SessionSheet } from "../../src/components/session";
import type { SessionCacheInfo } from "../../src/components/session/SessionListItem";
import { useEdgeSwipe } from "../../src/hooks/useEdgeSwipe";
import type { CachedSession } from "../../src/lib/offlineCache";
import {
	fetchSessionsWithCache,
	getSessionCacheInfo,
	initializeSessionSync,
} from "../../src/lib/sessionSync";
import { useConnectionStore } from "../../src/stores/useConnectionStore";
import { typography, useTheme } from "../../src/theme";
import ChatScreen from "./chat";
import { ContextUsageContext, SessionSheetContext } from "../../src/contexts/tabs-context";
import DiffScreen from "./diff";
import GitScreen from "./git";
import SettingsScreen from "./settings";
import TerminalScreen from "./terminal";

type MainTab = "chat" | "diff" | "terminal" | "git";

function PlaceholderScreen({ title }: { title: string }) {
	const { colors } = useTheme();

	return (
		<View style={[styles.placeholder, { backgroundColor: colors.background }]}>
			<Text style={[typography.uiHeader, { color: colors.foreground }]}>
				{title}
			</Text>
			<Text style={[typography.uiLabel, { color: colors.mutedForeground }]}>
				Coming soon
			</Text>
		</View>
	);
}

export default function TabsLayout() {
	const { colors } = useTheme();
	const { isConnected, directory } = useConnectionStore();
	const [activeTab, setActiveTab] = useState<MainTab>("chat");
	const [showSettings, setShowSettings] = useState(false);
	const [contextUsage, setContextUsage] = useState<ContextUsage | null>(null);
	const [diffFileCount, setDiffFileCount] = useState(0);

	// Session management state (shared across all tabs)
	const [sessions, setSessions] = useState<Session[]>([]);
	const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
	const [isLoadingSessions, setIsLoadingSessions] = useState(false);
	const [isGitRepo, setIsGitRepo] = useState(false);
	const [streamingSessionIds, setStreamingSessionIds] = useState<Set<string>>(new Set());
	const [sessionCacheInfo, setSessionCacheInfo] = useState<Map<string, SessionCacheInfo>>(new Map());

	const sheetRef = useRef<BottomSheet>(null);

	useEffect(() => {
		initializeSessionSync().catch(console.error);
	}, []);

	// Callbacks for chat screen to sync streaming state
	const updateStreamingSessionsRef = useRef<(ids: Set<string>) => void>((ids) => {
		setStreamingSessionIds(ids);
	});

	const setCurrentSessionIdRef = useRef<(id: string | null) => void>((id) => {
		setCurrentSessionId(id);
	});

	// Fetch git status to show file count indicator on git tab
	useEffect(() => {
		if (!isConnected || !directory) {
			setDiffFileCount(0);
			setIsGitRepo(false);
			return;
		}

		const fetchGitStatus = async () => {
			try {
				const status = await gitApi.getStatus();
				setDiffFileCount(status?.files?.length ?? 0);
				setIsGitRepo(Boolean(status?.current));
			} catch {
				setDiffFileCount(0);
				setIsGitRepo(false);
			}
		};

		fetchGitStatus();
		// Poll for changes every 10 seconds
		const interval = setInterval(fetchGitStatus, 10000);
		return () => clearInterval(interval);
	}, [isConnected, directory]);

	const fetchSessions = useCallback(async () => {
		setIsLoadingSessions(true);
		try {
			const { sessions: data, fromCache } = await fetchSessionsWithCache();
			setSessions(data);

			const cacheInfoMap = new Map<string, SessionCacheInfo>();
			for (const session of data) {
				const cachedSession = session as CachedSession;
				if (cachedSession.isFullCache !== undefined) {
					cacheInfoMap.set(session.id, getSessionCacheInfo(cachedSession));
				}
			}
			setSessionCacheInfo(cacheInfoMap);

			if (__DEV__ && fromCache) {
				console.log("[Layout] Sessions loaded from cache");
			}
		} catch (error) {
			console.error("Failed to fetch sessions:", error);
		} finally {
			setIsLoadingSessions(false);
		}
	}, []);

	// Load sessions on connect
	useEffect(() => {
		if (isConnected) {
			fetchSessions();
		}
	}, [isConnected, fetchSessions]);

	const openSessionSheet = useCallback(() => {
		fetchSessions();
		sheetRef.current?.expand();
	}, [fetchSessions]);

	// Edge swipe to open session sheet
	useEdgeSwipe({
		enabled: true,
		onSwipe: openSessionSheet,
	});

	const selectSession = useCallback((session: Session) => {
		setCurrentSessionIdRef.current(session.id);
		sheetRef.current?.close();
		// ChatScreen will handle loading messages via its own effect
	}, []);

	const createNewSession = useCallback((_newDirectory?: string | null) => {
		setCurrentSessionIdRef.current(null);
		sheetRef.current?.close();
	}, []);

	const renameSession = useCallback(async (targetSessionId: string, title: string) => {
		try {
			await sessionsApi.updateTitle(targetSessionId, title);
			setSessions((prev) =>
				prev.map((s) => (s.id === targetSessionId ? { ...s, title } : s)),
			);
		} catch (error) {
			console.error("Failed to rename session:", error);
		}
	}, []);

	const shareSession = useCallback(async (targetSessionId: string): Promise<Session | null> => {
		try {
			const updated = await sessionsApi.share(targetSessionId);
			setSessions((prev) =>
				prev.map((s) => (s.id === targetSessionId ? updated : s)),
			);
			return updated;
		} catch (error) {
			console.error("Failed to share session:", error);
			return null;
		}
	}, []);

	const unshareSession = useCallback(async (targetSessionId: string): Promise<boolean> => {
		try {
			const updated = await sessionsApi.unshare(targetSessionId);
			setSessions((prev) =>
				prev.map((s) => (s.id === targetSessionId ? updated : s)),
			);
			return true;
		} catch (error) {
			console.error("Failed to unshare session:", error);
			return false;
		}
	}, []);

	const deleteSession = useCallback(async (targetSessionId: string): Promise<boolean> => {
		try {
			await sessionsApi.delete(targetSessionId);
			setSessions((prev) => prev.filter((s) => s.id !== targetSessionId));

			// If we deleted the current session, clear it
			if (targetSessionId === currentSessionId) {
				setCurrentSessionIdRef.current(null);
			}
			return true;
		} catch (error) {
			console.error("Failed to delete session:", error);
			return false;
		}
	}, [currentSessionId]);

	const handleChangeDirectory = useCallback(() => {
		router.push("/onboarding/directory");
	}, []);

	const handleOpenWorktreeManager = useCallback(() => {
		console.log("Open worktree manager requested");
	}, []);

	const handleOpenMultiRunLauncher = useCallback(() => {
		console.log("Open multi-run launcher requested");
	}, []);

	const handleMenuPress = useCallback(() => {
		router.push("/onboarding/directory");
	}, []);

	const handleSettingsPress = useCallback(() => {
		setShowSettings(true);
	}, []);

	const handleTabChange = useCallback((tab: MainTab) => {
		setActiveTab(tab);
		setShowSettings(false);
	}, []);

	const contextUsageValue = useMemo(
		() => ({
			contextUsage,
			setContextUsage,
		}),
		[contextUsage],
	);

	const sessionSheetValue = useMemo(
		() => ({
			sessions,
			currentSessionId,
			isLoadingSessions,
			isGitRepo,
			streamingSessionIds,
			openSessionSheet,
			selectSession,
			createNewSession,
			renameSession,
			shareSession,
			unshareSession,
			deleteSession,
			changeDirectory: handleChangeDirectory,
			openWorktreeManager: handleOpenWorktreeManager,
			openMultiRunLauncher: handleOpenMultiRunLauncher,
			// Internal refs for ChatScreen to sync state
			_updateStreamingSessions: updateStreamingSessionsRef.current,
			_setCurrentSessionId: setCurrentSessionIdRef.current,
			_refreshSessions: fetchSessions,
		}),
		[
			sessions,
			currentSessionId,
			isLoadingSessions,
			isGitRepo,
			streamingSessionIds,
			openSessionSheet,
			selectSession,
			createNewSession,
			renameSession,
			shareSession,
			unshareSession,
			deleteSession,
			handleChangeDirectory,
			handleOpenWorktreeManager,
			handleOpenMultiRunLauncher,
			fetchSessions,
		],
	);

	const renderContent = () => {
		if (showSettings) {
			return <SettingsScreen />;
		}

		switch (activeTab) {
			case "chat":
				return <ChatScreen />;
			case "git":
				return <GitScreen />;
			case "diff":
				return <DiffScreen />;
			case "terminal":
				return <TerminalScreen />;
			default:
				return <ChatScreen />;
		}
	};

	return (
		<SessionSheetContext.Provider value={sessionSheetValue}>
			<ContextUsageContext.Provider value={contextUsageValue}>
				<View style={[styles.container, { backgroundColor: colors.background }]}>
					<Header
						activeTab={activeTab}
						onTabChange={handleTabChange}
						onMenuPress={handleMenuPress}
						onSettingsPress={handleSettingsPress}
						onSessionsPress={openSessionSheet}
						contextUsage={contextUsage}
						diffFileCount={diffFileCount}
					/>
					<View style={styles.content}>{renderContent()}</View>

					<SessionSheet
						ref={sheetRef}
						sessions={sessions}
						currentSessionId={currentSessionId}
						currentDirectory={directory}
						isLoading={isLoadingSessions}
						isGitRepo={isGitRepo}
						streamingSessionIds={streamingSessionIds}
						sessionCacheInfo={sessionCacheInfo}
						onSelectSession={selectSession}
						onNewSession={createNewSession}
						onRenameSession={renameSession}
						onShareSession={shareSession}
						onUnshareSession={unshareSession}
						onDeleteSession={deleteSession}
						onChangeDirectory={handleChangeDirectory}
						onOpenWorktreeManager={handleOpenWorktreeManager}
						onOpenMultiRunLauncher={handleOpenMultiRunLauncher}
					/>
				</View>
			</ContextUsageContext.Provider>
		</SessionSheetContext.Provider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
	placeholder: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
});
