import React from 'react';
import { cn } from '@/lib/utils';
import { SIDEBAR_SECTIONS } from '@/constants/sidebar';
import type { SidebarSection } from '@/constants/sidebar';
import { RiArrowLeftSLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { AgentsSidebar } from '@/components/sections/agents/AgentsSidebar';
import { AgentsPage } from '@/components/sections/agents/AgentsPage';
import { CommandsSidebar } from '@/components/sections/commands/CommandsSidebar';
import { CommandsPage } from '@/components/sections/commands/CommandsPage';
import { ProvidersSidebar } from '@/components/sections/providers/ProvidersSidebar';
import { ProvidersPage } from '@/components/sections/providers/ProvidersPage';
import { GitIdentitiesSidebar } from '@/components/sections/git-identities/GitIdentitiesSidebar';
import { GitIdentitiesPage } from '@/components/sections/git-identities/GitIdentitiesPage';
import { OpenChamberPage } from '@/components/sections/openchamber/OpenChamberPage';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { MobileOverlayPanel } from '@/components/ui/MobileOverlayPanel';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SETTINGS_SECTIONS = (() => {
  const filtered = SIDEBAR_SECTIONS.filter(section => section.id !== 'sessions');
  const settingsSection = filtered.find(s => s.id === 'settings');
  const otherSections = filtered.filter(s => s.id !== 'settings');
  return settingsSection ? [settingsSection, ...otherSections] : filtered;
})();

/**
 * Mobile-only settings dialog using MobileOverlayPanel.
 * Desktop uses SettingsView rendered inline in MainLayout.
 */
export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = React.useState<SidebarSection>('settings');
  const [showPageContent, setShowPageContent] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab('settings');
      setShowPageContent(false);
    }
  }, [isOpen]);

  const handleTabChange = React.useCallback((tab: SidebarSection) => {
    setActiveTab(tab);
    setShowPageContent(false);
  }, []);

  const handleItemSelect = React.useCallback(() => {
    setShowPageContent(true);
  }, []);

  const renderSidebarContent = () => {
    if (activeTab === 'settings') {
      return null;
    }

    const content = (() => {
      switch (activeTab) {
        case 'agents':
          return <AgentsSidebar />;
        case 'commands':
          return <CommandsSidebar />;
        case 'providers':
          return <ProvidersSidebar />;
        case 'git-identities':
          return <GitIdentitiesSidebar />;
        default:
          return null;
      }
    })();

    return <div onClick={handleItemSelect}>{content}</div>;
  };

  const renderPageContent = () => {
    switch (activeTab) {
      case 'agents':
        return <AgentsPage />;
      case 'commands':
        return <CommandsPage />;
      case 'providers':
        return <ProvidersPage />;
      case 'git-identities':
        return <GitIdentitiesPage />;
      case 'settings':
        return <OpenChamberPage />;
      default:
        return null;
    }
  };

  const mainContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border/40 bg-background/95 px-3 py-1.5">
        {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          const PhosphorIcon = Icon as React.ComponentType<{ className?: string; weight?: string }>;
          return (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={cn(
                'flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-pressed={isActive}
              aria-label={label}
            >
              <PhosphorIcon className="h-5 w-5" weight="regular" />
            </button>
          );
        })}
      </div>

      {/* Content area - mobile drill-down pattern */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab !== 'settings' && !showPageContent && (
          <div className="w-full overflow-hidden bg-sidebar">
            <ErrorBoundary>{renderSidebarContent()}</ErrorBoundary>
          </div>
        )}

        {(activeTab === 'settings' || showPageContent) && (
          <div className="w-full flex-1 overflow-hidden bg-background">
            <ErrorBoundary>{renderPageContent()}</ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <MobileOverlayPanel
      open={isOpen}
      onClose={onClose}
      title="Settings"
      className="max-w-full"
      contentMaxHeightClassName="h-[min(80dvh,720px)]"
      renderHeader={(closeButton) => (
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
          <div className="relative flex flex-1 items-center justify-center">
            {showPageContent && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPageContent(false)}
                className="absolute left-0 h-6 w-6 flex-shrink-0"
              >
                <RiArrowLeftSLine className="h-5 w-5" />
                <span className="sr-only">Back to sidebar</span>
              </Button>
            )}
            <span className="typography-ui-header">Settings</span>
          </div>
          {closeButton}
        </div>
      )}
    >
      {mainContent}
    </MobileOverlayPanel>
  );
};
