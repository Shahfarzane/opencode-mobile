import React from 'react';
import { Header, FixedSessionsButton } from './Header';
import { Sidebar } from './Sidebar';
import { SettingsDialog } from './SettingsDialog';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { CommandPalette } from '../ui/CommandPalette';
import { HelpDialog } from '../ui/HelpDialog';
import { SessionSidebar } from '@/components/session/SessionSidebar';
import { SessionDialogs } from '@/components/session/SessionDialogs';
import { MobileOverlayPanel } from '@/components/ui/MobileOverlayPanel';

import { useUIStore } from '@/stores/useUIStore';
import { useDeviceInfo } from '@/lib/device';
import { useEdgeSwipe } from '@/hooks/useEdgeSwipe';
import { cn } from '@/lib/utils';

import { ChatView, GitView, DiffView, TerminalView } from '@/components/views';

export const MainLayout: React.FC = () => {
    const {
        isSidebarOpen,
        activeMainTab,
        setIsMobile,
        isSessionSwitcherOpen,
        setSessionSwitcherOpen,
        isSettingsDialogOpen,
        setSettingsDialogOpen,
    } = useUIStore();
    const { isMobile } = useDeviceInfo();
    const [isDesktopRuntime, setIsDesktopRuntime] = React.useState<boolean>(() => {
        if (typeof window === 'undefined') {
            return false;
        }
        return typeof window.opencodeDesktop !== 'undefined';
    });

    React.useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        setIsDesktopRuntime(typeof window.opencodeDesktop !== 'undefined');
    }, []);

    useEdgeSwipe({ enabled: true });

    React.useEffect(() => {
        const previous = useUIStore.getState().isMobile;
        if (previous !== isMobile) {
            setIsMobile(isMobile);
        }
    }, [isMobile, setIsMobile]);

    React.useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        let timeoutId: number | undefined;

        const handleResize = () => {

            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }

            timeoutId = window.setTimeout(() => {
                useUIStore.getState().updateProportionalSidebarWidths();
            }, 150);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, []);

    const secondaryView = React.useMemo(() => {
        switch (activeMainTab) {
            case 'git':
                return <GitView />;
            case 'diff':
                return <DiffView />;
            case 'terminal':
                return <TerminalView />;
            default:
                return null;
        }
    }, [activeMainTab]);

    const isChatActive = activeMainTab === 'chat';

    return (
        <div
            className={cn(
                'main-content-safe-area h-[100dvh]',
                isMobile ? 'flex flex-col' : 'flex',
                isDesktopRuntime ? 'bg-transparent' : 'bg-background'
            )}
        >
            <CommandPalette />
            <HelpDialog />
            <SessionDialogs />
            <SettingsDialog isOpen={isSettingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} />

            {isMobile ? (
                <>
                    <Header />
                    <div className="flex flex-1 overflow-hidden bg-background">
                        <main className="flex-1 overflow-hidden bg-background relative">
                            <div className={cn('absolute inset-0', !isChatActive && 'invisible')}>
                                <ErrorBoundary><ChatView /></ErrorBoundary>
                            </div>
                            {secondaryView && (
                                <div className="absolute inset-0">
                                    <ErrorBoundary>{secondaryView}</ErrorBoundary>
                                </div>
                            )}
                        </main>
                    </div>

                    <MobileOverlayPanel
                        open={isSessionSwitcherOpen}
                        onClose={() => setSessionSwitcherOpen(false)}
                        title="Sessions"
                    >
                        <SessionSidebar mobileVariant />
                    </MobileOverlayPanel>
                </>
            ) : (
                <>
                    <Sidebar isOpen={isSidebarOpen} isMobile={isMobile}>
                        <SessionSidebar />
                    </Sidebar>

                    <div className="flex flex-1 flex-col overflow-hidden">
                        <Header />

                        <div className="flex flex-1 overflow-hidden bg-background">
                            <main className="flex-1 overflow-hidden bg-background relative">
                                <div className={cn('absolute inset-0', !isChatActive && 'invisible')}>
                                    <ErrorBoundary><ChatView /></ErrorBoundary>
                                </div>
                                {secondaryView && (
                                    <div className="absolute inset-0">
                                        <ErrorBoundary>{secondaryView}</ErrorBoundary>
                                    </div>
                                )}
                            </main>
                        </div>
                    </div>
                </>
            )}

            <FixedSessionsButton />
        </div>
    );
};
