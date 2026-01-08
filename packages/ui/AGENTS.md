# UI Package - AI Agent Reference

**Generated:** 2026-01-08 | **Files:** 273 | **Role:** Shared React library for all runtimes

## Overview

Core UI library consumed by web, desktop, and VS Code. Contains all React components, Zustand stores, custom hooks, and OpenCode SDK wrapper. Mobile uses separate implementation.

## Structure

```
src/
├── components/          # React components
│   ├── chat/           # Chat UI (ChatInput, ChatMessage, ModelControls)
│   ├── sections/       # Settings pages (agents, providers, commands, skills)
│   ├── session/        # Session management (SessionSidebar, DirectoryTree)
│   ├── views/          # Full-screen views (GitView, TerminalView, DiffView)
│   ├── layout/         # Layout components (Header, Sidebar, MainLayout)
│   └── ui/             # Primitives (button, dialog, input, select)
├── stores/             # Zustand state management (30+ stores)
├── hooks/              # Custom React hooks (22 hooks)
├── lib/                # Utilities, SDK wrapper, theme system
├── contexts/           # React contexts (RuntimeAPI, Theme)
└── types/              # TypeScript definitions
```

## Where to Look

| Task | Location |
|------|----------|
| Add chat feature | `components/chat/` |
| Add settings section | `components/sections/` + add tab in `SettingsView.tsx` |
| Add view/page | `components/views/` + route in `App.tsx` |
| Add store | `stores/` with `use*Store.ts` naming |
| Add hook | `hooks/` with `use*.ts` naming |
| Modify API wrapper | `lib/opencode/client.ts` |
| Change theme colors | `../shared/src/themes/` (not in this package) |

## Key Patterns

### Settings Sections (Boilerplate)

Use shared components from `components/sections/shared/`:
```tsx
import { SettingsSidebarLayout, SettingsSidebarHeader, SettingsSidebarItem } from './shared';
import { SettingsPageLayout, SettingsSection } from './shared';
```

- `SettingsSidebarLayout` - Wrapper with scroll, header/footer slots
- `SettingsSidebarItem` - List item with selection, actions dropdown
- `SettingsPageLayout` - Centered max-w-3xl container
- `SettingsSection` - Section with title, description

### Zustand Stores

```tsx
// Standard pattern
export const useMyStore = create<MyState>()(
  devtools(
    persist(
      (set, get) => ({ /* state + actions */ }),
      { name: 'my-store', storage: createJSONStorage(() => safeStorage) }
    )
  )
);
```

**Circular dependency fix** - use window globals:
```tsx
// Instead of: import { useConfigStore } from './useConfigStore';
const configStore = window.__zustand_config_store__;
```

### Runtime API Access

```tsx
import { useRuntimeAPIs } from '@/contexts/RuntimeAPIProvider';

function MyComponent() {
  const { terminal, git, files } = useRuntimeAPIs();
  // Platform-agnostic API calls
}
```

### Typography (CRITICAL)

Never hardcode font sizes. Use semantic classes:
```tsx
<p className="typography-markdown">Body text</p>
<code className="typography-code">Code</code>
<span className="typography-meta">Metadata</span>
```

Or CSS variables: `--text-markdown`, `--text-code`, `--text-ui-label`, `--text-meta`, `--text-micro`

### Component Optimization

```tsx
// Memoize expensive renders
export const ChatMessage = React.memo(function ChatMessage(props) { ... });

// Use shallow selectors
const { sessions, activeSession } = useSessionStore(useShallow(s => ({
  sessions: s.sessions,
  activeSession: s.activeSession
})));
```

## Stores Reference

| Store | Purpose | Persisted |
|-------|---------|-----------|
| `messageStore` | Message streaming, memory management | Yes |
| `sessionStore` | Session list, selection, worktrees | Yes |
| `useConfigStore` | Config, providers, models | Yes |
| `useAgentsStore` | Agent CRUD, drafts | Yes |
| `contextStore` | Token counting, context usage | Yes |
| `useUIStore` | UI state (sidebar, overlays) | No |
| `useTerminalStore` | Terminal sessions | No |
| `useGitStore` | Git status, branches | No |

## Hooks Reference

| Hook | Purpose |
|------|---------|
| `useEventStream` | SSE connection, event routing |
| `useChatScrollManager` | Auto-scroll, viewport anchoring |
| `useRuntimeAPIs` | Platform-agnostic API access |
| `useKeyboardShortcuts` | Global keyboard shortcuts |
| `useEdgeSwipe` | Mobile gesture detection |

## Complexity Hotspots

| File | Lines | Complexity |
|------|-------|------------|
| `stores/messageStore.ts` | 2542 | Streaming, memory, dedup |
| `components/chat/ModelControls.tsx` | 2338 | Multi-feature UI |
| `hooks/useEventStream.ts` | 1821 | SSE, reconnection |
| `components/chat/ChatInput.tsx` | 1344 | Autocomplete, attachments |
| `lib/opencode/client.ts` | 1341 | SDK wrapper |

## Anti-Patterns

| Pattern | Fix |
|---------|-----|
| `as any` | Build narrow adapter interface |
| Direct store import causing circular dep | Use `window.__zustand_*` |
| Hardcoded font size | Use `typography-*` class |
| `await` during multi-run execution | Only await infrastructure |
| Empty catch block | Log or handle error |

## File Size Guidelines

- Components: <800 lines (extract sub-components)
- Stores: <1000 lines (extract utilities)
- Hooks: <500 lines (compose smaller hooks)

If exceeding limits, refactor by extracting reusable pieces.
