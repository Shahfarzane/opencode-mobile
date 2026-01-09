import { apiDelete, apiGet, apiPost } from "../lib/httpClient";

export interface Skill {
	name: string;
	description?: string;
	template?: string;
	builtIn?: boolean;
	native?: boolean;
	hidden?: boolean;
	scope?: "user" | "project";
}

export interface SkillConfig {
	name: string;
	description?: string;
	template?: string;
	scope?: "user" | "project";
}

type SkillsResponse = Skill[] | { data?: Skill[] };

function unwrapSkills(response: unknown): Skill[] {
	if (Array.isArray(response)) {
		return response;
	}
	if (response && typeof response === "object") {
		const obj = response as Record<string, unknown>;
		if (Array.isArray(obj.data)) {
			return obj.data as Skill[];
		}
	}
	return [];
}

export const isSkillBuiltIn = (skill: Skill): boolean =>
	skill.builtIn === true || skill.native === true;

export const isSkillHidden = (skill: Skill): boolean => skill.hidden === true;

export const skillsApi = {
	async list(): Promise<Skill[]> {
		const response = await apiGet<SkillsResponse>("/api/skill", {}, true);
		return unwrapSkills(response);
	},

	async create(config: SkillConfig): Promise<boolean> {
		try {
			await apiPost("/api/skill", config, true);
			return true;
		} catch {
			return false;
		}
	},

	async update(name: string, config: SkillConfig): Promise<boolean> {
		try {
			await apiPost(`/api/skill/${encodeURIComponent(name)}`, config, true);
			return true;
		} catch {
			return false;
		}
	},

	async delete(name: string): Promise<boolean> {
		try {
			await apiDelete(`/api/skill/${encodeURIComponent(name)}`, {}, true);
			return true;
		} catch {
			return false;
		}
	},
};
