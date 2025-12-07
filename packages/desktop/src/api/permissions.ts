import type { DirectoryPermissionRequest, DirectoryPermissionResult, PermissionsAPI, StartAccessingResult } from '@openchamber/ui/lib/api/types';

export const createDesktopPermissionsAPI = (): PermissionsAPI => ({
  async requestDirectoryAccess(request: DirectoryPermissionRequest): Promise<DirectoryPermissionResult> {
    try {
      const { safeInvoke } = await import('../lib/tauriCallbackManager');
      const result = await safeInvoke<DirectoryPermissionResult>('request_directory_access', { request }, {
        timeout: 30000,
        onCancel: () => {
          console.warn('[PermissionsAPI] Request directory access operation timed out');
        }
      });
      return result;
    } catch (error) {
      console.error('[desktop] Error requesting directory access:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
  async startAccessingDirectory(path: string): Promise<StartAccessingResult> {
    try {
      const { safeInvoke } = await import('../lib/tauriCallbackManager');
      const result = await safeInvoke<StartAccessingResult>('start_accessing_directory', { path }, {
        timeout: 10000,
        onCancel: () => {
          console.warn('[PermissionsAPI] Start accessing directory operation timed out');
        }
      });
      return result;
    } catch (error) {
      console.error('[desktop] Error starting directory access:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
  async stopAccessingDirectory(path: string): Promise<StartAccessingResult> {
    try {
      const { safeInvoke } = await import('../lib/tauriCallbackManager');
      const result = await safeInvoke<StartAccessingResult>('stop_accessing_directory', { path }, {
        timeout: 5000,
        onCancel: () => {
          console.warn('[PermissionsAPI] Stop accessing directory operation timed out');
        }
      });
      return result;
    } catch (error) {
      console.error('[desktop] Error stopping directory access:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
});
