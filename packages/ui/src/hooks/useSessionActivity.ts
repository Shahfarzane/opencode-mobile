

import React from 'react';
import { useSessionStore } from '@/stores/useSessionStore';

export type SessionActivityPhase = 'idle' | 'busy' | 'cooldown';

export interface SessionActivityResult {

  phase: SessionActivityPhase;

  isWorking: boolean;

  isBusy: boolean;

  isCooldown: boolean;
}

const IDLE_RESULT: SessionActivityResult = {
  phase: 'idle',
  isWorking: false,
  isBusy: false,
  isCooldown: false,
};

export function useSessionActivity(sessionId: string | null | undefined): SessionActivityResult {

  const phase = useSessionStore((state) => {
    if (!sessionId || !state.sessionActivityPhase) {
      return 'idle' as SessionActivityPhase;
    }
    return state.sessionActivityPhase.get(sessionId) ?? ('idle' as SessionActivityPhase);
  });

  return React.useMemo<SessionActivityResult>(() => {
    if (phase === 'idle') {
      return IDLE_RESULT;
    }
    const isBusy = phase === 'busy';
    const isCooldown = phase === 'cooldown';
    return {
      phase,
      isWorking: isBusy || isCooldown,
      isBusy,
      isCooldown,
    };
  }, [phase]);
}

export function useCurrentSessionActivity(): SessionActivityResult {
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  return useSessionActivity(currentSessionId);
}
