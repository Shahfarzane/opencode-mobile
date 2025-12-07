# OpenChamber - AI Agent & Contributor Reference

Technical reference for AI coding agents and human contributors working on this project.

## Core Purpose

Web and desktop interface for OpenCode AI coding agent. Provides cross-device continuity, remote accessibility, and a unified chat interface using the OpenCode API backend.

## Tech Stack

- **React 19.1.1**: Modern React with concurrent features
- **TypeScript 5.8.3**: Full type safety
- **Vite 7.1.2**: Build tool with HMR and proxy
- **Tailwind CSS v4.0.0**: Latest `@import` syntax
- **Zustand 5.0.8**: State management with persistence
- **@opencode-ai/sdk**: Official OpenCode SDK with typed endpoints and SSE
- **@remixicon/react**: Icon system
- **@radix-ui primitives**: Accessible component foundations

## Architecture Overview (Monorepo)

Workspaces:
- `packages/ui` - Shared UI components and stores
- `packages/web` - Web runtime, Express server, CLI
- `packages/desktop` - Tauri desktop app with native APIs

### Core Components (UI)
In `packages/ui/src/components/`: ChatContainer, MessageList, ChatMessage, StreamingAnimatedText, ChatInput, FileAttachment, ModelControls, PermissionCard, SessionList, SessionSwitcherDialog, DirectoryTree, DirectoryExplorerDialog, MainLayout, Header, Sidebar, SettingsDialog, AgentsPage, CommandsPage, GitIdentitiesPage, ProvidersPage, SessionsPage, SettingsPage, CommandPalette, HelpDialog, ConfigUpdateOverlay, ContextUsageDisplay, ErrorBoundary, MemoryDebugPanel, MobileOverlayPanel, ThemeDemo, ThemeSwitcher.

In `packages/ui/src/components/views/`: ChatView, GitView, DiffView, TerminalView.

In `packages/ui/src/components/terminal/`: TerminalViewport

### State Management (UI)
In `packages/ui/src/stores/`: ConfigStore, SessionStore, DirectoryStore, UIStore, FileStore, MessageStore, ContextStore, PermissionStore, AgentsStore, CommandsStore, GitIdentitiesStore, TerminalStore

### OpenCode SDK Integration (UI)
In `packages/ui/src/lib/opencode/`: client.ts wrapper around `@opencode-ai/sdk` with directory-aware API calls, SDK methods (session.*, message.*, agent.*, provider.*, config.*, project.*, path.*), AsyncGenerator SSE streaming (2 retry attempts, 500ms->8s backoff), automatic directory parameter injection.

In `packages/ui/src/hooks/`: useEventStream.ts for real-time SSE connection management.

### Web Runtime (server/CLI)
Express server and CLI in `packages/web`: API adapters in `packages/web/src/api`, server in `packages/web/server/index.js` (git/terminal/config), UI bundle imported from `@openchamber/ui`.

### Desktop Runtime (Tauri)
Native desktop app in `packages/desktop`: Tauri backend in `src-tauri/` (Rust), frontend API adapters in `src/api/` (settings, permissions, diagnostics, files, git, terminal, notifications, tools), bridge layer in `src/lib/` for Tauri IPC communication.

## Development Commands

### Code Validation
Always validate changes before committing:

```bash
pnpm -r type-check   # TypeScript validation
pnpm -r lint         # ESLint checks
pnpm -r build        # Production build
```

### Building
```bash
pnpm run build                 # Build all packages
pnpm run desktop:build         # Build desktop app
```

## Key Patterns

### Section-Based Navigation
Modular section architecture with dedicated pages and sidebars. Sections: Agents, Commands, Git Identities, Providers, Sessions, Settings. Independent state management and routing.

### File Attachments
Drag-and-drop upload with 10MB limit (`FileAttachment.tsx`), Data URL encoding, type validation with fallbacks, integrated via `useFileStore.addAttachedFile()`.

### Theme System
In `packages/ui/src/lib/theme/`: TypeScript-based themes (Flexoki Light and Dark), CSS variable generation, component-specific theming, Tailwind CSS v4 integration.

### Typography System
In `packages/ui/src/lib/`: Semantic typography with 6 CSS variables, theme-independent scales. **CRITICAL**: Always use semantic typography classes, never hardcoded font sizes.

### Streaming Architecture
SDK-managed SSE with AsyncGenerator, temp->real ID swap, pending-user guards, empty-response detection via `window.__opencodeDebug`.

## Development Guidelines

### Lint & Type Safety

- Never land code that introduces new ESLint or TypeScript errors
- Run `pnpm run lint` and `pnpm run type-check` before finalizing changes
- Adding `eslint-disable` requires justification in a comment explaining why typing is impossible
- Do **not** use `any` or `unknown` casts as escape hatches; build narrow adapter interfaces instead
- Refactors or new features must keep existing lint/type baselines green

### Theme Integration

- Check theme definitions before adding colors or font sizes to new components
- Always use theme-defined typography classes, never hardcoded font sizes
- Reference existing theme colors instead of adding new ones
- Ensure new components support both light and dark themes
- Use theme-generated CSS variables for dynamic styling

### Code Standards

- **Functional components**: Exclusive use of function components with hooks
- **Custom hooks**: Extract logic for reusability
- **Type-first development**: Comprehensive TypeScript usage
- **Component composition**: Prefer composition over inheritance

## Feature Implementation Map

### Directory & File System
`packages/ui/src/components/session/`: DirectoryTree, DirectoryExplorerDialog
`packages/ui/src/stores/`: DirectoryStore
Backend: `packages/web/server/index.js` with `listLocalDirectory()`, `getFilesystemHome()`

### Session Switcher
`SessionSwitcherDialog.tsx`: Collapsible date groups, mobile parity with MobileOverlayPanel, Git worktree and shared session chips, streaming indicators.

### Settings & Configuration
`packages/ui/src/components/sections/`: AgentsPage, CommandsPage, GitIdentitiesPage, ProvidersPage, SessionsPage, SettingsPage
Related stores: useAgentsStore, useCommandsStore, useConfigStore, useGitIdentitiesStore

### Git Operations
`packages/ui/src/components/views/`: GitView, DiffView
`packages/ui/src/stores/`: useGitIdentitiesStore
Backend: `packages/ui/src/lib/gitApi.ts` + `packages/web/server/index.js` (simple-git wrapper)

### Terminal
`packages/ui/src/components/views/`: TerminalView
`packages/ui/src/components/terminal/`: TerminalViewport (Xterm.js with FitAddon)
`packages/ui/src/stores/`: useTerminalStore
Backend: `packages/web/server/index.js` (node-pty wrapper with SSE)

### Theme System
`packages/ui/src/lib/theme/`: themes (2 definitions), cssGenerator, syntaxThemeGenerator
`packages/ui/src/components/providers/`: ThemeProvider

### Mobile & UX
`packages/ui/src/components/ui/`: MobileOverlayPanel
`packages/ui/src/hooks/`: useEdgeSwipe, useChatScrollManager
