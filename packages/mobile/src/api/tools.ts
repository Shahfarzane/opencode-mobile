import { apiGet } from "../lib/httpClient";

export interface ToolsAPI {
	getAvailableTools(): Promise<string[]>;
}

export const toolsApi: ToolsAPI = {
	async getAvailableTools(): Promise<string[]> {
		const data = await apiGet<unknown>("/api/experimental/tool/ids");

		if (!Array.isArray(data)) {
			throw new Error("Tools API returned invalid data format");
		}

		return data
			.filter((tool: unknown): tool is string => typeof tool === "string" && tool !== "invalid")
			.sort();
	},
};
