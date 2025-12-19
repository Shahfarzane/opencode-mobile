import React from 'react';
import {
  RiCheckboxLine,
  RiCheckboxBlankLine,
  RiRefreshLine,
  RiLoader4Line,
} from '@remixicon/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { GitStatus } from '@/lib/api/types';

interface ChangeRowProps {
  file: GitStatus['files'][number];
  checked: boolean;
  onToggle: () => void;
  onViewDiff: () => void;
  onRevert: () => void;
  isReverting: boolean;
  stats?: { insertions: number; deletions: number };
}

function describeChange(file: GitStatus['files'][number]) {
  const rawCode =
    file.index && file.index.trim() && file.index.trim() !== '?'
      ? file.index.trim()
      : file.working_dir && file.working_dir.trim()
        ? file.working_dir.trim()
        : file.index || file.working_dir || ' ';

  const symbol = rawCode.trim().charAt(0) || rawCode.trim() || '·';

  switch (symbol) {
    case '?':
      return { code: '?', color: 'var(--status-info)', description: 'Untracked file' };
    case 'A':
      return { code: 'A', color: 'var(--status-success)', description: 'New file' };
    case 'D':
      return { code: 'D', color: 'var(--status-error)', description: 'Deleted file' };
    case 'R':
      return { code: 'R', color: 'var(--status-info)', description: 'Renamed file' };
    case 'C':
      return { code: 'C', color: 'var(--status-info)', description: 'Copied file' };
    default:
      return { code: 'M', color: 'var(--status-warning)', description: 'Modified file' };
  }
}

export const ChangeRow: React.FC<ChangeRowProps> = ({
  file,
  checked,
  onToggle,
  onViewDiff,
  onRevert,
  isReverting,
  stats,
}) => {
  const descriptor = React.useMemo(() => describeChange(file), [file]);
  const indicatorLabel = descriptor.description ?? descriptor.code;
  const insertions = stats?.insertions ?? 0;
  const deletions = stats?.deletions ?? 0;

  return (
    <li>
      <div
        className="group flex items-center gap-2 px-3 py-1.5 hover:bg-sidebar/40 cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={onViewDiff}
        onKeyDown={(event) => {
          if (event.key === ' ') {
            event.preventDefault();
            onToggle();
          } else if (event.key === 'Enter') {
            event.preventDefault();
            onViewDiff();
          }
        }}
      >
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggle();
          }}
          aria-pressed={checked}
          aria-label={`Select ${file.path}`}
          className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {checked ? (
            <RiCheckboxLine className="size-4 text-primary" />
          ) : (
            <RiCheckboxBlankLine className="size-4" />
          )}
        </button>
        <span
          className="typography-micro font-semibold w-4 text-center uppercase"
          style={{ color: descriptor.color }}
          title={indicatorLabel}
          aria-label={indicatorLabel}
        >
          {descriptor.code}
        </span>
        <span
          className="flex-1 min-w-0 truncate typography-ui-label text-foreground"
          style={{ direction: 'rtl', textAlign: 'left' }}
          title={file.path}
        >
          {file.path}
        </span>
        <span className="shrink-0 typography-micro">
          <span style={{ color: 'var(--status-success)' }}>+{insertions}</span>
          <span className="text-muted-foreground mx-0.5">/</span>
          <span style={{ color: 'var(--status-error)' }}>-{deletions}</span>
        </span>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onRevert();
              }}
              disabled={isReverting}
              className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition-opacity"
              aria-label={`Revert changes for ${file.path}`}
            >
              {isReverting ? (
                <RiLoader4Line className="size-3.5 animate-spin" />
              ) : (
                <RiRefreshLine className="size-3.5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent sideOffset={8}>Revert changes</TooltipContent>
        </Tooltip>
      </div>
    </li>
  );
};
