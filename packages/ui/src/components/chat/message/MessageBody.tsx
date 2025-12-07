import React from 'react';
import type { Part } from '@opencode-ai/sdk';

import AssistantTextPart from './parts/AssistantTextPart';
import UserTextPart from './parts/UserTextPart';
import ReasoningPart from './parts/ReasoningPart';
import ToolPart from './parts/ToolPart';
import ProgressiveGroup from './parts/ProgressiveGroup';
import MigratingPart from './parts/MigratingPart';
import { MessageFilesDisplay } from '../FileAttachment';
import type { ToolPart as ToolPartType } from '@opencode-ai/sdk';
import type { StreamPhase, ToolPopupContent, AgentMentionInfo } from './types';
import type { TurnGroupingContext } from '../hooks/useTurnGrouping';
import { cn } from '@/lib/utils';
import { isEmptyTextPart, extractTextContent } from './partUtils';
import { FadeInOnReveal } from './FadeInOnReveal';
import { Button } from '@/components/ui/button';
import { RiCheckLine, RiFileCopyLine } from '@remixicon/react';
import type { ContentChangeReason } from '@/hooks/useChatScrollManager';
import { SimpleMarkdownRenderer } from '../MarkdownRenderer';
import { useMessageStore } from '@/stores/messageStore';
import { useSessionStore } from '@/stores/sessionStore';

const useMigrationTimer = (
    turnGroupingContext: TurnGroupingContext | undefined,
    previewablePartIds: Set<string>
): { isAnimating: boolean } => {
    const timerRef = React.useRef<number | null>(null);
    const animationTimerRef = React.useRef<number | null>(null);
    const [isAnimating, setIsAnimating] = React.useState(false);

    const contextRef = React.useRef(turnGroupingContext);
    contextRef.current = turnGroupingContext;
    const partIdsRef = React.useRef(previewablePartIds);
    partIdsRef.current = previewablePartIds;

    const timerStartedRef = React.useRef(false);

    const hasPreviewableParts = previewablePartIds.size > 0;

    React.useEffect(() => {
        if (!turnGroupingContext) return;
        if (!turnGroupingContext.isWorking) return;
        if (turnGroupingContext.isGroupExpanded) return;
        if (!hasPreviewableParts) return;
        if (timerStartedRef.current) return;

        timerStartedRef.current = true;

        timerRef.current = window.setTimeout(() => {
            timerRef.current = null;
            setIsAnimating(true);

            animationTimerRef.current = window.setTimeout(() => {
                animationTimerRef.current = null;
                setIsAnimating(false);
                const context = contextRef.current;
                if (!context) {
                    return;
                }
                const idsToPreview = Array.from(partIdsRef.current);
                if (idsToPreview.length > 0) {
                    context.markPartsPreviewed(idsToPreview);
                }
            }, 300);
        }, 1000);
    }, [hasPreviewableParts, turnGroupingContext]);

    React.useEffect(() => {
        if (!turnGroupingContext) return;
        if (!turnGroupingContext.isWorking || turnGroupingContext.isGroupExpanded || !hasPreviewableParts) {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            if (animationTimerRef.current) {
                window.clearTimeout(animationTimerRef.current);
                animationTimerRef.current = null;
            }
            setIsAnimating(false);
            timerStartedRef.current = false;
        }
    }, [hasPreviewableParts, turnGroupingContext]);

    React.useEffect(() => {
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
            if (animationTimerRef.current) window.clearTimeout(animationTimerRef.current);
        };
    }, []);

    return { isAnimating };
};

interface MessageBodyProps {
    messageId: string;
    parts: Part[];
    isUser: boolean;
    isMessageCompleted: boolean;

    syntaxTheme: { [key: string]: React.CSSProperties };

    isMobile: boolean;
    hasTouchInput?: boolean;
    copiedCode: string | null;
    onCopyCode: (code: string) => void;
    expandedTools: Set<string>;
    onToggleTool: (toolId: string) => void;
    onShowPopup: (content: ToolPopupContent) => void;
    streamPhase: StreamPhase;
    allowAnimation: boolean;
    onContentChange?: (reason?: ContentChangeReason, messageId?: string) => void;

    shouldShowHeader?: boolean;
    hasTextContent?: boolean;
    onCopyMessage?: () => void;
    copiedMessage?: boolean;
    onAuxiliaryContentComplete?: () => void;
    showReasoningTraces?: boolean;
    agentMention?: AgentMentionInfo;
    turnGroupingContext?: TurnGroupingContext;
}

