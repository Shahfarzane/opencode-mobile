import { create } from 'zustand';
import { createOpencodeClient, type OpencodeClient } from '@opencode-ai/sdk';
import type { Session, Message, Part } from '@opencode-ai/sdk';

const getApiUrl = () => window.__VSCODE_CONFIG__?.apiUrl || 'http://localhost:47339';
const getWorkspaceFolder = () => window.__VSCODE_CONFIG__?.workspaceFolder || '';

const AUTO_DELETE_STORAGE_KEY = 'oc.vscode.autoDeleteLastRunAt';
const AUTO_DELETE_DEFAULT_DAYS = 30;
const AUTO_DELETE_KEEP_RECENT = 5;
const AUTO_DELETE_INTERVAL_MS = 24 * 60 * 60 * 1000;

let autoDeleteRunning = false;

const getLastActivity = (session: Session): number => {
  return session.time?.updated ?? session.time?.created ?? 0;
};

const readAutoDeleteLastRunAt = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(AUTO_DELETE_STORAGE_KEY);
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeAutoDeleteLastRunAt = (timestamp: number) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUTO_DELETE_STORAGE_KEY, String(timestamp));
  } catch {
    // ignore storage errors
  }
};

const buildAutoDeleteCandidates = (
  sessions: Session[],
  currentSessionId: string | null,
  cutoffDays: number,
  now = Date.now()
): string[] => {
  if (!Array.isArray(sessions) || cutoffDays <= 0) {
    return [];
  }

  const cutoffTime = now - cutoffDays * 24 * 60 * 60 * 1000;
  const sorted = [...sessions].sort((a, b) => getLastActivity(b) - getLastActivity(a));
  const protectedIds = new Set(sorted.slice(0, AUTO_DELETE_KEEP_RECENT).map((session) => session.id));

  return sorted
    .filter((session) => {
      if (!session?.id) return false;
      if (protectedIds.has(session.id)) return false;
      if (session.id === currentSessionId) return false;
      if (session.share) return false;
      const lastActivity = getLastActivity(session);
      if (!lastActivity) return false;
      return lastActivity < cutoffTime;
    })
    .map((session) => session.id);
};

interface MessageRecord {
  info: Message;
  parts: Part[];
}

interface ChatState {
  // Client
  client: OpencodeClient | null;
  isConnected: boolean;

  // Sessions
  sessions: Session[];
  currentSessionId: string | null;
  isLoadingSessions: boolean;
  autoDeleteEnabled: boolean;
  autoDeleteAfterDays: number;
  autoDeleteLastRunAt: number | null;

  // Messages
  messages: Map<string, MessageRecord[]>;
  isLoadingMessages: boolean;
  isSending: boolean;
  streamingSessionId: string | null;

