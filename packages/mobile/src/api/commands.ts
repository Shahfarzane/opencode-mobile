import { apiDelete, apiGet, apiPost } from "../lib/httpClient";

export interface Command {
	name: string;
	description?: string;
	template?: string;
	agent?: string;
	subtask?: boolean;
	builtIn?: boolean;
	native?: boolean;
	hidden?: boolean;
}

export interface CommandConfig {
	name: string;
	description?: string;
	template?: string;
	agent?: string;
	subtask?: boolean;
	scope?: "user" | "project";
}

type CommandsResponse = Command[] | { data?: Command[] };

function unwrapCommands(response: unknown): Command[] {
	if (Array.isArray(response)) {
		return response;
	}
	if (response && typeof response === "object") {
		const obj = response as Record<string, unknown>;
		if (Array.isArray(obj.data)) {
			return obj.data as Command[];
		}
	}
	return [];
}

export const isCommandBuiltIn = (command: Command): boolean =>
	command.builtIn === true || command.native === true;

export const commandsApi = {
	async list(): Promise<Command[]> {
		const response = await apiGet<CommandsResponse>("/api/command", {}, true);
		return unwrapCommands(response);
	},

	async create(config: CommandConfig): Promise<boolean> {
		try {
			await apiPost("/api/command", config, true);
			return true;
		} catch {
			return false;
		}
	},

	async update(name: string, config: CommandConfig): Promise<boolean> {
		try {
			await apiPost(`/api/command/${encodeURIComponent(name)}`, config, true);
			return true;
		} catch {
			return false;
		}
	},

	async delete(name: string): Promise<boolean> {
		try {
			await apiDelete(`/api/command/${encodeURIComponent(name)}`, {}, true);
			return true;
		} catch {
			return false;
		}
	},
};
