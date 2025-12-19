import React from 'react';
import { RiDownloadLine, RiGithubFill, RiLoaderLine, RiTwitterXFill } from '@remixicon/react';
import { useUpdateStore } from '@/stores/useUpdateStore';
import { UpdateDialog } from '@/components/ui/UpdateDialog';
import { cn } from '@/lib/utils';

const GITHUB_URL = 'https://github.com/btriapitsyn/openchamber';

export const AboutSettings: React.FC = () => {
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false);
  const updateStore = useUpdateStore();

  const currentVersion = updateStore.info?.currentVersion || 'unknown';

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1">
        <h3 className="typography-ui-header font-semibold text-foreground">
          About OpenChamber
        </h3>
      </div>

      {/* Version and Update */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="typography-ui-label text-muted-foreground">Version</div>
            <div className="typography-ui-header font-mono">{currentVersion}</div>
          </div>

          {updateStore.checking && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RiLoaderLine className="h-4 w-4 animate-spin" />
              <span className="typography-meta">Checking...</span>
            </div>
          )}

          {!updateStore.checking && updateStore.available && (
            <button
              onClick={() => setUpdateDialogOpen(true)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md',
                'text-sm font-medium',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90',
                'transition-colors'
              )}
            >
              <RiDownloadLine className="h-4 w-4" />
              Update to {updateStore.info?.version}
            </button>
          )}

          {!updateStore.checking && !updateStore.available && !updateStore.error && (
            <span className="typography-meta text-muted-foreground">Up to date</span>
          )}
        </div>

        {updateStore.error && (
          <p className="typography-meta text-destructive">{updateStore.error}</p>
        )}

        <button
          onClick={() => updateStore.checkForUpdates()}
          disabled={updateStore.checking}
          className={cn(
            'typography-meta text-muted-foreground hover:text-foreground',
            'underline-offset-2 hover:underline',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          Check for updates
        </button>
      </div>

      {/* Links */}
      <div className="flex items-center gap-4">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex items-center gap-1.5 text-muted-foreground hover:text-foreground',
            'typography-meta transition-colors'
          )}
        >
          <RiGithubFill className="h-4 w-4" />
          <span>GitHub</span>
        </a>

        <a
          href="https://x.com/btriapitsyn"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex items-center gap-1.5 text-muted-foreground hover:text-foreground',
            'typography-meta transition-colors'
          )}
        >
          <RiTwitterXFill className="h-4 w-4" />
          <span>@btriapitsyn</span>
        </a>
      </div>

      {/* Update Dialog */}
      <UpdateDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        info={updateStore.info}
        downloading={updateStore.downloading}
        downloaded={updateStore.downloaded}
        progress={updateStore.progress}
        error={updateStore.error}
        onDownload={updateStore.downloadUpdate}
        onRestart={updateStore.restartToUpdate}
        runtimeType={updateStore.runtimeType}
      />
    </div>
  );
};
