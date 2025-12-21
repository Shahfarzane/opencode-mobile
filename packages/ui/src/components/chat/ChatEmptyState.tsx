import React from 'react';

import { OpenChamberLogo } from '@/components/ui/OpenChamberLogo';
import { TextLoop } from '@/components/ui/TextLoop';
import { useOptionalThemeSystem } from '@/contexts/useThemeSystem';

const phrases = [
    "Fix the failing tests",
    "Refactor this to be more readable",
    "Add form validation",
    "Optimize this function",
    "Write tests for this",
    "Explain how this works",
    "Add a new feature",
    "Help me debug this",
    "Review my code",
    "Simplify this logic",
    "Add error handling",
    "Create a new component",
    "Update the documentation",
    "Find the bug here",
    "Improve performance",
    "Add type definitions",
];

const ChatEmptyState: React.FC = () => {
    const themeContext = useOptionalThemeSystem();

    let isDark = true;
    if (themeContext) {
        isDark = themeContext.currentTheme.metadata.variant !== 'light';
    } else if (typeof window !== 'undefined') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // Same colors as face fill in OpenChamberLogo, but higher opacity for text readability
    const textColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

    return (
        <div className="flex flex-col items-center justify-center min-h-full w-full gap-6">
            <OpenChamberLogo width={140} height={140} className="opacity-20" isAnimated />
            <TextLoop
                className="text-body-md"
                interval={4}
                transition={{ duration: 0.5 }}
            >
                {phrases.map((phrase) => (
                    <span key={phrase} style={{ color: textColor }}>"{phrase}…"</span>
                ))}
            </TextLoop>
        </div>
    );
};

export default React.memo(ChatEmptyState);
