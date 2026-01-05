import { createContext, useContext } from "react";
import type { ContextUsage } from "../../src/components/chat";

export interface ContextUsageContextType {
	contextUsage: ContextUsage | null;
	setContextUsage: (usage: ContextUsage | null) => void;
}

export const ContextUsageContext = createContext<ContextUsageContextType>({
	contextUsage: null,
	setContextUsage: () => {},
});

export const useContextUsageContext = () => useContext(ContextUsageContext);

// Session sheet context
export interface SessionSheetContextType {
	openSessionSheet: () => void;
	setOpenSessionSheet: (fn: () => void) => void;
}

export const SessionSheetContext = createContext<SessionSheetContextType>({
	openSessionSheet: () => {},
	setOpenSessionSheet: () => {},
});

export const useSessionSheetContext = () => useContext(SessionSheetContext);
