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
