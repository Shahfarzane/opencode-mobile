import { apiGet, apiPost } from "../lib/httpClient";

export interface FileListEntry {
	name: string;
	path: string;
	isDirectory: boolean;
	size?: number;
	modifiedTime?: number;
}

export interface DirectoryListResult {
	path: string;
	entries: FileListEntry[];
}

export interface FileSearchResult {
	path: string;
	score?: number;
	preview?: string[];
}

interface FileSearchResponse {
	root: string;
	count: number;
	files: Array<{
		name: string;
		path: string;
		relativePath: string;
		extension?: string;
	}>;
}

const normalizePath = (path: string): string => path.replace(/\\/g, "/");

export const filesApi = {
	async listDirectory(dirPath: string): Promise<DirectoryListResult> {
		const response = await apiGet<DirectoryListResult | { error?: string }>(
			"/api/fs/list",
			{ path: normalizePath(dirPath) },
		);

		if (response && "error" in response) {
			throw new Error(response.error || "Failed to list directory");
		}

		if (!response || !("entries" in response)) {
			return { path: dirPath, entries: [] };
		}

		return response as DirectoryListResult;
	},

	async search(
		directory: string,
		query: string,
		maxResults = 50,
	): Promise<FileSearchResult[]> {
		const response = await apiGet<FileSearchResponse>("/api/fs/search", {
			root: normalizePath(directory),
			q: query,
			limit: maxResults,
		});

		if (!response?.files) {
			return [];
		}

		return response.files.map((item) => ({
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
