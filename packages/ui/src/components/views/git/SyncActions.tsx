import React from 'react';
import {
  RiRefreshLine,
  RiArrowDownLine,
  RiArrowUpLine,
  RiLoader4Line,
} from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type SyncAction = 'fetch' | 'pull' | 'push' | null;

interface SyncActionsProps {
  syncAction: SyncAction;
  onFetch: () => void;
  onPull: () => void;
  onPush: () => void;
  disabled: boolean;
}

export const SyncActions: React.FC<SyncActionsProps> = ({
  syncAction,
  onFetch,
  onPull,
  onPush,
  disabled,
}) => {
  const isDisabled = disabled || syncAction !== null;

  return (
    <div className="flex items-center gap-0.5">
      <Tooltip delayDuration={1000}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={onFetch}
            disabled={isDisabled}
          >
            {syncAction === 'fetch' ? (
              <RiLoader4Line className="size-4 animate-spin" />
            ) : (
              <RiRefreshLine className="size-4" />
            )}
            <span className="hidden sm:inline">Fetch</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>Fetch from remote</TooltipContent>
      </Tooltip>

      <Tooltip delayDuration={1000}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={onPull}
            disabled={isDisabled}
          >
            {syncAction === 'pull' ? (
              <RiLoader4Line className="size-4 animate-spin" />
            ) : (
              <RiArrowDownLine className="size-4" />
            )}
            <span className="hidden sm:inline">Pull</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>Pull changes</TooltipContent>
      </Tooltip>

      <Tooltip delayDuration={1000}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={onPush}
            disabled={isDisabled}
          >
            {syncAction === 'push' ? (
              <RiLoader4Line className="size-4 animate-spin" />
            ) : (
              <RiArrowUpLine className="size-4" />
            )}
            <span className="hidden sm:inline">Push</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>Push changes</TooltipContent>
      </Tooltip>
    </div>
  );
};
