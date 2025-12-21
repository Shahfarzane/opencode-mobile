import React from 'react';
import { toast } from 'sonner';
import { useSessionStore } from '@/stores/useSessionStore';
import { useUIStore } from '@/stores/useUIStore';
import { useDirectoryStore } from '@/stores/useDirectoryStore';
import { useThemeSystem } from '@/contexts/useThemeSystem';
import { getRegisteredRuntimeAPIs } from '@/contexts/runtimeAPIRegistry';
import { sessionEvents } from '@/lib/sessionEvents';
import { isDesktopRuntime } from '@/lib/desktop';

const MENU_ACTION_EVENT = 'openchamber:menu-action';

type MenuAction =
  | 'about'
  | 'settings'
  | 'command-palette'
  | 'new-session'
  | 'worktree-creator'
  | 'change-workspace'
  | 'open-git-tab'
  | 'open-diff-tab'
  | 'open-terminal-tab'
  | 'theme-light'
  | 'theme-dark'
  | 'theme-system'
  | 'toggle-sidebar'
  | 'toggle-memory-debug'
  | 'help-dialog'
  | 'download-logs';

export const useMenuActions = (
  onToggleMemoryDebug?: () => void
) => {
  const { openNewSessionDraft } = useSessionStore();
  const {
    toggleCommandPalette,
    toggleHelpDialog,
    toggleSidebar,
    setSessionSwitcherOpen,
    setSessionCreateDialogOpen,
    setActiveMainTab,
    setSettingsDialogOpen,
    setAboutDialogOpen,
  } = useUIStore();
  const { setDirectory } = useDirectoryStore();
  const { setThemeMode } = useThemeSystem();
  const isDownloadingLogsRef = React.useRef(false);

  const handleChangeWorkspace = React.useCallback(() => {
    if (isDesktopRuntime() && window.opencodeDesktop?.requestDirectoryAccess) {
      window.opencodeDesktop
        .requestDirectoryAccess('')
        .then((result) => {
          if (result.success && result.path) {
            setDirectory(result.path, { showOverlay: true });
          } else if (result.error && result.error !== 'Directory selection cancelled') {
            toast.error('Failed to select directory', {
              description: result.error,
            });
          }
        })
        .catch((error) => {
          console.error('Desktop: Error selecting directory:', error);
          toast.error('Failed to select directory');
        });
    } else {
      sessionEvents.requestDirectoryDialog();
    }
  }, [setDirectory]);

  React.useEffect(() => {
    const handleMenuAction = (event: Event) => {
      const action = (event as CustomEvent<MenuAction>).detail;

      switch (action) {
        case 'about':
          setAboutDialogOpen(true);
          break;

        case 'settings':
          setSettingsDialogOpen(true);
          break;

        case 'command-palette':
          toggleCommandPalette();
          break;

        case 'new-session':
          setActiveMainTab('chat');
          setSessionSwitcherOpen(false);
          openNewSessionDraft();
          break;

        case 'worktree-creator':
          setSessionCreateDialogOpen(true);
          break;

        case 'change-workspace':
          handleChangeWorkspace();
          break;

        case 'open-git-tab': {
          const { activeMainTab } = useUIStore.getState();
          setActiveMainTab(activeMainTab === 'git' ? 'chat' : 'git');
          break;
        }

        case 'open-diff-tab': {
          const { activeMainTab } = useUIStore.getState();
          setActiveMainTab(activeMainTab === 'diff' ? 'chat' : 'diff');
          break;
        }

        case 'open-terminal-tab': {
          const { activeMainTab } = useUIStore.getState();
          setActiveMainTab(activeMainTab === 'terminal' ? 'chat' : 'terminal');
          break;
        }

        case 'theme-light':
          setThemeMode('light');
          break;

        case 'theme-dark':
          setThemeMode('dark');
          break;

        case 'theme-system':
          setThemeMode('system');
          break;

        case 'toggle-sidebar':
          toggleSidebar();
          break;

        case 'toggle-memory-debug':
          onToggleMemoryDebug?.();
          break;

        case 'help-dialog':
          toggleHelpDialog();
          break;

        case 'download-logs': {
          const runtimeAPIs = getRegisteredRuntimeAPIs();
          const diagnostics = runtimeAPIs?.diagnostics;
          if (!diagnostics || isDownloadingLogsRef.current) {
            break;
          }

          isDownloadingLogsRef.current = true;
          diagnostics
            .downloadLogs()
            .then(({ fileName, content }) => {
              const finalFileName = fileName || 'openchamber.log';
              const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement('a');
              anchor.href = url;
              anchor.download = finalFileName;
              document.body.appendChild(anchor);
              anchor.click();
              document.body.removeChild(anchor);
              URL.revokeObjectURL(url);
              toast.success('Logs saved', {
                description: `Downloaded to ~/Downloads/${finalFileName}`,
              });
            })
            .catch(() => {
              toast.error('Failed to download logs');
            })
            .finally(() => {
              isDownloadingLogsRef.current = false;
            });
          break;
        }
      }
    };

    window.addEventListener(MENU_ACTION_EVENT, handleMenuAction);
    return () => window.removeEventListener(MENU_ACTION_EVENT, handleMenuAction);
  }, [
    openNewSessionDraft,
    toggleCommandPalette,
    toggleHelpDialog,
    toggleSidebar,
    setSessionSwitcherOpen,
    setSessionCreateDialogOpen,
    setActiveMainTab,
    setSettingsDialogOpen,
    setAboutDialogOpen,
    setThemeMode,
    onToggleMemoryDebug,
    handleChangeWorkspace,
  ]);
};