const UserMessageBody: React.FC<{
    messageId: string;
    parts: Part[];
    isMobile: boolean;
    hasTouchInput?: boolean;
    hasTextContent?: boolean;
    onCopyMessage?: () => void;
    copiedMessage?: boolean;
    onShowPopup: (content: ToolPopupContent) => void;
    agentMention?: AgentMentionInfo;
}> = ({ messageId, parts, isMobile, hasTouchInput, hasTextContent, onCopyMessage, copiedMessage, onShowPopup, agentMention }) => {
    const [copyHintVisible, setCopyHintVisible] = React.useState(false);
    const copyHintTimeoutRef = React.useRef<number | null>(null);

    const textParts = React.useMemo(() => {
        return parts.filter((part) => {
            if (part.type !== 'text') return false;
            return !isEmptyTextPart(part);
        });
    }, [parts]);

    const mentionToken = agentMention?.token;
    let mentionInjected = false;

    const canCopyMessage = Boolean(onCopyMessage);
    const isMessageCopied = Boolean(copiedMessage);
    const isTouchContext = Boolean(hasTouchInput ?? isMobile);
    const hasCopyableText = Boolean(hasTextContent);

    const clearCopyHintTimeout = React.useCallback(() => {
        if (copyHintTimeoutRef.current !== null && typeof window !== 'undefined') {
            window.clearTimeout(copyHintTimeoutRef.current);
            copyHintTimeoutRef.current = null;
        }
    }, []);

    const revealCopyHint = React.useCallback(() => {
        if (!isTouchContext || !canCopyMessage || !hasCopyableText || typeof window === 'undefined') {
            return;
        }

        clearCopyHintTimeout();
        setCopyHintVisible(true);
        copyHintTimeoutRef.current = window.setTimeout(() => {
            setCopyHintVisible(false);
            copyHintTimeoutRef.current = null;
        }, 1800);
    }, [canCopyMessage, clearCopyHintTimeout, hasCopyableText, isTouchContext]);

    React.useEffect(() => {
        if (!hasCopyableText) {
            setCopyHintVisible(false);
            clearCopyHintTimeout();
        }
    }, [clearCopyHintTimeout, hasCopyableText]);

    const handleCopyButtonClick = React.useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            if (!onCopyMessage || !hasCopyableText) {
                return;
            }

            event.stopPropagation();
            event.preventDefault();
            onCopyMessage();

            if (isTouchContext) {
                revealCopyHint();
            }
        },
        [hasCopyableText, isTouchContext, onCopyMessage, revealCopyHint]
    );

    return (
        <div
            className="relative w-full group/message"
            style={{ contain: 'layout', transform: 'translateZ(0)' }}
            onTouchStart={isTouchContext && canCopyMessage && hasCopyableText ? revealCopyHint : undefined}
        >
            {canCopyMessage && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    data-visible={copyHintVisible || isMessageCopied ? 'true' : undefined}
                    className={cn(
                        'absolute z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border/40 shadow-none bg-background/95 supports-[backdrop-filter]:bg-background/80 hover:bg-accent duration-150',
                        'opacity-0 pointer-events-none disabled:opacity-30 disabled:text-muted-foreground/40',
                        hasCopyableText &&
                            'group-hover/message:opacity-60 group-hover/message:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto',
                        (copyHintVisible || isMessageCopied) && 'opacity-100 pointer-events-auto'
                    )}
                    style={{ insetInlineEnd: '0.32rem', insetBlockStart: '-0.28rem' }}
                    disabled={!hasCopyableText}
                    aria-label="Copy message text"
                    aria-hidden={!hasCopyableText}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={handleCopyButtonClick}
                    onFocus={() => {
                        if (hasCopyableText) {
                            setCopyHintVisible(true);
                        }
                    }}
                    onBlur={() => {
                        if (!isMessageCopied) {
                            setCopyHintVisible(false);
                        }
                    }}
                >
                    {isMessageCopied ? (
                        <RiCheckLine className="h-3.5 w-3.5 text-[color:var(--status-success)]" />
                    ) : (
                        <RiFileCopyLine className="h-3.5 w-3.5 text-foreground hover:text-primary focus-visible:text-primary" />
                    )}
                </Button>
            )}
            <div className="px-3">
                <div className="leading-normal overflow-hidden text-foreground/90">
                    {textParts.map((part, index) => {
                        let mentionForPart: AgentMentionInfo | undefined;
                        if (agentMention && mentionToken && !mentionInjected) {
                            const candidateText = extractTextContent(part);
                            if (candidateText.includes(mentionToken)) {
                                mentionForPart = agentMention;
                                mentionInjected = true;
                            }
                        }
                        return (
                            <FadeInOnReveal key={`user-text-${index}`}>
                                <UserTextPart
                                    part={part}
                                    messageId={messageId}
                                    isMobile={isMobile}
                                    agentMention={mentionForPart}
                                />
                            </FadeInOnReveal>
                        );
                    })}
                </div>
                <MessageFilesDisplay files={parts} onShowPopup={onShowPopup} />
            </div>
        </div>
    );
};

