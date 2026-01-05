import { create } from "zustand";

const MAX_OUTPUT_LENGTH = 256_000;
const MAX_LINES = 5000;

interface TerminalState {
	sessionId: string | null;
	isConnecting: boolean;
	isConnected: boolean;
	output: string;
	error: string | null;
	exitCode: number | null;
	hasExited: boolean;
}

interface TerminalActions {
	setSessionId: (sessionId: string | null) => void;
	setConnecting: (isConnecting: boolean) => void;
	setConnected: (isConnected: boolean) => void;
	appendOutput: (data: string) => void;
	clearOutput: () => void;
	setError: (error: string | null) => void;
	setExited: (exitCode: number) => void;
	reset: () => void;
}

type TerminalStore = TerminalState & TerminalActions;

const initialState: TerminalState = {
	sessionId: null,
	isConnecting: false,
	isConnected: false,
	output: "",
	error: null,
	exitCode: null,
	hasExited: false,
};

function trimOutput(output: string): string {
	if (output.length <= MAX_OUTPUT_LENGTH) {
		return output;
	}

	const firstNewline = output.indexOf("\n", output.length - MAX_OUTPUT_LENGTH);
	if (firstNewline !== -1) {
		return output.slice(firstNewline + 1);
	}

	return output.slice(-MAX_OUTPUT_LENGTH);
}

function trimLines(output: string): string {
	const lines = output.split("\n");
	if (lines.length <= MAX_LINES) {
		return output;
	}
	return lines.slice(-MAX_LINES).join("\n");
}

export const useTerminalStore = create<TerminalStore>((set) => ({
	...initialState,

	setSessionId: (sessionId) => set({ sessionId }),

	setConnecting: (isConnecting) => set({ isConnecting }),

	setConnected: (isConnected) => set({ isConnected, isConnecting: false }),

	appendOutput: (data) =>
		set((state) => {
			if (!data) return state;

			let newOutput = state.output + data;
			newOutput = trimOutput(newOutput);
			newOutput = trimLines(newOutput);

			return { output: newOutput };
		}),

	clearOutput: () => set({ output: "" }),

	setError: (error) => set({ error }),

	setExited: (exitCode) =>
		set({
			hasExited: true,
			exitCode,
			isConnected: false,
			isConnecting: false,
		}),

	reset: () => set(initialState),
}));
