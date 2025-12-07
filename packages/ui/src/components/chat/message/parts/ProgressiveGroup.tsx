import React from 'react';
import { RiArrowDownSLine, RiArrowRightSLine, RiStackLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import type { TurnActivityPart } from '../../hooks/useTurnGrouping';
import type { ToolPart as ToolPartType } from '@opencode-ai/sdk';
import type { ContentChangeReason } from '@/hooks/useChatScrollManager';
import type { ToolPopupContent } from '../types';
import ToolPart from './ToolPart';
import ReasoningPart from './ReasoningPart';
import JustificationBlock from './JustificationBlock';
import { FadeInOnReveal } from '../FadeInOnReveal';

interface DiffStats {
    additions: number;
    deletions: number;
    files: number;
}

interface ProgressiveGroupProps {
    parts: TurnActivityPart[];
    isExpanded: boolean;
    onToggle: () => void;
    syntaxTheme: Record<string, React.CSSProperties>;
    isMobile: boolean;
    expandedTools: Set<string>;
    onToggleTool: (toolId: string) => void;
    onShowPopup: (content: ToolPopupContent) => void;
    onContentChange?: (reason?: ContentChangeReason) => void;
    isWorking: boolean;
    previewedPartIds: Set<string>;
    diffStats?: DiffStats;
}

const getGroupSummary = (parts: TurnActivityPart[]): string => {
    const counts = {
        tools: parts.filter((p) => p.kind === 'tool').length,
        reasoning: parts.filter((p) => p.kind === 'reasoning').length,
        justifications: parts.filter((p) => p.kind === 'justification').length,
    };

    const segments: string[] = [];
    if (counts.tools > 0) {
        segments.push(`${counts.tools} tool${counts.tools > 1 ? 's' : ''}`);
    }
    if (counts.reasoning > 0) {
        segments.push(`${counts.reasoning} reasoning`);
    }
    if (counts.justifications > 0) {
        segments.push(`${counts.justifications} justification${counts.justifications > 1 ? 's' : ''}`);
    }

    return segments.join(', ');
};

const sortPartsByTime = (parts: TurnActivityPart[]): TurnActivityPart[] => {
    return [...parts].sort((a, b) => {
        const aTime = typeof a.endedAt === 'number' ? a.endedAt : undefined;
        const bTime = typeof b.endedAt === 'number' ? b.endedAt : undefined;

        if (aTime === undefined && bTime === undefined) return 0;
        if (aTime === undefined) return 1;
        if (bTime === undefined) return -1;

        return aTime - bTime;
    });
};

const getToolConnections = (
    parts: TurnActivityPart[]
): Record<string, { hasPrev: boolean; hasNext: boolean }> => {
    const connections: Record<string, { hasPrev: boolean; hasNext: boolean }> = {};
    const toolParts = parts.filter((p) => p.kind === 'tool');

    toolParts.forEach((activity, index) => {
        const partId = activity.part.id;
        if (partId) {
            connections[partId] = {
                hasPrev: index > 0,
                hasNext: index < toolParts.length - 1,
            };
        }
    });

    return connections;
};

const ProgressiveGroup: React.FC<ProgressiveGroupProps> = ({
    parts,
    isExpanded,
    onToggle,
    syntaxTheme,
    isMobile,
    expandedTools,
    onToggleTool,
    onContentChange,
    isWorking,
    previewedPartIds,
    diffStats,
}) => {
    const previousExpandedRef = React.useRef<boolean | undefined>(isExpanded);

    React.useEffect(() => {
        if (previousExpandedRef.current === isExpanded) return;
        previousExpandedRef.current = isExpanded;
        onContentChange?.('structural');
    }, [isExpanded, onContentChange]);

    const displayParts = React.useMemo(() => {
        if (!isWorking) {

            return sortPartsByTime(parts);
        }

        if (isExpanded) {

            return sortPartsByTime(parts);
        }

        return sortPartsByTime(
            parts.filter((activity) => {
                const partId = activity.part.id;
                return partId && previewedPartIds.has(activity.id);
            })
        );
    }, [parts, isWorking, isExpanded, previewedPartIds]);

    const summary = getGroupSummary(displayParts);
    const toolConnections = getToolConnections(displayParts);

    if (displayParts.length === 0) {
        return null;
    }

    return (
        <FadeInOnReveal>
            <div className="my-1">
                {}
                <div
                    className={cn(
                        'group/tool flex items-center gap-2 pr-2 pl-px pt-0 pb-1.5 rounded-xl cursor-pointer'
                    )}
                    onClick={onToggle}
                >
                <div className="flex items-center gap-2 flex-shrink-0">
                    {}
                    <div className="relative h-3.5 w-3.5 flex-shrink-0">
                        {}
                        <div
                            className={cn(
                                'absolute inset-0 transition-opacity',
                                isExpanded && 'opacity-0',
                                !isExpanded && !isMobile && 'group-hover/tool:opacity-0'
                            )}
                        >
                            <RiStackLine className="h-3.5 w-3.5" />
                        </div>
                        {}
                        <div
                            className={cn(
                                'absolute inset-0 transition-opacity flex items-center justify-center',
                                isExpanded && 'opacity-100',
                                !isExpanded && isMobile && 'opacity-0',
                                !isExpanded && !isMobile && 'opacity-0 group-hover/tool:opacity-100'
                            )}
                        >
                            {isExpanded ? (
                                <RiArrowDownSLine className="h-3.5 w-3.5" />
                            ) : (
                                <RiArrowRightSLine className="h-3.5 w-3.5" />
                            )}
                        </div>
                    </div>
                    <span className="typography-meta font-medium">Activity</span>
                </div>

                {(summary || diffStats) && (
                    <div className="flex-1 min-w-0 typography-meta text-muted-foreground/70 flex items-center gap-2">
                        {summary && (
                            <span className="truncate block">{summary}</span>
                        )}
                        {diffStats && (diffStats.additions > 0 || diffStats.deletions > 0) && (
                            <span className="flex-shrink-0 leading-none">
                                <span className="text-[color:var(--status-success)]">
                                    +{Math.max(0, diffStats.additions)}
                                </span>
                                <span className="text-muted-foreground/50">/</span>
                                <span className="text-destructive">
                                    -{Math.max(0, diffStats.deletions)}
                                </span>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {}
            {isExpanded && (
                <div
                    className={cn(
                        'relative pr-2 pb-1 pt-1 pl-[1.4375rem]',
                        'before:absolute before:left-[0.4375rem] before:w-px before:bg-border/80 before:content-[""]',
                        'before:top-[-0.25rem] before:bottom-0'
                    )}
                >
                    {displayParts.map((activity, index) => {
                        const partId = activity.part.id || `group-part-${index}`;
                        const connection = toolConnections[partId];

                        switch (activity.kind) {
                            case 'tool':
                                return (
                                    <FadeInOnReveal key={partId}>
                                        <ToolPart
                                            part={activity.part as ToolPartType}
                                            isExpanded={expandedTools.has(partId)}
                                            onToggle={onToggleTool}
                                            syntaxTheme={syntaxTheme}
                                            isMobile={isMobile}
                                            onContentChange={onContentChange}
                                            hasPrevTool={connection?.hasPrev ?? false}
                                            hasNextTool={connection?.hasNext ?? false}
                                        />
                                    </FadeInOnReveal>
                                );

                            case 'reasoning':
                                return (
                                    <FadeInOnReveal key={partId}>
                                        <ReasoningPart
                                            part={activity.part}
                                            messageId={activity.messageId}
                                            onContentChange={onContentChange}
                                        />
                                    </FadeInOnReveal>
                                );

                            case 'justification':
                                return (
                                    <FadeInOnReveal key={partId}>
                                        <JustificationBlock
                                            part={activity.part}
                                            messageId={activity.messageId}
                                            onContentChange={onContentChange}
                                        />
                                    </FadeInOnReveal>
                                );

                            default:
                                return null;
                        }
                    })}
                </div>
            )}
            </div>
        </FadeInOnReveal>
    );
};

export default React.memo(ProgressiveGroup);