const AssistantMessageBody: React.FC<Omit<MessageBodyProps, 'isUser'>> = ({
    messageId,
    parts,
    isMessageCompleted,

    syntaxTheme,
    isMobile,
    hasTouchInput,
    copiedCode,
    onCopyCode,
    expandedTools,
    onToggleTool,
    onShowPopup,
    streamPhase: _streamPhase,
    allowAnimation: _allowAnimation,
    onContentChange,
    shouldShowHeader = true,
    hasTextContent = false,
    onCopyMessage,
    copiedMessage = false,
    onAuxiliaryContentComplete,
    showReasoningTraces = false,
    turnGroupingContext,
}) => {

    void _streamPhase;
    void _allowAnimation;
    const [copyHintVisible, setCopyHintVisible] = React.useState(false);
    const copyHintTimeoutRef = React.useRef<number | null>(null);

    const canCopyMessage = Boolean(onCopyMessage);
    const isMessageCopied = Boolean(copiedMessage);
    const isTouchContext = Boolean(hasTouchInput ?? isMobile);
    const awaitingMessageCompletion = !isMessageCompleted;

    const visibleParts = React.useMemo(() => {
        return parts
            .filter((part) => !isEmptyTextPart(part))
            .filter((part) => {
                const rawPart = part as Record<string, unknown>;
                return rawPart.type !== 'compaction';
            });
    }, [parts]);

    const toolParts = React.useMemo(() => {
        return visibleParts.filter((part): part is ToolPartType => part.type === 'tool');
    }, [visibleParts]);

    const assistantTextParts = React.useMemo(() => {
        return visibleParts.filter((part) => part.type === 'text');
    }, [visibleParts]);

    const hasTools = toolParts.length > 0;

    const hasPendingTools = React.useMemo(() => {
        return toolParts.some((toolPart) => {
            const state = (toolPart as Record<string, unknown>).state as Record<string, unknown> | undefined ?? {};
            const status = state?.status;
            return status === 'pending' || status === 'running' || status === 'started';
        });
    }, [toolParts]);

    const isToolFinalized = React.useCallback((toolPart: ToolPartType) => {
        const state = (toolPart as Record<string, unknown>).state as Record<string, unknown> | undefined ?? {};
        const status = state?.status;
        if (status === 'pending' || status === 'running' || status === 'started') {
            return false;
        }
        const time = state?.time as Record<string, unknown> | undefined ?? {};
        const endTime = typeof time?.end === 'number' ? time.end : undefined;
        const startTime = typeof time?.start === 'number' ? time.start : undefined;
        if (typeof endTime !== 'number') {
            return false;
        }
        if (typeof startTime === 'number' && endTime < startTime) {
            return false;
        }
        return true;
    }, []);

    const allToolsFinalized = React.useMemo(() => {
        if (toolParts.length === 0) {
            return true;
        }
        if (hasPendingTools) {
            return false;
        }
        return toolParts.every((toolPart) => isToolFinalized(toolPart));
    }, [toolParts, hasPendingTools, isToolFinalized]);

    const assistantTextReady = React.useMemo(() => {
        if (assistantTextParts.length === 0) {
            return true;
        }
        return assistantTextParts.every((part) => {
            const time = (part as Record<string, unknown>).time as Record<string, unknown> | undefined;
            return typeof time?.end === 'number';
        });
    }, [assistantTextParts]);

    const reasoningParts = React.useMemo(() => {
        return visibleParts.filter((part) => part.type === 'reasoning');
    }, [visibleParts]);

    const reasoningComplete = React.useMemo(() => {
        if (reasoningParts.length === 0) {
            return true;
        }
        return reasoningParts.every((part) => {
            const time = (part as Record<string, unknown>).time as { end?: number } | undefined;
            return typeof time?.end === 'number';
        });
    }, [reasoningParts]);

    const stepState = React.useMemo(() => {
        let stepStarts = 0;
        let stepFinishes = 0;
        visibleParts.forEach((part) => {
            if (part.type === 'step-start') {
                stepStarts += 1;
            } else if (part.type === 'step-finish') {
                stepFinishes += 1;
            }
        });
        return {
            stepStarts,
            stepFinishes,
            hasOpenStep: stepStarts > stepFinishes,
        };
    }, [visibleParts]);

    const hasOpenStep = stepState.hasOpenStep;

    const shouldHoldForReasoning =
        reasoningParts.length > 0 &&
        hasTools &&
        (hasPendingTools || hasOpenStep || !allToolsFinalized);

    const shouldCoordinateRendering = React.useMemo(() => {
        if (!hasTools) {
            return assistantTextParts.length > 0 ? shouldHoldForReasoning : false;
        }
        if (assistantTextParts.length === 0) {
            return hasOpenStep || hasPendingTools || !allToolsFinalized;
        }
        return true;
    }, [assistantTextParts.length, hasOpenStep, hasPendingTools, hasTools, shouldHoldForReasoning, allToolsFinalized]);

    const shouldHoldAssistantText = awaitingMessageCompletion
        || (shouldCoordinateRendering && (!assistantTextReady || !allToolsFinalized || hasPendingTools || hasOpenStep))
        || shouldHoldForReasoning;
    const shouldHoldTools = awaitingMessageCompletion
        || (hasTools && (hasPendingTools || hasOpenStep || !allToolsFinalized));
    const shouldHoldReasoning = awaitingMessageCompletion || shouldHoldForReasoning;

    const hasAuxiliaryContent = hasTools || reasoningParts.length > 0;
    const isTextlessAssistantMessage = assistantTextParts.length === 0;
    const auxiliaryContentComplete = hasAuxiliaryContent && isTextlessAssistantMessage && !shouldHoldTools && !shouldHoldReasoning && allToolsFinalized && reasoningComplete;
    const auxiliaryCompletionAnnouncedRef = React.useRef(false);
    const soloReasoningScrollTriggeredRef = React.useRef(false);

    React.useEffect(() => {
        soloReasoningScrollTriggeredRef.current = false;
    }, [messageId]);

    React.useEffect(() => {
        if (!auxiliaryContentComplete) {
            auxiliaryCompletionAnnouncedRef.current = false;
            return;
        }
        if (auxiliaryCompletionAnnouncedRef.current) {
            return;
        }
        auxiliaryCompletionAnnouncedRef.current = true;
        onAuxiliaryContentComplete?.();
    }, [auxiliaryContentComplete, onAuxiliaryContentComplete]);

    React.useEffect(() => {
        if (awaitingMessageCompletion) {
            soloReasoningScrollTriggeredRef.current = false;
            return;
        }
        if (hasTools) {
            soloReasoningScrollTriggeredRef.current = false;
            return;
        }
        if (reasoningParts.length === 0) {
            return;
        }
        if (shouldHoldReasoning || !reasoningComplete) {
            return;
        }
        if (soloReasoningScrollTriggeredRef.current) {
            return;
        }
        soloReasoningScrollTriggeredRef.current = true;
        onContentChange?.('structural');
    }, [awaitingMessageCompletion, hasTools, onContentChange, reasoningComplete, reasoningParts.length, shouldHoldReasoning]);

    const hasCopyableText = Boolean(hasTextContent) && !awaitingMessageCompletion;

    const clearCopyHintTimeout = React.useCallback(() => {
        if (copyHintTimeoutRef.current !== null && typeof window !== 'undefined') {
            window.clearTimeout(copyHintTimeoutRef.current);
            copyHintTimeoutRef.current = null;
        }
    }, []);

    const revealCopyHint = React.useCallback(() => {
        if (!isTouchContext || !canCopyMessage || !hasCopyableText || typeof window === 'undefined') {
            return;
        }

        clearCopyHintTimeout();
        setCopyHintVisible(true);
        copyHintTimeoutRef.current = window.setTimeout(() => {
            setCopyHintVisible(false);
            copyHintTimeoutRef.current = null;
        }, 1800);
    }, [canCopyMessage, clearCopyHintTimeout, hasCopyableText, isTouchContext]);

    React.useEffect(() => {
        if (!hasCopyableText) {
            setCopyHintVisible(false);
            clearCopyHintTimeout();
        }
    }, [clearCopyHintTimeout, hasCopyableText]);

    const handleCopyButtonClick = React.useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            if (!onCopyMessage || !hasCopyableText) {
                return;
            }

            event.stopPropagation();
            event.preventDefault();
            onCopyMessage();

            if (isTouchContext) {
                revealCopyHint();
            }
        },
        [hasCopyableText, isTouchContext, onCopyMessage, revealCopyHint]
    );

    React.useEffect(() => {
        return () => {
            clearCopyHintTimeout();
        };
    }, [clearCopyHintTimeout]);

    const toolConnections = React.useMemo(() => {
        const connections: Record<string, { hasPrev: boolean; hasNext: boolean }> = {};
        const displayableTools = toolParts.filter((toolPart) => {
            if (shouldHoldTools) {
                return false;
            }
            return isToolFinalized(toolPart);
        });

        displayableTools.forEach((toolPart, index) => {
            connections[toolPart.id] = {
                hasPrev: index > 0,
                hasNext: index < displayableTools.length - 1,
            };
        });

        return connections;
    }, [toolParts, shouldHoldTools, isToolFinalized]);

    const activityPartsForTurn = React.useMemo(() => {
        return turnGroupingContext?.activityParts ?? [];
    }, [turnGroupingContext]);

    const activityPartsForMessage = React.useMemo(() => {
        if (!turnGroupingContext) return [];
        return activityPartsForTurn.filter((activity) => activity.messageId === messageId);
    }, [activityPartsForTurn, messageId, turnGroupingContext]);

    const activityPartsByPart = React.useMemo(() => {
        const map = new Map<Part, (typeof activityPartsForMessage)[number]>();
        activityPartsForMessage.forEach((activity) => {
            map.set(activity.part, activity);
        });
        return map;
    }, [activityPartsForMessage]);

    const visibleActivityPartsForTurn = React.useMemo(() => {
        if (!turnGroupingContext) return [];
        if (!showReasoningTraces) {
            return activityPartsForTurn.filter((activity) => activity.kind === 'tool');
        }
        return activityPartsForTurn;
    }, [activityPartsForTurn, showReasoningTraces, turnGroupingContext]);

    const [hasEverHadMultipleVisibleActivities, setHasEverHadMultipleVisibleActivities] = React.useState(false);

    React.useEffect(() => {
        if (!turnGroupingContext) {
            return;
        }
        if (visibleActivityPartsForTurn.length > 1) {
            setHasEverHadMultipleVisibleActivities(true);
        }
    }, [turnGroupingContext, visibleActivityPartsForTurn.length]);

    const shouldShowActivityGroup = Boolean(turnGroupingContext && hasEverHadMultipleVisibleActivities);

    const previewableActivityPartsForMessage = React.useMemo(() => {
        if (!turnGroupingContext) return [];
        if (!shouldShowActivityGroup) return [];
        if (!turnGroupingContext.isWorking || turnGroupingContext.isGroupExpanded) {
            return [];
        }

        const previewable: (typeof activityPartsForMessage) = [];

        activityPartsForMessage.forEach((activity) => {
            if (turnGroupingContext.previewedPartIds.has(activity.id)) {
                return;
            }

            if (!showReasoningTraces && activity.kind !== 'tool') {
                return;
            }

            const part = activity.part;

            if (activity.kind === 'tool') {
                const toolPart = part as ToolPartType;
                if (shouldHoldTools) return;
                if (!isToolFinalized(toolPart)) return;
            } else if (activity.kind === 'reasoning') {
                if (!showReasoningTraces) return;
                if (shouldHoldReasoning) return;
                const time = (part as { time?: { end?: number | null | undefined } | null | undefined }).time;
                if (typeof time?.end !== 'number') return;
            } else if (activity.kind === 'justification') {
                if (!showReasoningTraces) return;
                if (shouldHoldAssistantText) return;
                const time = (part as { time?: { end?: number | null | undefined } | null | undefined }).time;
                if (typeof time?.end !== 'number') return;
            }

            previewable.push(activity);
        });

        return previewable;
    }, [
        activityPartsForMessage,
        isToolFinalized,
        shouldHoldAssistantText,
        shouldHoldReasoning,
        shouldHoldTools,
        showReasoningTraces,
        shouldShowActivityGroup,
        turnGroupingContext,
    ]);

    const previewableActivityPartIds = React.useMemo(() => {
        const ids = new Set<string>();
        previewableActivityPartsForMessage.forEach((activity) => {
            ids.add(activity.id);
        });
        return ids;
    }, [previewableActivityPartsForMessage]);

    const { isAnimating: isMessageAnimating } = useMigrationTimer(turnGroupingContext, previewableActivityPartIds);

    const renderedParts = React.useMemo(() => {
        const rendered: React.ReactNode[] = [];

        if (
            turnGroupingContext &&
            turnGroupingContext.isFirstAssistantInTurn &&
            shouldShowActivityGroup &&
            visibleActivityPartsForTurn.length > 0
        ) {
            rendered.push(
                <ProgressiveGroup
                    key="progressive-group"
                    parts={visibleActivityPartsForTurn}
                    isExpanded={turnGroupingContext.isGroupExpanded}
                    onToggle={turnGroupingContext.toggleGroup}
                    syntaxTheme={syntaxTheme}
                    isMobile={isMobile}
                    expandedTools={expandedTools}
                    onToggleTool={onToggleTool}
                    onShowPopup={onShowPopup}
                    onContentChange={onContentChange}
                    isWorking={turnGroupingContext.isWorking}
                    previewedPartIds={turnGroupingContext.previewedPartIds}
                    diffStats={turnGroupingContext.diffStats}
                />
            );
        }

        const partsWithTime: Array<{
            part: Part;
            index: number;
            endTime: number | null;
            element: React.ReactNode;
        }> = [];

        visibleParts.forEach((part, index) => {
            const activity = activityPartsByPart.get(part);
            if (!activity) {
                return;
            }

            if (!turnGroupingContext) {
                return;
            }

            let endTime: number | null = null;
            let element: React.ReactNode | null = null;

            if (!shouldShowActivityGroup) {
                if (activity.kind === 'tool') {
                    const toolPart = part as ToolPartType;
                    const toolState = (toolPart as { state?: { time?: { end?: number | null | undefined } | null | undefined } | null | undefined }).state;
                    const time = toolState?.time;
                    const isFinalized = isToolFinalized(toolPart);
                    const shouldShowTool = !shouldHoldTools && isFinalized;

                    if (!shouldShowTool) {
                        return;
                    }

                    const connection = toolConnections[toolPart.id];

                    const toolElement = (
                        <FadeInOnReveal key={`tool-${toolPart.id}`}>
                            <ToolPart
                                part={toolPart}
                                isExpanded={expandedTools.has(toolPart.id)}
                                onToggle={onToggleTool}
                                syntaxTheme={syntaxTheme}
                                isMobile={isMobile}
                                onContentChange={onContentChange}
                                hasPrevTool={connection?.hasPrev ?? false}
                                hasNextTool={connection?.hasNext ?? false}
                            />
                        </FadeInOnReveal>
                    );

                    element = toolElement;
                    endTime = isFinalized && typeof time?.end === 'number' ? time.end : null;
                }

                if (element) {
                    partsWithTime.push({
                        part,
                        index,
                        endTime,
                        element,
                    });
                }
                return;
            }

            if (!turnGroupingContext.isWorking || turnGroupingContext.isGroupExpanded) {
                return;
            }

            if (turnGroupingContext.previewedPartIds.has(activity.id)) {
                return;
            }

            if (!showReasoningTraces && activity.kind !== 'tool') {
                return;
            }

            const wrapForMigration = previewableActivityPartIds.has(activity.id);

            switch (activity.kind) {
                case 'tool': {
                    const toolPart = part as ToolPartType;
                    const toolState = (toolPart as { state?: { time?: { end?: number | null | undefined } | null | undefined } | null | undefined }).state;
                    const time = toolState?.time;
                    const isFinalized = isToolFinalized(toolPart);
                    const shouldShowTool = !shouldHoldTools && isFinalized;

                    if (!shouldShowTool) {
                        break;
                    }

                    const connection = toolConnections[toolPart.id];

                    const toolElement = (
                        <FadeInOnReveal key={`tool-${toolPart.id}`}>
                            <ToolPart
                                part={toolPart}
                                isExpanded={expandedTools.has(toolPart.id)}
                                onToggle={onToggleTool}
                                syntaxTheme={syntaxTheme}
                                isMobile={isMobile}
                                onContentChange={onContentChange}
                                hasPrevTool={connection?.hasPrev ?? false}
                                hasNextTool={connection?.hasNext ?? false}
                            />
                        </FadeInOnReveal>
                    );

                    element = wrapForMigration ? (
                        <MigratingPart key={`migrating-tool-${toolPart.id}`} isMigrating={isMessageAnimating}>
                            {toolElement}
                        </MigratingPart>
                    ) : toolElement;

                    endTime = isFinalized && typeof time?.end === 'number' ? time.end : null;
                    break;
                }

                case 'reasoning': {
                    if (!showReasoningTraces) {
                        break;
                    }
                    const reasoningTime = (part as { time?: { end?: number | null | undefined } | null | undefined }).time;
                    const hasEndTime = typeof reasoningTime?.end === 'number';
                    const shouldShowReasoning = hasEndTime && !shouldHoldReasoning;

                    if (!shouldShowReasoning) {
                        break;
                    }

                    const reasoningElement = (
                        <FadeInOnReveal key={`reasoning-${index}`}>
                            <ReasoningPart
                                part={part}
                                messageId={messageId}
                                onContentChange={onContentChange}
                            />
                        </FadeInOnReveal>
                    );

                    element = wrapForMigration ? (
                        <MigratingPart key={`migrating-reasoning-${index}`} isMigrating={isMessageAnimating}>
                            {reasoningElement}
                        </MigratingPart>
                    ) : reasoningElement;

                    endTime = hasEndTime ? reasoningTime?.end ?? null : null;
                    break;
                }

                case 'justification': {
                    if (!showReasoningTraces) {
                        break;
                    }

                    const time = (part as { time?: { end?: number | null | undefined } | null | undefined }).time;
                    const hasEndTime = typeof time?.end === 'number';
                    const shouldShowJustification = hasEndTime && !shouldHoldAssistantText;

                    if (!shouldShowJustification) {
                        break;
                    }

                    const textElement = (
                        <FadeInOnReveal key={`assistant-text-${index}`}>
                            <AssistantTextPart
                                part={part}
                                messageId={messageId}
                                streamPhase="completed"
                                allowAnimation={false}
                                onContentChange={onContentChange}
                                renderAsReasoning
                            />
                        </FadeInOnReveal>
                    );

                    element = wrapForMigration ? (
                        <MigratingPart key={`migrating-text-${index}`} isMigrating={isMessageAnimating}>
                            {textElement}
                        </MigratingPart>
                    ) : textElement;

                    endTime = hasEndTime ? time?.end ?? null : null;
                    break;
                }

                default:
                    break;
            }

            if (element) {
                partsWithTime.push({
                    part,
                    index,
                    endTime,
                    element,
                });
            }
        });

        partsWithTime.sort((a, b) => {
            if (a.endTime === null && b.endTime === null) {
                return a.index - b.index;
            }
            if (a.endTime === null) {
                return 1;
            }
            if (b.endTime === null) {
                return -1;
            }
            return a.endTime - b.endTime;
        });

        partsWithTime.forEach(({ element }) => {
            rendered.push(element);
        });

        return rendered;
    }, [
        activityPartsByPart,
        copiedCode,
        copiedMessage,
        expandedTools,
        hasTextContent,
        isMessageAnimating,
        isMobile,
        isToolFinalized,
        messageId,
        onContentChange,
        onCopyCode,
        onCopyMessage,
        onShowPopup,
        onToggleTool,
        previewableActivityPartIds,
        shouldHoldAssistantText,
        shouldHoldReasoning,
        shouldHoldTools,
        shouldShowActivityGroup,
        shouldShowHeader,
        showReasoningTraces,
        syntaxTheme,
        toolConnections,
        turnGroupingContext,
        visibleActivityPartsForTurn,
        visibleParts,
    ]);

    const userMessageId = turnGroupingContext?.turnId;
    const currentSessionId = useSessionStore((state) => state.currentSessionId);

    const rawSummaryBodyFromStore = useMessageStore((state) => {
        if (!userMessageId || !currentSessionId) return undefined;
        const sessionMessages = state.messages.get(currentSessionId);
        if (!sessionMessages) return undefined;
        const userMsg = sessionMessages.find((m) => m.info?.id === userMessageId);
        if (!userMsg) return undefined;
        const summary = (userMsg.info as { summary?: { body?: string | null | undefined } | null | undefined }).summary;
        const body = summary?.body;
        return typeof body === 'string' && body.trim().length > 0 ? body : undefined;
    });

    const summaryCandidate =
        typeof turnGroupingContext?.summaryBody === 'string' && turnGroupingContext.summaryBody.trim().length > 0
            ? turnGroupingContext.summaryBody
            : rawSummaryBodyFromStore;

    const summaryBodyRef = React.useRef<string | undefined>(undefined);
    if (summaryCandidate && summaryCandidate.trim().length > 0) {
        summaryBodyRef.current = summaryCandidate;
    }
    const prevUserMessageId = React.useRef(userMessageId);
    if (prevUserMessageId.current !== userMessageId) {
        prevUserMessageId.current = userMessageId;
        summaryBodyRef.current = undefined;
    }
    const summaryBody = summaryBodyRef.current;

    const showSummaryBody =
        turnGroupingContext?.isFirstAssistantInTurn &&
        summaryBody &&
        summaryBody.trim().length > 0;

    return (
        <div
            className={cn(
                'relative w-full group/message'
            )}
            style={{
                contain: 'layout',
                transform: 'translateZ(0)',
            }}
            onTouchStart={isTouchContext && canCopyMessage && hasCopyableText ? revealCopyHint : undefined}
        >
            <div className="px-3">
                <div className="leading-normal overflow-hidden text-foreground/90 [&_p:last-child]:mb-0 [&_ul:last-child]:mb-0 [&_ol:last-child]:mb-0">
                    {renderedParts}
                    {showSummaryBody && (
                        <FadeInOnReveal key="summary-body">
                            <div
                                className="group/assistant-text relative break-words"
                                onTouchStart={isTouchContext && canCopyMessage && hasCopyableText ? revealCopyHint : undefined}
                            >
                                {canCopyMessage && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        data-visible={copyHintVisible || isMessageCopied ? 'true' : undefined}
                                        className={cn(
                                            'absolute z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border/40 shadow-none bg-background/95 supports-[backdrop-filter]:bg-background/80 hover:bg-accent duration-150',
                                            'opacity-0 pointer-events-none disabled:opacity-30 disabled:text-muted-foreground/40',
                                            hasCopyableText &&
                                                'group-hover/message:opacity-60 group-hover/message:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto',
                                            (copyHintVisible || isMessageCopied) && 'opacity-100 pointer-events-auto'
                                        )}
                                        style={{ insetInlineEnd: '0.32rem', insetBlockStart: '-0.4rem' }}
                                        disabled={!hasCopyableText}
                                        aria-label="Copy message text"
                                        aria-hidden={!hasCopyableText}
                                        onPointerDown={(event) => event.stopPropagation()}
                                        onClick={handleCopyButtonClick}
                                        onFocus={() => {
                                            if (hasCopyableText) {
                                                setCopyHintVisible(true);
                                            }
                                        }}
                                        onBlur={() => {
                                            if (!isMessageCopied) {
                                                setCopyHintVisible(false);
                                            }
                                        }}
                                    >
                                        {isMessageCopied ? (
                                            <RiCheckLine className="h-3.5 w-3.5 text-[color:var(--status-success)]" />
                                        ) : (
                                            <RiFileCopyLine className="h-3.5 w-3.5 text-foreground hover:text-primary focus-visible:text-primary" />
                                        )}
                                    </Button>
                                )}
                                <SimpleMarkdownRenderer
                                    content={summaryBody}
                                />
                            </div>
                        </FadeInOnReveal>
                    )}
                </div>
                <MessageFilesDisplay files={parts} onShowPopup={onShowPopup} />
            </div>
        </div>
    );
};

const MessageBody: React.FC<MessageBodyProps> = ({ isUser, ...props }) => {

    if (isUser) {
        return (
            <UserMessageBody
                messageId={props.messageId}
                parts={props.parts}
                isMobile={props.isMobile}
                hasTouchInput={props.hasTouchInput}
                hasTextContent={props.hasTextContent}
                onCopyMessage={props.onCopyMessage}
                copiedMessage={props.copiedMessage}
                onShowPopup={props.onShowPopup}
                agentMention={props.agentMention}
            />
        );
    }

    return <AssistantMessageBody {...props} />;
};

export default React.memo(MessageBody);
