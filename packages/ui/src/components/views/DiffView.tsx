import React from 'react';
import { RiGitCommitLine, RiLoader4Line, RiTextWrap } from '@remixicon/react';

import { useSessionStore } from '@/stores/useSessionStore';
import { useDirectoryStore } from '@/stores/useDirectoryStore';
import { useUIStore } from '@/stores/useUIStore';
import { useGitStore, useGitStatus, useIsGitRepo, useGitFileCount } from '@/stores/useGitStore';
import type { GitStatus } from '@/lib/api/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RiArrowDownSLine } from '@remixicon/react';
import { getLanguageFromExtension, isImageFile } from '@/lib/toolHelpers';
import { useRuntimeAPIs } from '@/hooks/useRuntimeAPIs';
import { DiffViewToggle } from '@/components/chat/message/DiffViewToggle';
import type { DiffViewMode } from '@/components/chat/message/types';
import { PierreDiffViewer } from './PierreDiffViewer';
import { useDeviceInfo } from '@/lib/device';

// Minimum width for side-by-side diff view (px)
const SIDE_BY_SIDE_MIN_WIDTH = 1100;

type FileEntry = GitStatus['files'][number] & {
    insertions: number;
    deletions: number;
    isNew: boolean;
};

type DiffData = { original: string; modified: string };

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
            {added ? <span style={{ color: 'var(--status-success)' }}>+{added}</span> : null}
            {removed ? <span style={{ color: 'var(--status-error)' }}>-{removed}</span> : null}
        </span>
    );
};

interface FileSelectorProps {
    changedFiles: FileEntry[];
    selectedFile: string | null;
    selectedFileEntry: FileEntry | null;
    onSelectFile: (path: string) => void;
    isMobile: boolean;
}

