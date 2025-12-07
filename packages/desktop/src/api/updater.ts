export interface UpdateInfo {
  available: boolean;
  version?: string;
  currentVersion: string;
  body?: string;
  date?: string;
}

export interface UpdateProgress {
  downloaded: number;
  total?: number;
}

interface Update {
  version: string;
  body?: string;
  date?: string;
  downloadAndInstall: (
    onEvent?: (event: DownloadEvent) => void
  ) => Promise<void>;
}

type DownloadEvent =
  | { event: 'Started'; data: { contentLength?: number } }
  | { event: 'Progress'; data: { chunkLength: number } }
  | { event: 'Finished' };

let cachedUpdate: Update | null = null;

export async function checkForUpdates(): Promise<UpdateInfo> {
  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();
    cachedUpdate = update;

    if (!update) {
      return {
        available: false,
        currentVersion: await getCurrentVersion(),
      };
    }

    return {
      available: true,
      version: update.version,
      currentVersion: await getCurrentVersion(),
      body: update.body ?? undefined,
      date: update.date ?? undefined,
    };
  } catch (error) {
    console.error('[updater] Failed to check for updates:', error);
    return {
      available: false,
      currentVersion: await getCurrentVersion(),
    };
  }
}

export async function downloadUpdate(
  onProgress?: (progress: UpdateProgress) => void
): Promise<void> {
  let update = cachedUpdate;
  if (!update) {
    const { check } = await import('@tauri-apps/plugin-updater');
    const checked = await check();
    if (!checked) {
      throw new Error('No update available');
    }
    update = checked;
    cachedUpdate = checked;
  }

  let downloaded = 0;
  let total: number | undefined;

  await update.downloadAndInstall((event: DownloadEvent) => {
    switch (event.event) {
      case 'Started':
        total = event.data.contentLength;
        onProgress?.({ downloaded: 0, total });
        break;
      case 'Progress':
        downloaded += event.data.chunkLength;
        onProgress?.({ downloaded, total });
        break;
      case 'Finished':
        onProgress?.({ downloaded: total ?? downloaded, total });
        break;
    }
  });
}

export async function restartToUpdate(): Promise<void> {
  const { relaunch } = await import('@tauri-apps/plugin-process');
  await relaunch();
}

async function getCurrentVersion(): Promise<string> {
  try {
    const { getVersion } = await import('@tauri-apps/api/app');
    return await getVersion();
  } catch {
    return 'unknown';
  }
}
