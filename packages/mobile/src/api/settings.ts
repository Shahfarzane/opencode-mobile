import { apiGet, apiPost, apiPut } from "../lib/httpClient";

export interface SettingsPayload {
	themeId?: string;
	useSystemTheme?: boolean;
	themeVariant?: "light" | "dark";
	lightThemeId?: string;
	darkThemeId?: string;
	lastDirectory?: string;
	homeDirectory?: string;
	approvedDirectories?: string[];
	pinnedDirectories?: string[];
	showReasoningTraces?: boolean;
	autoDeleteEnabled?: boolean;
	autoDeleteAfterDays?: number;
	queueModeEnabled?: boolean;
	[key: string]: unknown;
}

export interface SettingsLoadResult {
	settings: SettingsPayload;
	source: "web" | "desktop";
}

const sanitizePayload = (data: unknown): SettingsPayload => {
	if (!data || typeof data !== "object") {
		return {};
	}
	return data as SettingsPayload;
};

export const settingsApi = {
	async load(): Promise<SettingsLoadResult> {
		const data = await apiGet<SettingsPayload>("/api/config/settings");
		return {
			settings: sanitizePayload(data),
			source: "web",
		};
	},

	async save(changes: Partial<SettingsPayload>): Promise<SettingsPayload> {
		const data = await apiPut<SettingsPayload>("/api/config/settings", changes);
		return sanitizePayload(data);
	},

	async restartOpenCode(): Promise<{ restarted: boolean }> {
		await apiPost("/api/config/reload", {});
		return { restarted: true };
	},
};
