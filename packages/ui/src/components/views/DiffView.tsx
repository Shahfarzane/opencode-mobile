import React from 'react';
import { RiGitCommitLine, RiLoader4Line } from '@remixicon/react';

import { useSessionStore } from '@/stores/useSessionStore';
import { useDirectoryStore } from '@/stores/useDirectoryStore';
import { useUIStore } from '@/stores/useUIStore';
import { useGitStore, useGitStatus, useIsGitRepo, useGitFileCount } from '@/stores/useGitStore';
import type { GitStatus } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RiArrowDownSLine } from '@remixicon/react';
import { toast } from 'sonner';
import { getLanguageFromExtension } from '@/lib/toolHelpers';
import { useRuntimeAPIs } from '@/hooks/useRuntimeAPIs';
import { DiffViewToggle } from '@/components/chat/message/DiffViewToggle';
import type { DiffViewMode } from '@/components/chat/message/types';

const LazyMonacoDiffViewer = React.lazy(() =>
    import('./MonacoDiffViewer').then((mod) => ({ default: mod.MonacoDiffViewer }))
);

type FileEntry = GitStatus['files'][number] & {
    insertions: number;
    deletions: number;
    isNew: boolean;
};

const isNewStatusFile = (file: GitStatus['files'][number]): boolean => {
    const { index, working_dir: workingDir } = file;

    return index === 'A' || workingDir === 'A' || index === '?' || workingDir === '?';
};

const formatDiffTotals = (insertions?: number, deletions?: number) => {
    const added = insertions ?? 0;
    const removed = deletions ?? 0;
    if (!added && !removed) return null;
    return (
        <span className="typography-meta flex flex-shrink-0 items-center gap-1 text-xs whitespace-nowrap">
            {added ? (
                <span style={{ color: 'var(--status-success)' }}>+{added}</span>
            ) : null}
            {removed ? (
                <span style={{ color: 'var(--status-error)' }}>-{removed}</span>
            ) : null}
        </span>
    );
};

interface FileSelectorProps {
    changedFiles: FileEntry[];
    selectedFile: string | null;
    selectedFileEntry: FileEntry | null;
    onSelectFile: (path: string) => void;
}

