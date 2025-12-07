import React from 'react';
import { useThemeSystem } from '@/contexts/useThemeSystem';
import type { ThemeMode } from '@/types/theme';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';
import { ButtonSmall } from '@/components/ui/button-small';

interface Option<T extends string> {
    id: T;
    label: string;
    description?: string;
}

const THEME_MODE_OPTIONS: Array<{ value: ThemeMode; label: string }> = [
    {
        value: 'system',
        label: 'System',
    },
    {
        value: 'light',
        label: 'Light',
    },
    {
        value: 'dark',
        label: 'Dark',
    },
];

const DIFF_LAYOUT_OPTIONS: Option<'dynamic' | 'inline' | 'side-by-side'>[] = [
    {
        id: 'dynamic',
        label: 'Dynamic',
        description: 'New files inline, modified files side-by-side. Responsive inline fallback only in Dynamic mode.',
    },
    {
        id: 'inline',
        label: 'Always inline',
        description: 'Show all file diffs as a single unified view.',
    },
    {
        id: 'side-by-side',
        label: 'Always side-by-side',
        description: 'Compare original and modified files next to each other.',
    },
];

export const AppearanceSettings: React.FC = () => {
    const showReasoningTraces = useUIStore(state => state.showReasoningTraces);
    const setShowReasoningTraces = useUIStore(state => state.setShowReasoningTraces);
    const diffLayoutPreference = useUIStore(state => state.diffLayoutPreference);
    const setDiffLayoutPreference = useUIStore(state => state.setDiffLayoutPreference);
    const {
        themeMode,
        setThemeMode,
    } = useThemeSystem();

    return (
        <div className="w-full space-y-8">
            {}
            <div className="space-y-4">
                <div className="space-y-1">
                    <h3 className="typography-ui-header font-semibold text-foreground">
                        Theme Mode
                    </h3>
                </div>

                {}
                <div className="flex gap-1 w-fit">
                    {THEME_MODE_OPTIONS.map((option) => (
                        <ButtonSmall
                            key={option.value}
                            variant={themeMode === option.value ? 'default' : 'outline'}
                            className={cn(themeMode === option.value ? undefined : 'text-foreground')}
                            onClick={() => setThemeMode(option.value)}
                        >
                            {option.label}
                        </ButtonSmall>
                    ))}
                </div>
            </div>

            {}
            <div className="space-y-4">
                <div className="space-y-1">
                    <h3 className="typography-ui-header font-semibold text-foreground">
                        Diff layout (Diff tab)
                    </h3>
                    <p className="typography-meta text-muted-foreground/80">
                        Choose the default layout for file diffs. You can still override layout per file from the Diff tab.
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex gap-1 w-fit">
                        {DIFF_LAYOUT_OPTIONS.map((option) => (
                            <ButtonSmall
                                key={option.id}
                                variant={diffLayoutPreference === option.id ? 'default' : 'outline'}
                                className={cn(diffLayoutPreference === option.id ? undefined : 'text-foreground')}
                                onClick={() => setDiffLayoutPreference(option.id)}
                            >
                                {option.label}
                            </ButtonSmall>
                        ))}
                    </div>
                    <p className="typography-meta text-muted-foreground/80 max-w-xl">
                        {DIFF_LAYOUT_OPTIONS.find((option) => option.id === diffLayoutPreference)?.description}
                    </p>
                </div>
            </div>

            {}
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-primary"
                    checked={showReasoningTraces}
                    onChange={(event) => setShowReasoningTraces(event.target.checked)}
                />
                <span className="typography-ui-header font-semibold text-foreground">
                    Show thinking / reasoning traces
                </span>
            </label>
        </div>
    );
};
