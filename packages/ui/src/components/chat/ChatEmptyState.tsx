import React from 'react';

import { OpenChamberLogo } from '@/components/ui/OpenChamberLogo';

const ChatEmptyState: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-full w-full">
            <OpenChamberLogo width={140} height={140} className="opacity-20" isAnimated />
        </div>
    );
};

export default React.memo(ChatEmptyState);
