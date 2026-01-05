import { apiDelete, apiGet, apiPost } from "../lib/httpClient";

export interface Agent {
	name: string;
	description?: string;
	mode?: "primary" | "subagent" | "all";
	model?: {
		providerID?: string;
		modelID?: string;
	};
	builtIn?: boolean;
	native?: boolean;
	hidden?: boolean;
	temperature?: number;
	topP?: number;
	prompt?: string;
	tools?: Record<string, boolean>;
	permission?: Record<string, unknown>;
}

export interface AgentConfig {
	name: string;
	description?: string;
	model?: string | null;
	temperature?: number;
	top_p?: number;
	prompt?: string;
	mode?: "primary" | "subagent" | "all";
	tools?: Record<string, boolean>;
	permission?: Record<string, unknown>;
	scope?: "user" | "project";
}

type AgentsResponse = Agent[] | { data?: Agent[] };

function unwrapAgents(response: unknown): Agent[] {
	if (Array.isArray(response)) {
		return response;
	}
	if (response && typeof response === "object") {
		const obj = response as Record<string, unknown>;
		if (Array.isArray(obj.data)) {
			return obj.data as Agent[];
		}
	}
	return [];
}

export const isAgentBuiltIn = (agent: Agent): boolean =>
	agent.builtIn === true || agent.native === true;

export const isAgentHidden = (agent: Agent): boolean => agent.hidden === true;

export const agentsApi = {
	async list(): Promise<Agent[]> {
		const response = await apiGet<AgentsResponse>("/api/agent", {}, true);
		return unwrapAgents(response);
	},

	async create(config: AgentConfig): Promise<boolean> {
		try {
			await apiPost("/api/agent", config, true);
			return true;
		} catch {
			return false;
		}
	},

	async update(name: string, config: AgentConfig): Promise<boolean> {
		try {
			await apiPost(`/api/agent/${encodeURIComponent(name)}`, config, true);
			return true;
		} catch {
			return false;
		}
	},

	async delete(name: string): Promise<boolean> {
		try {
			await apiDelete(`/api/agent/${encodeURIComponent(name)}`, {}, true);
			return true;
		} catch {
			return false;
		}
	},
};