const FileSelector = React.memo<FileSelectorProps>(({
    changedFiles,
    selectedFile,
    selectedFileEntry,
    onSelectFile,
}) => {
    if (changedFiles.length === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex h-8 items-center gap-2 rounded-lg border border-input bg-transparent px-2 typography-ui-label text-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring">
                    {selectedFileEntry ? (
                        <div className="flex items-center gap-3">
                            <span className="truncate typography-meta">
                                {selectedFileEntry.path}
                            </span>
                            {formatDiffTotals(selectedFileEntry.insertions, selectedFileEntry.deletions)}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">Select file</span>
                    )}
                    <RiArrowDownSLine className="size-4 opacity-50" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[70vh] min-w-[320px] overflow-y-auto">
                <DropdownMenuRadioGroup value={selectedFile ?? ''} onValueChange={onSelectFile}>
                    {changedFiles.map((file) => (
                        <DropdownMenuRadioItem key={file.path} value={file.path}>
                            <div className="flex w-full items-center justify-between gap-3">
                                <span className="truncate typography-meta">
                                    {file.path}
                                </span>
                                {formatDiffTotals(file.insertions, file.deletions)}
                            </div>
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

interface DiffContentProps {
    fileDiff: { original: string; modified: string } | null;
    activeFilePath: string;
    isDiffLoading: boolean;
    diffError: string | null;
    onRetry: () => void;
    renderSideBySide: boolean;
    allowResponsive: boolean;
}

const DiffContent = React.memo<DiffContentProps>(({
    fileDiff,
    activeFilePath,
    isDiffLoading,
    diffError,
    onRetry,
    renderSideBySide,
    allowResponsive,
}) => {
    const language = React.useMemo(
        () => (activeFilePath ? getLanguageFromExtension(activeFilePath) || 'text' : 'text'),
        [activeFilePath]
    );

    if (isDiffLoading) {
        return (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                <RiLoader4Line size={16} className="animate-spin" />
                Loading diff…
            </div>
        );
    }

    if (diffError) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-destructive">{diffError}</p>
                <Button size="sm" onClick={onRetry}>
                    Retry
                </Button>
            </div>
        );
    }

    if (!fileDiff || (!fileDiff.original && !fileDiff.modified)) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No changes detected for this file
            </div>
        );
    }

    return (
        <div className="flex h-full w-full">
            <React.Suspense
                fallback={(
                    <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                        <RiLoader4Line size={16} className="animate-spin" />
                        Loading diff viewer…
                    </div>
                )}
            >
                <LazyMonacoDiffViewer
                    original={fileDiff.original}
                    modified={fileDiff.modified}
                    language={language}
                    renderSideBySide={renderSideBySide}
                    allowResponsive={allowResponsive}
                />
            </React.Suspense>
        </div>
    );
});

const useEffectiveDirectory = () => {
    const { currentSessionId, sessions, worktreeMetadata: worktreeMap } = useSessionStore();
    const { currentDirectory: fallbackDirectory } = useDirectoryStore();

    const worktreeMetadata = currentSessionId ? worktreeMap.get(currentSessionId) ?? undefined : undefined;
    const currentSession = sessions.find((session) => session.id === currentSessionId);
    const sessionDirectory = (currentSession as Record<string, unknown>)?.directory as string | undefined;

    return worktreeMetadata?.path ?? sessionDirectory ?? fallbackDirectory ?? undefined;
};

export const DiffView: React.FC = () => {
    const { git } = useRuntimeAPIs();
    const effectiveDirectory = useEffectiveDirectory();

    const isGitRepo = useIsGitRepo(effectiveDirectory ?? null);
    const status = useGitStatus(effectiveDirectory ?? null);
    const isLoadingStatus = useGitStore((state) => state.isLoadingStatus);
    const { setActiveDirectory, fetchStatus, setDiff } = useGitStore();

    const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
    const selectedFileRef = React.useRef<string | null>(null);

    const [isDiffLoading, setIsDiffLoading] = React.useState(false);
    const [diffError, setDiffError] = React.useState<string | null>(null);
    const [fileDiff, setFileDiff] = React.useState<{ original: string; modified: string } | null>(null);

    const pendingDiffFile = useUIStore((state) => state.pendingDiffFile);
    const setPendingDiffFile = useUIStore((state) => state.setPendingDiffFile);
    const diffLayoutPreference = useUIStore((state) => state.diffLayoutPreference);
    const diffFileLayout = useUIStore((state) => state.diffFileLayout);
    const setDiffFileLayout = useUIStore((state) => state.setDiffFileLayout);
    const lastStatusChange = useGitStore(React.useCallback((state) => {
        if (!effectiveDirectory) return 0;
        return state.directories.get(effectiveDirectory)?.lastStatusChange ?? 0;
    }, [effectiveDirectory]));

    const getCachedDiffIfFresh = React.useCallback((directory: string | undefined, filePath: string) => {
        if (!directory) return null;
        const dirState = useGitStore.getState().directories.get(directory);
        if (!dirState) return null;
        const cached = dirState.diffCache.get(filePath);
        if (!cached) return null;

        if (cached.fetchedAt < (dirState.lastStatusChange || 0)) {
            return null;
        }
        return cached;
    }, []);

    const handleSelectFile = React.useCallback((value: string) => {
        selectedFileRef.current = value;
        setSelectedFile(value);
        setDiffError(null);

        const cached = getCachedDiffIfFresh(effectiveDirectory, value);
        if (cached) {
            setFileDiff({ original: cached.original, modified: cached.modified });
            setIsDiffLoading(false);
        } else {
            setFileDiff(null);
            setIsDiffLoading(true);
        }
    }, [effectiveDirectory, getCachedDiffIfFresh]);

    React.useEffect(() => {
        if (effectiveDirectory) {
            setActiveDirectory(effectiveDirectory);

            const dirState = useGitStore.getState().directories.get(effectiveDirectory);
            if (!dirState?.status) {
                fetchStatus(effectiveDirectory, git);
            }
        }
    }, [effectiveDirectory, setActiveDirectory, fetchStatus, git]);

    React.useEffect(() => {
        if (!pendingDiffFile) return;

        handleSelectFile(pendingDiffFile);

        setPendingDiffFile(null);
    }, [pendingDiffFile, handleSelectFile, setPendingDiffFile]);

    React.useEffect(() => {
        selectedFileRef.current = selectedFile;
    }, [selectedFile]);

    const changedFiles: FileEntry[] = React.useMemo(() => {
        if (!status?.files) return [];
        const diffStats = status.diffStats ?? {};

        return status.files
            .map((file) => ({
                ...file,
                insertions: diffStats[file.path]?.insertions ?? 0,
                deletions: diffStats[file.path]?.deletions ?? 0,
                isNew: isNewStatusFile(file),
            }))
            .sort((a, b) => a.path.localeCompare(b.path));
    }, [status]);

    const selectedFileEntry = React.useMemo(() => {
        if (!selectedFile) return null;
        return changedFiles.find((file) => file.path === selectedFile) ?? null;
    }, [changedFiles, selectedFile]);

    const currentLayoutForSelectedFile = React.useMemo<'inline' | 'side-by-side' | null>(() => {
        if (!selectedFileEntry) return null;

        const override = diffFileLayout[selectedFileEntry.path];
        if (override) return override;

        if (diffLayoutPreference === 'inline' || diffLayoutPreference === 'side-by-side') {
            return diffLayoutPreference;
        }

        return selectedFileEntry.isNew ? 'inline' : 'side-by-side';
    }, [selectedFileEntry, diffFileLayout, diffLayoutPreference]);

    React.useEffect(() => {
        if (!selectedFile && !pendingDiffFile && changedFiles.length > 0) {
            const nextPath = changedFiles[0].path;
            handleSelectFile(nextPath);
        }
    }, [changedFiles, selectedFile, pendingDiffFile, handleSelectFile]);

    React.useEffect(() => {
        if (selectedFile && changedFiles.length > 0) {
            const stillExists = changedFiles.some((f) => f.path === selectedFile);
            if (!stillExists) {
                setSelectedFile(null);
                selectedFileRef.current = null;
                setFileDiff(null);
                setDiffError(null);
            }
        }
    }, [changedFiles, selectedFile]);

    const loadDiff = React.useCallback(async () => {
        if (!effectiveDirectory || !selectedFileEntry) {
            setFileDiff(null);
            setDiffError(null);
            setIsDiffLoading(false);
            return;
        }

        const cacheKey = selectedFileEntry.path;

        const cached = getCachedDiffIfFresh(effectiveDirectory, cacheKey);
        if (cached) {
            setFileDiff({ original: cached.original, modified: cached.modified });
            setDiffError(null);
            setIsDiffLoading(false);
            return;
        }

        setIsDiffLoading(true);
        setDiffError(null);

        try {
            const response = await git.getGitFileDiff(effectiveDirectory, {
                path: selectedFileEntry.path,
            });

            const diff = {
                original: response.original ?? '',
                modified: response.modified ?? '',
            };
            setDiff(effectiveDirectory, cacheKey, diff);
            setFileDiff(diff);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load diff';
            setDiffError(message);
            toast.error(message);
        } finally {
            setIsDiffLoading(false);
        }
    }, [effectiveDirectory, git, selectedFileEntry, getCachedDiffIfFresh, setDiff, lastStatusChange]);

    React.useEffect(() => {
        loadDiff();
    }, [loadDiff]);

    const activeFilePath = selectedFileEntry?.path ?? '';

    const renderContent = () => {
        if (!effectiveDirectory) {
            return (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                    Select a session directory to view diffs
                </div>
            );
        }

        if (isLoadingStatus && !status) {
            return (
                <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <RiLoader4Line size={16} className="animate-spin" />
                    Loading repository status…
                </div>
            );
        }

        if (isGitRepo === false) {
            return (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                    Not a git repository. Use the Git tab to initialize or change directories.
                </div>
            );
        }

        if (changedFiles.length === 0) {
            return (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                    Working tree clean — no changes to display
                </div>
            );
        }

        if (!selectedFileEntry) {
            return (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                    Select a file to inspect its diff
                </div>
            );
        }

        const effectiveLayout = currentLayoutForSelectedFile ?? 'side-by-side';
        const renderSideBySide = effectiveLayout === 'side-by-side';
        const hasFileOverride = !!diffFileLayout[selectedFileEntry.path];
        const allowResponsive =
            diffLayoutPreference === 'dynamic' && !hasFileOverride;

        return (
            <div className="flex flex-1 min-h-0 px-3 py-3">
                <DiffContent
                    fileDiff={fileDiff}
                    activeFilePath={activeFilePath}
                    isDiffLoading={isDiffLoading}
                    diffError={diffError}
                    onRetry={loadDiff}
                    renderSideBySide={renderSideBySide}
                    allowResponsive={allowResponsive}
                />
            </div>
        );
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            <div className="flex items-center gap-3 px-3 py-2 bg-background">
                <div className="flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground shrink-0">
                    <RiGitCommitLine size={16} />
                    <span className="typography-ui-label font-semibold text-foreground">
                        {isLoadingStatus && !status
                            ? 'Loading changes…'
                            : `${changedFiles.length} ${changedFiles.length === 1 ? 'file' : 'files'} changed`}
                    </span>
                </div>
                <FileSelector
                    changedFiles={changedFiles}
                    selectedFile={selectedFile}
                    selectedFileEntry={selectedFileEntry}
                    onSelectFile={handleSelectFile}
                />
                <div className="flex-1" />
                {selectedFileEntry && currentLayoutForSelectedFile && (
                    <DiffViewToggle
                        mode={currentLayoutForSelectedFile === 'side-by-side' ? 'side-by-side' : 'unified'}
                        onModeChange={(mode: DiffViewMode) => {
                            if (!selectedFileEntry) return;
                            const nextLayout: 'inline' | 'side-by-side' =
                                mode === 'side-by-side' ? 'side-by-side' : 'inline';
                            setDiffFileLayout(selectedFileEntry.path, nextLayout);
                        }}
                    />
                )}
            </div>

            {renderContent()}
        </div>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDiffFileCount = (): number => {
    const { git } = useRuntimeAPIs();
    const { currentSessionId, sessions, worktreeMetadata: worktreeMap } = useSessionStore();
    const { currentDirectory: fallbackDirectory } = useDirectoryStore();

    const worktreeMetadata = currentSessionId ? worktreeMap.get(currentSessionId) ?? undefined : undefined;
    const currentSession = sessions.find((session) => session.id === currentSessionId);
    const sessionDirectory = (currentSession as Record<string, unknown>)?.directory as string | undefined;
    const effectiveDirectory = worktreeMetadata?.path ?? sessionDirectory ?? fallbackDirectory ?? undefined;

    const { setActiveDirectory, fetchStatus } = useGitStore();
    const fileCount = useGitFileCount(effectiveDirectory ?? null);

    React.useEffect(() => {
        if (effectiveDirectory) {
            setActiveDirectory(effectiveDirectory);

            const dirState = useGitStore.getState().directories.get(effectiveDirectory);
            if (!dirState?.status) {
                fetchStatus(effectiveDirectory, git);
            }
        }
    }, [effectiveDirectory, setActiveDirectory, fetchStatus, git]);

    return fileCount;
};
