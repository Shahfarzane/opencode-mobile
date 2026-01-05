export interface DirectoryPermissionRequest {
	path: string;
}

export interface DirectoryPermissionResult {
	success: boolean;
	path?: string;
	error?: string;
}

export interface StartAccessingResult {
	success: boolean;
	error?: string;
}

export interface PermissionsAPI {
	requestDirectoryAccess(
		request: DirectoryPermissionRequest,
	): Promise<DirectoryPermissionResult>;
	startAccessingDirectory(path: string): Promise<StartAccessingResult>;
	stopAccessingDirectory(path: string): Promise<StartAccessingResult>;
}

export const permissionsApi: PermissionsAPI = {
	async requestDirectoryAccess(
		request: DirectoryPermissionRequest,
	): Promise<DirectoryPermissionResult> {
		return { success: true, path: request.path };
	},

	async startAccessingDirectory(): Promise<StartAccessingResult> {
		return { success: true };
	},

	async stopAccessingDirectory(): Promise<StartAccessingResult> {
		return { success: true };
	},
};
