import React from 'react';
import { AppearanceSettings } from './AppearanceSettings';
import { AboutSettings } from './AboutSettings';
import { SessionRetentionSettings } from './SessionRetentionSettings';
import { ScrollableOverlay } from '@/components/ui/ScrollableOverlay';
import { useDeviceInfo } from '@/lib/device';
import { isWebRuntime } from '@/lib/desktop';

export const SettingsPage: React.FC = () => {
    const { isMobile } = useDeviceInfo();
    const showAbout = isMobile && isWebRuntime();

    return (
        <ScrollableOverlay
            outerClassName="h-full"
            className="settings-page-body mx-auto max-w-3xl space-y-3 p-3 sm:space-y-6 sm:p-6"
        >
            <AppearanceSettings />
            <div className="border-t border-border/40 pt-6">
                <SessionRetentionSettings />
            </div>
            {showAbout && (
                <div className="border-t border-border/40 pt-6">
                    <AboutSettings />
                </div>
            )}
        </ScrollableOverlay>
    );
};
