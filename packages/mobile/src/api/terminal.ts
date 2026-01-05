import { apiDelete, apiPost, apiRequest } from "../lib/httpClient";

const API_BASE = "/api/terminal";

export interface TerminalSession {
	sessionId: string;
	cols: number;
	rows: number;
}

export interface TerminalStreamEvent {
	type: "connected" | "data" | "exit" | "reconnecting";
	data?: string;
	exitCode?: number;
	signal?: number | null;
	attempt?: number;
	maxAttempts?: number;
}

export interface CreateTerminalOptions {
	cwd: string;
	cols?: number;
	rows?: number;
}

export const terminalApi = {
	async createSession(
		options: CreateTerminalOptions,
	): Promise<TerminalSession> {
		return apiPost<TerminalSession>(`${API_BASE}/create`, {
			cwd: options.cwd,
			cols: options.cols ?? 80,
			rows: options.rows ?? 24,
		});
	},

	async sendInput(sessionId: string, data: string): Promise<void> {
		await apiRequest<void>(`${API_BASE}/${sessionId}/input`, {
			method: "POST",
			rawBody: data,
			contentType: "text/plain",
		});
	},

	async resize(sessionId: string, cols: number, rows: number): Promise<void> {
		await apiPost<void>(`${API_BASE}/${sessionId}/resize`, { cols, rows });
	},

	async closeSession(sessionId: string): Promise<void> {
		await apiDelete<void>(`${API_BASE}/${sessionId}`);
	},

	async restartSession(
		currentSessionId: string,
		options: CreateTerminalOptions,
	): Promise<TerminalSession> {
		return apiPost<TerminalSession>(`${API_BASE}/${currentSessionId}/restart`, {
			cwd: options.cwd,
			cols: options.cols ?? 80,
			rows: options.rows ?? 24,
		});
	},

	async forceKill(options: {
		sessionId?: string;
		cwd?: string;
	}): Promise<void> {
		await apiPost<void>(`${API_BASE}/force-kill`, options);
	},
};
