import { apiPost } from "../lib/httpClient";

export interface FileListEntry {
	name: string;
	path: string;
	isDirectory: boolean;
	size?: number;
	modifiedTime?: number;
}

export interface DirectoryListResult {
	directory: string;
	entries: FileListEntry[];
}

export interface FileSearchResult {
	path: string;
	score?: number;
	preview?: string[];
}

const normalizePath = (path: string): string => path.replace(/\\/g, "/");

export const filesApi = {
	async listDirectory(path: string): Promise<DirectoryListResult> {
		return apiPost<DirectoryListResult>("/api/fs/list", {
			path: normalizePath(path),
		});
	},

	async search(
		directory: string,
		query: string,
		maxResults = 50,
	): Promise<FileSearchResult[]> {
		const results = await apiPost<FileSearchResult[]>("/api/fs/search", {
			directory: normalizePath(directory),
			query,
			maxResults,
		});

		return results.map((item) => ({
			...item,
			path: normalizePath(item.path),
		}));
	},

	async createDirectory(
		path: string,
	): Promise<{ success: boolean; path: string }> {
		const result = await apiPost<{ success: boolean; path: string }>(
			"/api/fs/mkdir",
			{ path: normalizePath(path) },
		);

		return {
			success: result.success,
			path: normalizePath(result.path),
		};
	},
};
