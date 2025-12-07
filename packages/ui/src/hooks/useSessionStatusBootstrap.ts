import React from 'react';
import { opencodeClient } from '@/lib/opencode/client';
import { useSessionStore } from '@/stores/useSessionStore';

type SessionStatusPayload = {
  type: 'idle' | 'busy' | 'retry';
  attempt?: number;
  message?: string;
  next?: number;
};

export const useSessionStatusBootstrap = () => {
  React.useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const statusMap = await opencodeClient.getSessionStatus();
        if (cancelled || !statusMap) return;

        const phases = new Map<string, 'idle' | 'busy' | 'cooldown'>();
        Object.entries(statusMap).forEach(([sessionId, raw]) => {
          if (!sessionId || !raw) return;
          const status = raw as SessionStatusPayload;
          const phase: 'idle' | 'busy' | 'cooldown' =
            status.type === 'busy' || status.type === 'retry' ? 'busy' : 'idle';
          phases.set(sessionId, phase);
        });

        if (phases.size > 0) {
          useSessionStore.setState({ sessionActivityPhase: phases });
        }
      } catch { /* ignored */ }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);
};

