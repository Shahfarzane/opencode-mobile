import { createDesktopAPIs } from './api';
import { requestInitialNotificationPermission } from './api/notifications';
import { checkForUpdates, downloadUpdate, restartToUpdate, type UpdateInfo, type UpdateProgress } from './api/updater';
import { initializeDesktopBridge } from './lib/bridge';

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { RuntimeAPIs } from '@openchamber/ui/lib/api/types';
import type { DesktopApi, DesktopSettings } from '@openchamber/ui/lib/desktop';
import '@openchamber/ui/index.css';
import '@openchamber/ui/styles/fonts';

if (!(window as typeof globalThis & { process?: unknown }).process) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as typeof globalThis & { process?: any }).process = {
    env: {},
    platform: 'darwin',
    version: 'v20.0.0',
    versions: {},
    cwd: () => '/',
    nextTick: (fn: () => void) => Promise.resolve().then(() => fn()),
  };
}

declare global {
  interface Window {
    __OPENCHAMBER_RUNTIME_APIS__?: RuntimeAPIs;
    __OPENCHAMBER_HOME__?: string;
    opencodeDesktop?: DesktopApi;
  }
}

const cleanupFunctions: Array<() => void | Promise<void>> = [];

try {
  await initializeDesktopBridge();

  const activityUnlisten = await listen('openchamber:session-activity', (event) => {
    window.dispatchEvent(new CustomEvent('openchamber:session-activity', { detail: event.payload }));
  });
  cleanupFunctions.push(() => activityUnlisten());

  requestInitialNotificationPermission().catch(err => {
    console.error('[main] Failed to request notification permission:', err);
  });

  window.__OPENCHAMBER_RUNTIME_APIS__ = createDesktopAPIs();

  cleanupFunctions.push(() => {
    console.info('[main] Cleaning up runtime APIs');

    if (window.__OPENCHAMBER_RUNTIME_APIS__) {
      /* cleanup placeholder */
    }
  });

} catch (error) {
  console.error('[main] FATAL: Failed to initialize desktop runtime:', error);

  for (const cleanup of cleanupFunctions) {
    try {
      const result = cleanup();
      if (result instanceof Promise) {
        await result;
      }
    } catch (cleanupError) {
      console.warn('[main] Cleanup function failed during error handling:', cleanupError);
    }
  }

  document.body.innerHTML = `
    <div style="padding: 40px; font-family: monospace; color: #ff6b6b; background: #1a1a1a; height: 100vh;">
      <h1>Desktop Runtime Initialization Failed</h1>
      <pre style="background: #2a2a2a; padding: 20px; border-radius: 8px; overflow: auto;">
${error instanceof Error ? error.stack : String(error)}
      </pre>
      <p style="margin-top: 20px; color: #999;">Press Cmd+Option+I to open DevTools for more details</p>
    </div>
  `;
  throw error;
}

let homeDirectory: string | undefined;
try {
  const { homeDir } = await import('@tauri-apps/api/path');
  homeDirectory = await homeDir();
} catch {
  homeDirectory = undefined;
}

if (homeDirectory) {
  window.__OPENCHAMBER_HOME__ = homeDirectory;
}

window.opencodeDesktop = {
  homeDirectory,
  async getServerInfo() {
    const server = window.__OPENCHAMBER_DESKTOP_SERVER__;
    return {
      webPort: server?.origin ? parseInt(server.origin.split(':')[2] || '0', 10) : null,
      openCodePort: server?.opencodePort ?? null,
      host: '127.0.0.1',
      ready: true,
      cliAvailable: server?.cliAvailable ?? false,
    };
  },
  async getSettings(): Promise<DesktopSettings> {
    try {
      const result = await invoke<{ settings: DesktopSettings; source: string }>('load_settings');
      return result.settings;
    } catch (error) {
      console.error('[desktop] Error loading settings:', error);
      return {} as DesktopSettings;
    }
  },
  async updateSettings(changes: Partial<DesktopSettings>): Promise<DesktopSettings> {
    try {
      const result = await invoke<DesktopSettings>('save_settings', { changes });
      return result;
    } catch (error) {
      console.error('[desktop] Error updating settings:', error);
      return {};
    }
  },
  async restartOpenCode() {
    try {
      await invoke('restart_opencode');
      return { success: true };
    } catch (error) {
      console.error('[desktop] Error restarting OpenCode:', error);
      return { success: false };
    }
  },
  async shutdown() {
    return { success: false };
  },
  async getHomeDirectory() {
    return { success: true, path: homeDirectory || null };
  },
  markRendererReady() {

  },
  async requestDirectoryAccess() {
    try {

      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Working Directory'
      });

      if (!selected || typeof selected !== 'string') {
        return { success: false, error: 'Directory selection cancelled' };
      }

      const result = await invoke<{ success: boolean; path?: string; error?: string }>('process_directory_selection', {
        path: selected
      });

      return result;
    } catch (error) {
      console.error('[desktop] Error requesting directory access:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
  async startAccessingDirectory(directoryPath: string) {
    try {
      const result = await invoke<{ success: boolean; error?: string }>('start_accessing_directory', { path: directoryPath });
      return result;
    } catch (error) {
      console.error('[desktop] Error starting directory access:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  async stopAccessingDirectory(directoryPath: string) {
    try {
      const result = await invoke<{ success: boolean; error?: string }>('stop_accessing_directory', { path: directoryPath });
      return result;
    } catch (error) {
      console.error('[desktop] Error stopping directory access:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
  async notifyAssistantCompletion(payload) {
    try {
      const { createDesktopNotificationsAPI } = await import('./api/notifications');
      const result = await createDesktopNotificationsAPI().notifyAgentCompletion(payload);
      return { success: result };
    } catch (error) {
       console.error('[desktop] Error sending notification:', error);
       return { success: false };
    }
  },
  async checkForUpdates(): Promise<UpdateInfo> {
    return checkForUpdates();
  },
  async downloadUpdate(onProgress?: (progress: UpdateProgress) => void): Promise<void> {
    return downloadUpdate(onProgress);
  },
  async restartToUpdate(): Promise<void> {
    return restartToUpdate();
  }
};

console.info('[main] window.opencodeDesktop assigned');

if (typeof window !== 'undefined') {
  const handleBeforeUnload = () => {
    console.info('[main] App is unloading, performing cleanup...');

    cleanupFunctions.forEach((cleanup) => {
      try {
        const result = cleanup();
        if (result instanceof Promise) {

          result.catch(cleanupError => {
            console.warn('[main] Cleanup function failed during unload:', cleanupError);
          });
        }
      } catch (cleanupError) {
        console.warn('[main] Cleanup function failed during unload:', cleanupError);
      }
    });

    console.info('[main] Cleanup initiated');
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  window.addEventListener('pagehide', handleBeforeUnload);

  cleanupFunctions.push(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('pagehide', handleBeforeUnload);
  });
}

try {
  await import('@openchamber/ui/main');
} catch (error) {
  console.error('[main] FATAL: Failed to load UI module:', error);
  document.body.innerHTML = `
    <div style="padding: 40px; font-family: monospace; color: #ff6b6b; background: #1a1a1a; height: 100vh;">
      <h1>UI Module Load Failed</h1>
      <pre style="background: #2a2a2a; padding: 20px; border-radius: 8px; overflow: auto;">
${error instanceof Error ? error.stack : String(error)}
      </pre>
      <p style="margin-top: 20px; color: #999;">Check DevTools console for details</p>
    </div>
  `;
  throw error;
}
