import { apiGet } from "../lib/httpClient";

export interface ServerPathInfo {
	directory?: string;
	worktree?: string;
	state?: string;
}

export interface ProjectInfo {
	id?: string;
	worktree?: string;
	path?: string;
}

export const serverApi = {
	/**
	 * Get the server's current working directory path.
	 * This returns the directory where OpenCode is running.
	 */
	async getPath(): Promise<ServerPathInfo> {
		return apiGet<ServerPathInfo>("/api/path");
	},

	/**
	 * Get the current project info from the server.
	 */
	async getProject(): Promise<ProjectInfo> {
		return apiGet<ProjectInfo>("/api/project/current");
	},

	/**
	 * Get the server's working directory.
	 * Tries multiple endpoints and returns the first valid directory found.
	 */
	async getServerDirectory(): Promise<string | null> {
		try {
			// First try /api/path endpoint
			const pathInfo = await serverApi.getPath();
			if (pathInfo?.directory) {
				return pathInfo.directory;
			}
			if (pathInfo?.worktree) {
				return pathInfo.worktree;
			}
		} catch (error) {
			console.log("[Server] Failed to get path info:", error);
		}

		try {
			// Fall back to project endpoint
			const projectInfo = await serverApi.getProject();
			if (projectInfo?.worktree) {
				return projectInfo.worktree;
			}
			if (projectInfo?.path) {
				return projectInfo.path;
			}
		} catch (error) {
			console.log("[Server] Failed to get project info:", error);
		}

		return null;
	},
};
