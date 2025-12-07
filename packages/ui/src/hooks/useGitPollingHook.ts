import React from 'react';
import { useGitStore } from '@/stores/useGitStore';
import { useDirectoryStore } from '@/stores/useDirectoryStore';
import { useRuntimeAPIs } from '@/hooks/useRuntimeAPIs';

/**
 * Background git polling hook - monitors git status regardless of which tab is open.
 * Must be used inside RuntimeAPIProvider.
 */
export function useGitPolling() {
    const { git } = useRuntimeAPIs();
    const currentDirectory = useDirectoryStore((state) => state.currentDirectory);
    const { setActiveDirectory, startPolling, stopPolling, fetchAll } = useGitStore();

    React.useEffect(() => {
        if (!currentDirectory || !git) {
            stopPolling();
            return;
        }

        setActiveDirectory(currentDirectory);

        fetchAll(currentDirectory, git);

        startPolling(git);

        return () => {
            stopPolling();
        };
    }, [currentDirectory, git, setActiveDirectory, startPolling, stopPolling, fetchAll]);
}
