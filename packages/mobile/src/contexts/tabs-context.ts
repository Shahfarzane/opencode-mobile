import { createContext, useContext } from "react";
import type { ContextUsage } from "../components/chat";
import type { Session } from "../api";

export interface ContextUsageContextType {
	contextUsage: ContextUsage | null;
	setContextUsage: (usage: ContextUsage | null) => void;
}

export const ContextUsageContext = createContext<ContextUsageContextType>({
	contextUsage: null,
	setContextUsage: () => {},
});

export const useContextUsageContext = () => useContext(ContextUsageContext);

// Session sheet context - provides access to session management from any tab
export interface SessionSheetContextType {
	sessions: Session[];
	currentSessionId: string | null;
	isLoadingSessions: boolean;
	isGitRepo: boolean;
	streamingSessionIds: Set<string>;
	openSessionSheet: () => void;
	selectSession: (session: Session) => void;
	createNewSession: (directory?: string | null) => void;
	renameSession: (sessionId: string, title: string) => Promise<void>;
	shareSession: (sessionId: string) => Promise<Session | null>;
	unshareSession: (sessionId: string) => Promise<boolean>;
	deleteSession: (sessionId: string) => Promise<boolean>;
	changeDirectory: () => void;
	openWorktreeManager: () => void;
	openMultiRunLauncher: () => void;
	// Internal methods for ChatScreen to sync state with layout
	_updateStreamingSessions?: (ids: Set<string>) => void;
	_setCurrentSessionId?: (id: string | null) => void;
	_refreshSessions?: () => Promise<void>;
}

export const SessionSheetContext = createContext<SessionSheetContextType>({
	sessions: [],
	currentSessionId: null,
	isLoadingSessions: false,
	isGitRepo: false,
	streamingSessionIds: new Set(),
	openSessionSheet: () => {},
	selectSession: () => {},
	createNewSession: () => {},
	renameSession: async () => {},
	shareSession: async () => null,
	unshareSession: async () => false,
	deleteSession: async () => false,
	changeDirectory: () => {},
	openWorktreeManager: () => {},
	openMultiRunLauncher: () => {},
});

export const useSessionSheetContext = () => useContext(SessionSheetContext);
