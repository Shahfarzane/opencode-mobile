import { useState, useEffect, useRef, useCallback } from 'react';
import { Text } from '@/components/ui/text';

interface WorkingPlaceholderProps {
    statusText: string | null;
    isGenericStatus?: boolean;
    isWaitingForPermission?: boolean;
    wasAborted?: boolean;
    completionId?: string | null;
    isComplete?: boolean;
    onResultVisibilityChange?: (isShowingResult: boolean) => void;
}

const STATUS_DISPLAY_TIME = 1500; // Minimum time to show each status
const DONE_DISPLAY_TIME = 2000; // Time to show Done/Aborted status

type PlaceholderState = 'idle' | 'showing' | 'done' | 'aborted';

export function WorkingPlaceholder({
    statusText,
    isGenericStatus,
    isWaitingForPermission,
    wasAborted,
    completionId,
    isComplete,
    onResultVisibilityChange,
}: WorkingPlaceholderProps) {
    // Internal state machine
    const [state, setState] = useState<PlaceholderState>('idle');
    const [displayedText, setDisplayedText] = useState<string | null>(null);
    const [displayedPermission, setDisplayedPermission] = useState<boolean>(false);

    // Refs for timing
    const statusShownAtRef = useRef<number>(0);
    const queuedStatusRef = useRef<{ text: string; permission: boolean } | null>(null);
    const processQueueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastCompletionIdRef = useRef<string | null>(null);
    // Track if we've ever shown activity in this turn
    const hasShownActivityRef = useRef<boolean>(false);
    // Track the previous isComplete value to detect edges
    const prevIsCompleteRef = useRef<boolean>(false);
    const prevWasAbortedRef = useRef<boolean>(false);

    // Clear all timers
    const clearTimers = useCallback(() => {
        if (processQueueTimerRef.current) {
            clearTimeout(processQueueTimerRef.current);
            processQueueTimerRef.current = null;
        }
        if (doneTimerRef.current) {
            clearTimeout(doneTimerRef.current);
            doneTimerRef.current = null;
        }
    }, []);

    // Show a status immediately
    const showStatus = useCallback((text: string, permission: boolean) => {
        clearTimers();
        queuedStatusRef.current = null;
        setDisplayedText(text);
        setDisplayedPermission(permission);
        setState('showing');
        statusShownAtRef.current = Date.now();
        hasShownActivityRef.current = true;
    }, [clearTimers]);

    // Schedule processing of queued status
    const scheduleQueueProcess = useCallback(() => {
        if (processQueueTimerRef.current) return; // Already scheduled
        
        const elapsed = Date.now() - statusShownAtRef.current;
        const remaining = Math.max(0, STATUS_DISPLAY_TIME - elapsed);
        
        processQueueTimerRef.current = setTimeout(() => {
            processQueueTimerRef.current = null;
            const queued = queuedStatusRef.current;
            if (queued) {
                showStatus(queued.text, queued.permission);
            }
            // If nothing queued, keep showing current status
        }, remaining);
    }, [showStatus]);

    // Show done/aborted result
    const showResult = useCallback((result: 'done' | 'aborted') => {
        clearTimers();
        queuedStatusRef.current = null;
        
        // Only show result if we had activity
        if (!hasShownActivityRef.current) {
            setState('idle');
            setDisplayedText(null);
            onResultVisibilityChange?.(false);
            return;
        }

        // Skip duplicate completion for same completionId
        if (result === 'done' && completionId && lastCompletionIdRef.current === completionId) {
            setState('idle');
            setDisplayedText(null);
            hasShownActivityRef.current = false;
            onResultVisibilityChange?.(false);
            return;
        }

        if (result === 'done' && completionId) {
            lastCompletionIdRef.current = completionId;
        }

        setState(result);
        setDisplayedText(null);
        onResultVisibilityChange?.(true);
        
        // Auto-hide after DONE_DISPLAY_TIME
        doneTimerRef.current = setTimeout(() => {
            doneTimerRef.current = null;
            setState('idle');
            hasShownActivityRef.current = false;
            onResultVisibilityChange?.(false);
        }, DONE_DISPLAY_TIME);
    }, [clearTimers, completionId, onResultVisibilityChange]);

    // Main effect: handle prop changes
    useEffect(() => {
        // Detect abort edge (false -> true)
        if (wasAborted && !prevWasAbortedRef.current) {
            prevWasAbortedRef.current = true;
            showResult('aborted');
            return;
        }
        prevWasAbortedRef.current = !!wasAborted;

        // Detect completion edge (false -> true)
        if (isComplete && !prevIsCompleteRef.current) {
            prevIsCompleteRef.current = true;
            showResult('done');
            return;
        }
        // Reset edge detection when isComplete goes back to false
        if (!isComplete && prevIsCompleteRef.current) {
            prevIsCompleteRef.current = false;
        }

        // If we're showing done/aborted, don't process new status
        if (state === 'done' || state === 'aborted') {
            return;
        }

        // Handle new status text
        if (statusText) {
            const now = Date.now();
            const elapsed = now - statusShownAtRef.current;
            
            if (state === 'idle' || !displayedText) {
                // Not showing anything - show immediately (generic OK at turn start)
                showStatus(statusText, !!isWaitingForPermission);
            } else if (statusText !== displayedText || !!isWaitingForPermission !== displayedPermission) {
                // Already showing something - ignore generic statuses
                if (isGenericStatus) {
                    return;
                }
                
                // Different specific status
                if (elapsed >= STATUS_DISPLAY_TIME) {
                    // Minimum time passed - show immediately
                    showStatus(statusText, !!isWaitingForPermission);
                } else {
                    // Queue the latest (overwrites previous queued)
                    queuedStatusRef.current = { text: statusText, permission: !!isWaitingForPermission };
                    scheduleQueueProcess();
                }
            }
            // Same status - keep showing
        }
        // IMPORTANT: When statusText becomes null, we do NOT clear the display
        // Only done/abort signals clear the display
        
    }, [statusText, isWaitingForPermission, wasAborted, isComplete, state, displayedText, displayedPermission, showStatus, showResult, scheduleQueueProcess, isGenericStatus]);

    // Cleanup on unmount
    useEffect(() => {
        return () => clearTimers();
    }, [clearTimers]);

    // Handle tab visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (typeof document === 'undefined') return;
            if (document.visibilityState !== 'visible') return;
            
            // If showing done/aborted when user returns, hide it
            if (state === 'done' || state === 'aborted') {
                clearTimers();
                setState('idle');
                setDisplayedText(null);
                hasShownActivityRef.current = false;
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [state, clearTimers]);

    // Render nothing if idle with no text
    if (state === 'idle' && !displayedText) {
        return null;
    }

    // Determine what to show
    let label: string;
    let showEllipsis = true;
    
    if (state === 'done') {
        label = 'Done';
        showEllipsis = false;
    } else if (state === 'aborted') {
        label = 'Aborted';
        showEllipsis = false;
    } else if (displayedText) {
        label = displayedText.charAt(0).toUpperCase() + displayedText.slice(1);
    } else {
        label = 'Working';
    }

    const displayText = showEllipsis ? `${label}...` : label;
    const isVisible = state !== 'idle';

    return (
        <div
            className={`flex h-full items-center text-muted-foreground pl-[2ch] transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            role="status"
            aria-live={displayedPermission ? 'assertive' : 'polite'}
            aria-label={label}
            data-waiting={displayedPermission ? 'true' : undefined}
        >
            <span className="flex items-center gap-1.5">
                {state === 'done' ? (
                    <Text variant="hover-enter" className="typography-ui-header">
                        Done
                    </Text>
                ) : state === 'aborted' ? (
                    <Text variant="hover-enter" className="typography-ui-header text-status-error">
                        Aborted
                    </Text>
                ) : (
                    <Text variant="shine" className="typography-ui-header">
                        {displayText}
                    </Text>
                )}
            </span>
        </div>
    );
}