const FileSelector = React.memo<FileSelectorProps>(({
    changedFiles,
    selectedFile,
    selectedFileEntry,
    onSelectFile,
    isMobile,
}) => {
    const getLabel = React.useCallback((path: string) => {
        if (!isMobile) return path;
        const lastSlash = path.lastIndexOf('/');
        return lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
    }, [isMobile]);

    if (changedFiles.length === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex h-8 items-center gap-2 rounded-lg border border-input bg-transparent px-2 typography-ui-label text-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring">
                    {selectedFileEntry ? (
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="min-w-0 flex-1 truncate typography-meta">
                                {getLabel(selectedFileEntry.path)}
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
                            <div className="flex w-full min-w-0 items-center gap-3">
                                <span className="min-w-0 flex-1 truncate typography-meta">
                                    {getLabel(file.path)}
                                </span>
                                <span className="ml-auto">
                                    {formatDiffTotals(file.insertions, file.deletions)}
                                </span>
                            </div>
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

// Image diff viewer for binary image files
interface ImageDiffViewerProps {
    filePath: string;
    diff: DiffData;
    isVisible: boolean;
    renderSideBySide: boolean;
}

const ImageDiffViewer = React.memo<ImageDiffViewerProps>(({
    filePath,
    diff,
    isVisible,
    renderSideBySide,
}) => {
    const hasOriginal = diff.original.length > 0;
    const hasModified = diff.modified.length > 0;

    if (!isVisible) {
        return <div className="absolute inset-0 hidden" />;
    }

    // Render side-by-side or stacked based on preference
    const containerClass = renderSideBySide
        ? 'flex flex-row gap-6 items-start justify-center h-full'
        : 'flex flex-col gap-4 items-center';

    const imageContainerClass = renderSideBySide
        ? 'flex flex-col items-center gap-2 flex-1 min-w-0 h-full'
        : 'flex flex-col items-center gap-2';

    return (
        <div className="absolute inset-0 overflow-auto p-4" style={{ contain: 'size layout' }}>
            <div className={containerClass}>
                {hasOriginal && (
                    <div className={imageContainerClass}>
                        <span className="typography-meta text-muted-foreground font-medium">Original</span>
                        <img
                            src={diff.original}
                            alt={`Original: ${filePath}`}
                            className={renderSideBySide ? "max-w-full max-h-[calc(100%-2rem)] object-contain" : "max-w-full object-contain"}
                            style={{ imageRendering: 'auto' }}
                        />
                    </div>
                )}
                {hasModified && (
                    <div className={imageContainerClass}>
                        <span className="typography-meta text-muted-foreground font-medium">
                            {hasOriginal ? 'Modified' : 'New'}
                        </span>
                        <img
                            src={diff.modified}
                            alt={`Modified: ${filePath}`}
                            className={renderSideBySide ? "max-w-full max-h-[calc(100%-2rem)] object-contain" : "max-w-full object-contain"}
                            style={{ imageRendering: 'auto' }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
});

// Single diff viewer instance - stays mounted
interface SingleDiffViewerProps {
    filePath: string;
    diff: DiffData;
    isVisible: boolean;
    renderSideBySide: boolean;
    wrapLines: boolean;
}

const SingleDiffViewer = React.memo<SingleDiffViewerProps>(({
    filePath,
    diff,
    isVisible,
    renderSideBySide,
    wrapLines,
}) => {
    const language = React.useMemo(
        () => getLanguageFromExtension(filePath) || 'text',
        [filePath]
    );

    // Check if this is an image file
    if (isImageFile(filePath)) {
        return (
            <ImageDiffViewer
                filePath={filePath}
                diff={diff}
                isVisible={isVisible}
                renderSideBySide={renderSideBySide}
            />
        );
    }

    // Use display:none for hidden diffs to exclude from layout calculations during resize
    // This is faster for resize than visibility:hidden which keeps elements in layout flow
    if (!isVisible) {
        return (
            <div className="absolute inset-0 hidden">
                <PierreDiffViewer
                    original={diff.original}
                    modified={diff.modified}
                    language={language}
                    fileName={filePath}
                    renderSideBySide={renderSideBySide}
                    wrapLines={wrapLines}
                />
            </div>
        );
    }

    return (
        <div className="absolute inset-0" style={{ contain: 'size layout' }}>
            <PierreDiffViewer
                original={diff.original}
                modified={diff.modified}
                language={language}
                fileName={filePath}
                renderSideBySide={renderSideBySide}
                wrapLines={wrapLines}
            />
        </div>
    );
});

interface DiffViewerEntryProps {
    directory: string;
    filePath: string;
    isVisible: boolean;
    renderSideBySide: boolean;
    wrapLines: boolean;
}

const DiffViewerEntry = React.memo<DiffViewerEntryProps>(({
    directory,
    filePath,
    isVisible,
    renderSideBySide,
    wrapLines,
}) => {
    const cachedDiff = useGitStore(
        React.useCallback((state) => {
            return state.directories.get(directory)?.diffCache.get(filePath) ?? null;
        }, [directory, filePath])
    );

    const diffData = React.useMemo(() => {
        if (!cachedDiff) return null;
        return { original: cachedDiff.original, modified: cachedDiff.modified };
    }, [cachedDiff]);

    if (!diffData) return null;

    return (
        <SingleDiffViewer
            filePath={filePath}
            diff={diffData}
            isVisible={isVisible}
            renderSideBySide={renderSideBySide}
            wrapLines={wrapLines}
        />
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
    const { screenWidth, isMobile } = useDeviceInfo();

    const isGitRepo = useIsGitRepo(effectiveDirectory ?? null);
    const status = useGitStatus(effectiveDirectory ?? null);
    const isLoadingStatus = useGitStore((state) => state.isLoadingStatus);
    const { setActiveDirectory, fetchStatus } = useGitStore();
 
    const [selectedFile, setSelectedFile] = React.useState<string | null>(null);

    const pendingDiffFile = useUIStore((state) => state.pendingDiffFile);
    const setPendingDiffFile = useUIStore((state) => state.setPendingDiffFile);
    const diffLayoutPreference = useUIStore((state) => state.diffLayoutPreference);
    const diffFileLayout = useUIStore((state) => state.diffFileLayout);
    const setDiffFileLayout = useUIStore((state) => state.setDiffFileLayout);
    const diffWrapLines = useUIStore((state) => state.diffWrapLines);
    const setDiffWrapLines = useUIStore((state) => state.setDiffWrapLines);

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

        // Per-file override takes priority
        const override = diffFileLayout[selectedFileEntry.path];
        if (override) return override;

        // Explicit user preference - respect it regardless of screen width
        if (diffLayoutPreference === 'inline') {
            return 'inline';
        }

        if (diffLayoutPreference === 'side-by-side') {
            return 'side-by-side';
        }

        // Dynamic mode: auto-switch based on file type and screen width
        const isNarrow = screenWidth < SIDE_BY_SIDE_MIN_WIDTH;
        if (selectedFileEntry.isNew || isNarrow) {
            return 'inline';
        }

        return 'side-by-side';
    }, [selectedFileEntry, diffFileLayout, diffLayoutPreference, screenWidth]);

    // Fetch git status on mount
    React.useEffect(() => {
        if (effectiveDirectory) {
            setActiveDirectory(effectiveDirectory);
            const dirState = useGitStore.getState().directories.get(effectiveDirectory);
            if (!dirState?.status) {
                fetchStatus(effectiveDirectory, git);
            }
        }
    }, [effectiveDirectory, setActiveDirectory, fetchStatus, git]);

    // Handle pending diff file from external navigation
    React.useEffect(() => {
        if (pendingDiffFile) {
            setSelectedFile(pendingDiffFile);
            setPendingDiffFile(null);
        }
    }, [pendingDiffFile, setPendingDiffFile]);

    // Auto-select first file (skip if we have a pending file to consume)
    React.useEffect(() => {
        if (!selectedFile && !pendingDiffFile && changedFiles.length > 0) {
            setSelectedFile(changedFiles[0].path);
        }
    }, [changedFiles, selectedFile, pendingDiffFile]);

    // Clear selection if file no longer exists
    React.useEffect(() => {
        if (selectedFile && changedFiles.length > 0) {
            const stillExists = changedFiles.some((f) => f.path === selectedFile);
            if (!stillExists) {
                setSelectedFile(changedFiles[0]?.path ?? null);
            }
        }
    }, [changedFiles, selectedFile]);

    const handleSelectFile = React.useCallback((value: string) => {
        setSelectedFile(value);
    }, []);

    const renderSideBySide = (currentLayoutForSelectedFile ?? 'side-by-side') === 'side-by-side';

    const selectedCachedDiff = useGitStore(React.useCallback((state) => {
        if (!effectiveDirectory || !selectedFile) return null;
        return state.directories.get(effectiveDirectory)?.diffCache.get(selectedFile) ?? null;
    }, [effectiveDirectory, selectedFile]));

    const hasCurrentDiff = !!selectedCachedDiff;
    const isCurrentFileLoading = !!selectedFile && !hasCurrentDiff;

    // Render all diff viewers - they stay mounted
    const renderAllDiffViewers = () => {
        if (!effectiveDirectory || changedFiles.length === 0) return null;

        return changedFiles.map((file) => (
            <DiffViewerEntry
                key={file.path}
                directory={effectiveDirectory}
                filePath={file.path}
                isVisible={file.path === selectedFile}
                renderSideBySide={renderSideBySide}
                wrapLines={diffWrapLines}
            />
        ));
    };

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


        return (
            <div className="flex flex-1 min-h-0 overflow-hidden px-3 py-3 relative">
                {renderAllDiffViewers()}
                {isCurrentFileLoading && !hasCurrentDiff && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <RiLoader4Line size={16} className="animate-spin" />
                        Loading diff…
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            <div className="flex items-center gap-3 px-3 py-2 bg-background">
                {!isMobile && (
                    <div className="flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground shrink-0">
                        <RiGitCommitLine size={16} />
                        <span className="typography-ui-label font-semibold text-foreground">
                            {isLoadingStatus && !status
                                ? 'Loading changes…'
                                : `${changedFiles.length} ${changedFiles.length === 1 ? 'file' : 'files'} changed`}
                        </span>
                    </div>
                )}
                <FileSelector
                    changedFiles={changedFiles}
                    selectedFile={selectedFile}
                    selectedFileEntry={selectedFileEntry}
                    onSelectFile={handleSelectFile}
                    isMobile={isMobile || screenWidth <= 768}
                />
                <div className="flex-1" />
                {selectedFileEntry && (
                    <button
                        type="button"
                        onClick={() => setDiffWrapLines(!diffWrapLines)}
                        className={`flex items-center justify-center size-5 rounded-sm transition-opacity ${
                            diffWrapLines
                                ? 'text-foreground opacity-100'
                                : 'text-muted-foreground opacity-60 hover:opacity-100'
                        }`}
                        title={diffWrapLines ? 'Disable line wrap' : 'Enable line wrap'}
                    >
                        <RiTextWrap className="size-4" />
                    </button>
                )}
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
