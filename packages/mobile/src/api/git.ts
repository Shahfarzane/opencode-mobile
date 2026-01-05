import { apiDelete, apiGet, apiPost, apiPut } from "../lib/httpClient";

const API_BASE = "/api/git";

export interface GitStatusFile {
	path: string;
	index: string;
	working_dir: string;
}

export interface GitStatus {
	current: string;
	tracking: string | null;
	ahead: number;
	behind: number;
	files: GitStatusFile[];
	isClean: boolean;
	diffStats?: Record<string, { insertions: number; deletions: number }>;
}

export interface GitBranchDetails {
	current: boolean;
	name: string;
	commit: string;
	label: string;
	tracking?: string;
	ahead?: number;
	behind?: number;
}

export interface GitBranch {
	all: string[];
	current: string;
	branches: Record<string, GitBranchDetails>;
}

export interface GitCommitResult {
	success: boolean;
	commit: string;
	branch: string;
	summary: {
		changes: number;
		insertions: number;
		deletions: number;
	};
}

export interface GitPushResult {
	success: boolean;
	pushed: Array<{ local: string; remote: string }>;
	repo: string;
}

export interface GitPullResult {
	success: boolean;
	summary: {
		changes: number;
		insertions: number;
		deletions: number;
	};
	files: string[];
}

export interface GitIdentityProfile {
	id: string;
	name: string;
	userName: string;
	userEmail: string;
	sshKey?: string | null;
	color?: string | null;
	icon?: string | null;
}

export interface GitIdentitySummary {
	userName: string | null;
	userEmail: string | null;
	sshCommand: string | null;
}

export interface GeneratedCommitMessage {
	subject: string;
	highlights: string[];
}

export const gitApi = {
	async checkIsGitRepository(): Promise<boolean> {
		const data = await apiGet<{ isGitRepository: boolean }>(
			`${API_BASE}/check`,
			{},
			true,
		);
		return data.isGitRepository;
	},

	async getStatus(): Promise<GitStatus> {
		return apiGet<GitStatus>(`${API_BASE}/status`, {}, true);
	},

	async getBranches(): Promise<GitBranch> {
		return apiGet<GitBranch>(`${API_BASE}/branches`, {}, true);
	},

	async checkout(
		branch: string,
	): Promise<{ success: boolean; branch: string }> {
		return apiPost<{ success: boolean; branch: string }>(
			`${API_BASE}/checkout`,
			{ branch },
			true,
		);
	},

	async createBranch(
		name: string,
		startPoint?: string,
	): Promise<{ success: boolean; branch: string }> {
		return apiPost<{ success: boolean; branch: string }>(
			`${API_BASE}/branches`,
			{ name, startPoint },
			true,
		);
	},

	async deleteBranch(
		branch: string,
		force = false,
	): Promise<{ success: boolean }> {
		return apiDelete<{ success: boolean }>(
			`${API_BASE}/branches`,
			{ branch, force },
			true,
		);
	},

	async generateCommitMessage(
		files: string[],
	): Promise<{ message: GeneratedCommitMessage }> {
		return apiPost<{ message: GeneratedCommitMessage }>(
			`${API_BASE}/commit-message`,
			{ files },
			true,
		);
	},

	async commit(
		message: string,
		options?: { addAll?: boolean; files?: string[] },
	): Promise<GitCommitResult> {
		return apiPost<GitCommitResult>(
			`${API_BASE}/commit`,
			{
				message,
				addAll: options?.addAll ?? false,
				files: options?.files,
			},
			true,
		);
	},

	async push(options?: {
		remote?: string;
		branch?: string;
	}): Promise<GitPushResult> {
		return apiPost<GitPushResult>(`${API_BASE}/push`, options ?? {}, true);
	},

	async pull(options?: {
		remote?: string;
		branch?: string;
	}): Promise<GitPullResult> {
		return apiPost<GitPullResult>(`${API_BASE}/pull`, options ?? {}, true);
	},

	async fetch(options?: {
		remote?: string;
		branch?: string;
	}): Promise<{ success: boolean }> {
		return apiPost<{ success: boolean }>(
			`${API_BASE}/fetch`,
			options ?? {},
			true,
		);
	},

	async getIdentities(): Promise<GitIdentityProfile[]> {
		return apiGet<GitIdentityProfile[]>(`${API_BASE}/identities`);
	},

	async getCurrentIdentity(): Promise<GitIdentitySummary | null> {
		const data = await apiGet<GitIdentitySummary | null>(
			`${API_BASE}/current-identity`,
			{},
			true,
		);
		return data;
	},

	async setIdentity(
		profileId: string,
	): Promise<{ success: boolean; profile: GitIdentityProfile }> {
		return apiPost<{ success: boolean; profile: GitIdentityProfile }>(
			`${API_BASE}/set-identity`,
			{ profileId },
			true,
		);
	},

	async createIdentity(
		profile: GitIdentityProfile,
	): Promise<GitIdentityProfile> {
		return apiPost<GitIdentityProfile>(`${API_BASE}/identities`, profile);
	},

	async updateIdentity(
		id: string,
		updates: GitIdentityProfile,
	): Promise<GitIdentityProfile> {
		return apiPut<GitIdentityProfile>(`${API_BASE}/identities/${id}`, updates);
	},

	async deleteIdentity(id: string): Promise<void> {
		await apiDelete(`${API_BASE}/identities/${id}`);
	},

	async stageFile(path: string): Promise<{ success: boolean }> {
		return apiPost<{ success: boolean }>(`${API_BASE}/stage`, { path }, true);
	},

	async unstageFile(path: string): Promise<{ success: boolean }> {
		return apiPost<{ success: boolean }>(`${API_BASE}/unstage`, { path }, true);
	},

	async revertFile(path: string): Promise<void> {
		await apiPost(`${API_BASE}/revert`, { path }, true);
	},

	async getDiff(path: string, staged = false): Promise<{ diff: string }> {
		return apiGet<{ diff: string }>(
			`${API_BASE}/diff`,
			{ path, staged: staged ? "true" : undefined },
			true,
		);
	},
};
