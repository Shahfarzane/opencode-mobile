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
    const [update, currentVersion] = await Promise.all([
      check(),
      getCurrentVersion(),
    ]);
    cachedUpdate = update;

    if (!update) {
      return {
        available: false,
        currentVersion,
      };
    }

    const changelogNotes = await fetchChangelogNotes(currentVersion, update.version);

    return {
      available: true,
      version: update.version,
      currentVersion,
      body: changelogNotes ?? update.body ?? undefined,
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

async function fetchChangelogNotes(fromVersion: string, toVersion: string): Promise<string | undefined> {
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/btriapitsyn/openchamber/main/CHANGELOG.md'
    );
    if (!response.ok) return undefined;

    const changelog = await response.text();
    const sections = changelog.split(/^## /m).slice(1);

    const fromNum = parseVersion(fromVersion);
    const toNum = parseVersion(toVersion);

    const relevantSections = sections.filter((section) => {
      const match = section.match(/^\[(\d+\.\d+\.\d+)\]/);
      if (!match) return false;
      const ver = parseVersion(match[1]);
      return ver > fromNum && ver <= toNum;
    });

    if (relevantSections.length === 0) return undefined;

    return relevantSections
      .map((s) => '## ' + s.trim())
      .join('\n\n');
  } catch {
    return undefined;
  }
}

function parseVersion(version: string): number {
  const parts = version.split('.').map(Number);
  return (parts[0] || 0) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
}