  // Actions
  initialize: () => Promise<void>;
  loadAutoDeleteSettings: () => Promise<void>;
  runAutoCleanup: (sessionsOverride?: Session[]) => Promise<void>;
  loadSessions: () => Promise<void>;
  createSession: () => Promise<string | null>;
  selectSession: (sessionId: string) => Promise<void>;
  loadMessages: (sessionId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  abortMessage: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  client: null,
  isConnected: false,
  sessions: [],
  currentSessionId: null,
  isLoadingSessions: false,
  autoDeleteEnabled: false,
  autoDeleteAfterDays: AUTO_DELETE_DEFAULT_DAYS,
  autoDeleteLastRunAt: readAutoDeleteLastRunAt(),
  messages: new Map(),
  isLoadingMessages: false,
  isSending: false,
  streamingSessionId: null,

  initialize: async () => {
    const apiUrl = getApiUrl();
    const client = createOpencodeClient({ baseUrl: apiUrl });

    // Test connection
    try {
      await client.session.list({ query: { directory: getWorkspaceFolder() } });
      set({ client, isConnected: true });
      await get().loadAutoDeleteSettings();
      await get().loadSessions();
    } catch (error) {
      console.error('Failed to connect to OpenCode API:', error);
      set({ client, isConnected: false });
    }
  },

  loadAutoDeleteSettings: async () => {
    try {
      const response = await fetch('/api/config/settings', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        const lastRunAt = readAutoDeleteLastRunAt();
        set({ autoDeleteLastRunAt: lastRunAt });
        return;
      }

      const payload = await response.json().catch(() => ({}));
      const enabled = typeof payload.autoDeleteEnabled === 'boolean' ? payload.autoDeleteEnabled : false;
      const daysRaw = typeof payload.autoDeleteAfterDays === 'number'
        ? payload.autoDeleteAfterDays
        : Number(payload.autoDeleteAfterDays);
      const normalizedDays = Number.isFinite(daysRaw)
        ? Math.max(1, Math.min(365, daysRaw))
        : AUTO_DELETE_DEFAULT_DAYS;
      const lastRunAt = readAutoDeleteLastRunAt();

      set({
        autoDeleteEnabled: enabled,
        autoDeleteAfterDays: normalizedDays,
        autoDeleteLastRunAt: lastRunAt,
      });
    } catch {
      const lastRunAt = readAutoDeleteLastRunAt();
      set({ autoDeleteLastRunAt: lastRunAt });
    }
  },

  runAutoCleanup: async (sessionsOverride) => {
    const { client, autoDeleteEnabled, autoDeleteAfterDays, currentSessionId } = get();
    if (!client || !autoDeleteEnabled || autoDeleteAfterDays <= 0) {
      return;
    }
    if (autoDeleteRunning) {
      return;
    }

    const now = Date.now();
    const lastRunAt = readAutoDeleteLastRunAt();
    if (lastRunAt && now - lastRunAt < AUTO_DELETE_INTERVAL_MS) {
      set({ autoDeleteLastRunAt: lastRunAt });
      return;
    }

    const sessions = sessionsOverride ?? get().sessions;
    if (!sessions.length) {
      return;
    }

    const candidateIds = buildAutoDeleteCandidates(sessions, currentSessionId, autoDeleteAfterDays, now);
    if (candidateIds.length === 0) {
      writeAutoDeleteLastRunAt(now);
      set({ autoDeleteLastRunAt: now });
      return;
    }

    autoDeleteRunning = true;
    const deletedIds: string[] = [];

    try {
      for (const id of candidateIds) {
        try {
          const response = await client.session.delete({
            path: { id },
            query: { directory: getWorkspaceFolder() },
          });
          if (response.data) {
            deletedIds.push(id);
          }
        } catch {
          // ignore individual delete failures
        }
      }
    } finally {
      autoDeleteRunning = false;
      const finishedAt = Date.now();
      writeAutoDeleteLastRunAt(finishedAt);
      set({ autoDeleteLastRunAt: finishedAt });
    }

    if (deletedIds.length > 0) {
      set((state) => ({
        sessions: state.sessions.filter((session) => !deletedIds.includes(session.id)),
      }));
    }
  },

  loadSessions: async () => {
    const { client } = get();
    if (!client) return;

    set({ isLoadingSessions: true });
    try {
      const response = await client.session.list({ query: { directory: getWorkspaceFolder() } });
      const sessionsArray = Array.isArray(response.data) ? response.data : [];
      const sessions = sessionsArray.sort(
        (a, b) => (b.time?.created || 0) - (a.time?.created || 0)
      );
      set({ sessions, isLoadingSessions: false });
      void get().runAutoCleanup(sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      set({ isLoadingSessions: false });
    }
  },

  createSession: async () => {
    const { client } = get();
    if (!client) return null;

    try {
      const response = await client.session.create({ query: { directory: getWorkspaceFolder() }, body: {} });
      const session = response.data;
      if (!session) throw new Error('No session returned');
      await get().loadSessions();
      set({ currentSessionId: session.id });
      return session.id;
    } catch (error) {
      console.error('Failed to create session:', error);
      return null;
    }
  },

  selectSession: async (sessionId: string) => {
    set({ currentSessionId: sessionId });
    await get().loadMessages(sessionId);
  },

  loadMessages: async (sessionId: string) => {
    const { client, messages } = get();
    if (!client) return;

    set({ isLoadingMessages: true });
    try {
      const response = await client.session.messages({
        path: { id: sessionId },
        query: { directory: getWorkspaceFolder() }
      });
      const messageRecords: MessageRecord[] = (response.data || []).map((msg) => ({
        info: msg.info,
        parts: msg.parts || [],
      }));

      const newMessages = new Map(messages);
      newMessages.set(sessionId, messageRecords);
      set({ messages: newMessages, isLoadingMessages: false });
    } catch (error) {
      console.error('Failed to load messages:', error);
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (content: string) => {
    const { client, currentSessionId, messages } = get();
    if (!client || !currentSessionId) return;

    set({ isSending: true, streamingSessionId: currentSessionId });

    try {
      // Add user message optimistically
      const userMessage: MessageRecord = {
        info: {
          id: `temp-${Date.now()}`,
          sessionId: currentSessionId,
          role: 'user',
          parts: [{ type: 'text', text: content }],
          time: { created: Date.now() },
        } as Message,
        parts: [{ type: 'text', text: content }],
      };

      const currentMessages = messages.get(currentSessionId) || [];
      const newMessages = new Map(messages);
      newMessages.set(currentSessionId, [...currentMessages, userMessage]);
      set({ messages: newMessages });

      // Send message via session.prompt
      await client.session.prompt({
        path: { id: currentSessionId },
        query: { directory: getWorkspaceFolder() },
        body: {
          parts: [{ type: 'text', text: content }],
        },
      });

      // Reload messages to get the actual response
      await get().loadMessages(currentSessionId);
      await get().loadSessions(); // Update session title if changed
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      set({ isSending: false, streamingSessionId: null });
    }
  },

  abortMessage: async () => {
    const { client, currentSessionId } = get();
    if (!client || !currentSessionId) return;

    try {
      await client.session.abort({ path: { id: currentSessionId } });
    } catch (error) {
      console.error('Failed to abort:', error);
    }
    set({ isSending: false, streamingSessionId: null });
  },
}));
