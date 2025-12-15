import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollableOverlay } from '@/components/ui/ScrollableOverlay';
import { RiDownloadCloudLine, RiDownloadLine, RiExternalLinkLine, RiLoaderLine, RiRestartLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import type { UpdateInfo, UpdateProgress } from '@/lib/desktop';

interface UpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  info: UpdateInfo | null;
  downloading: boolean;
  downloaded: boolean;
  progress: UpdateProgress | null;
  error: string | null;
  onDownload: () => void;
  onRestart: () => void;
}

const GITHUB_RELEASES_URL = 'https://github.com/btriapitsyn/openchamber/releases';

export const UpdateDialog: React.FC<UpdateDialogProps> = ({
  open,
  onOpenChange,
  info,
  downloading,
  downloaded,
  progress,
  error,
  onDownload,
  onRestart,
}) => {
  const releaseUrl = info?.version
    ? `${GITHUB_RELEASES_URL}/tag/v${info.version}`
    : GITHUB_RELEASES_URL;

  const progressPercent = progress?.total
    ? Math.round((progress.downloaded / progress.total) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RiDownloadCloudLine className="h-5 w-5 text-primary" />
            Update Available
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {(info?.currentVersion || info?.version) && (
            <div className="flex items-center gap-2 text-sm">
              {info?.currentVersion && (
                <span className="font-mono">{info.currentVersion}</span>
              )}
              {info?.currentVersion && info?.version && (
                <span className="text-muted-foreground">→</span>
              )}
              {info?.version && (
                <span className="font-mono text-primary">{info.version}</span>
              )}
            </div>
          )}

          {info?.body && (
            <ScrollableOverlay
              className="max-h-48 rounded-md border border-border bg-muted/30 p-3"
              fillContainer={false}
            >
              <div className="text-sm text-muted-foreground whitespace-pre-wrap pr-3">
                {info.body
                  .split(/^## \[(\d+\.\d+\.\d+)\] - \d{4}-\d{2}-\d{2}\s*/gm)
                  .filter(Boolean)
                  .map((part, index) => {
                    if (/^\d+\.\d+\.\d+$/.test(part.trim())) {
                      return (
                        <span key={index} className="font-semibold text-foreground">
                          v{part.trim()}
                          {'\n'}
                        </span>
                      );
                    }
                    return part.replace(/^- /gm, '• ').trim() + '\n\n';
                  })}
              </div>
            </ScrollableOverlay>
          )}

          {downloading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Downloading...</span>
                <span className="font-mono">{progressPercent}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <a
              href={releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md',
                'text-sm text-muted-foreground',
                'hover:text-foreground hover:bg-accent',
                'transition-colors'
              )}
            >
              <RiExternalLinkLine className="h-4 w-4" />
              GitHub
            </a>

            {!downloaded && !downloading && (
              <button
                onClick={onDownload}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md',
                  'text-sm font-medium',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90',
                  'transition-colors'
                )}
              >
                <RiDownloadLine className="h-4 w-4" />
                Download Update
              </button>
            )}

            {downloading && (
              <button
                disabled
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md',
                  'text-sm font-medium',
                  'bg-primary/50 text-primary-foreground',
                  'cursor-not-allowed'
                )}
              >
                <RiLoaderLine className="h-4 w-4 animate-spin" />
                Downloading...
              </button>
            )}

            {downloaded && (
              <button
                onClick={onRestart}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md',
                  'text-sm font-medium',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90',
                  'transition-colors'
                )}
              >
                <RiRestartLine className="h-4 w-4" />
                Restart to Update
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
