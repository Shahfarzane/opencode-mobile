
import type { DiagnosticsAPI } from '@openchamber/ui/lib/api/types';

type LogResponse = {
  fileName?: string;
  content?: string;
};

const normalizePayload = (payload: LogResponse): { fileName: string; content: string } => ({
  fileName: typeof payload.fileName === 'string' && payload.fileName.trim().length > 0 ? payload.fileName : 'desktop.log',
  content: typeof payload.content === 'string' ? payload.content : '',
});

export const createDesktopDiagnosticsAPI = (): DiagnosticsAPI => ({
  async downloadLogs() {
    try {
      const { safeInvoke } = await import('../lib/tauriCallbackManager');
      const result = await safeInvoke<LogResponse>('fetch_desktop_logs', {}, {
        timeout: 10000,
        onCancel: () => {
          console.warn('[DiagnosticsAPI] Fetch desktop logs operation timed out');
        }
      });
      return normalizePayload(result ?? {});
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to download desktop logs');
    }
  },
});
