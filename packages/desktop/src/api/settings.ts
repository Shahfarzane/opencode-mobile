import type { SettingsAPI, SettingsLoadResult, SettingsPayload } from '@openchamber/ui/lib/api/types';

const sanitizePayload = (data: unknown): SettingsPayload => {
  if (!data || typeof data !== 'object') {
    return {};
  }
  return data as SettingsPayload;
};

export const createDesktopSettingsAPI = (): SettingsAPI => ({
  async load(): Promise<SettingsLoadResult> {
    try {
      const { safeInvoke } = await import('../lib/tauriCallbackManager');
      const result = await safeInvoke<{ settings: unknown; source: 'desktop' | 'web' }>('load_settings', {}, {
        timeout: 5000,
        onCancel: () => {
          console.warn('[SettingsAPI] Load settings operation timed out');
        }
      });
      return {
        settings: sanitizePayload(result.settings),
        source: result.source,
      };
    } catch (error) {
      throw new Error(`Failed to load settings: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  async save(changes: Partial<SettingsPayload>): Promise<SettingsPayload> {
    try {
      const { safeInvoke } = await import('../lib/tauriCallbackManager');
      const result = await safeInvoke<unknown>('save_settings', { changes }, {
        timeout: 5000,
        onCancel: () => {
          console.warn('[SettingsAPI] Save settings operation timed out');
        }
      });
      return sanitizePayload(result);
    } catch (error) {
      throw new Error(`Failed to save settings: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  async restartOpenCode(): Promise<{ restarted: boolean }> {
    try {
      const { safeInvoke } = await import('../lib/tauriCallbackManager');
      const result = await safeInvoke<{ restarted: boolean }>('restart_opencode', {}, {
        timeout: 10000,
        onCancel: () => {
          console.warn('[SettingsAPI] Restart OpenCode operation timed out');
        }
      });
      return { restarted: result.restarted };
    } catch (error) {
      throw new Error(`Failed to restart OpenCode: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
