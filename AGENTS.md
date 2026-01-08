# OpenChamber - AI Agent & Contributor Reference

**Generated:** 2026-01-08 | **Commit:** 6e613bc | **Branch:** main

## Overview

Web, desktop, and mobile interface for [OpenCode](https://opencode.ai) AI coding agent. Monorepo with 6 packages targeting 4 runtimes (web, desktop, VS Code, mobile).

## Tech Stack

| Layer | Technology |
|-------|------------|
| **UI** | React 19.1.1, Tailwind CSS v4, Radix UI, Zustand 5.0.8 |
| **Web** | Vite 7.1.2, Express 5.1.0, node-pty |
| **Desktop** | Tauri 2.9.4, Rust, portable-pty |
| **Mobile** | Expo 54, React Native 0.81, Expo Router |
| **VS Code** | Extension API, esbuild, Vite webview |
| **SDK** | @opencode-ai/sdk with SSE streaming |

## Structure

```
packages/
├── ui/          # Shared React components, stores, hooks (273 files)
├── web/         # Express server + CLI (27 files)
├── desktop/     # Tauri app with Rust backend (34 files)
├── vscode/      # VS Code extension (24 files)
├── mobile/      # Expo/React Native iOS app (209 files)
└── shared/      # Themes, typography, spacing (13 files)
heroui-native/   # Embedded React Native UI library (external)
```

## Where to Look

| Task | Location | Notes |
|------|----------|-------|
| Add UI component | `packages/ui/src/components/` | Auto-available to all runtimes |
| Add Zustand store | `packages/ui/src/stores/` | Use `persist()` middleware if needed |
| Add custom hook | `packages/ui/src/hooks/` | Prefix with `use*` |
| Modify themes | `packages/shared/src/themes/` | CSS vars generated automatically |
| Add API endpoint | `packages/web/server/index.js` | Express routes (84 total) |
| Add Tauri command | `packages/desktop/src-tauri/src/commands/` | Rust → TS adapter in `src/api/` |
| Add VS Code command | `packages/vscode/src/extension.ts` | Register in `package.json` |
| Add mobile screen | `packages/mobile/app/` | Expo Router file-based routing |

## Architecture

### Runtime Adapter Pattern

Each runtime implements `RuntimeAPIs` interface from `packages/ui/src/lib/api/types.ts`:

```
packages/web/src/api/       → HTTP fetch to Express
packages/desktop/src/api/   → Tauri IPC commands
packages/vscode/webview/api/→ Extension bridge messages
packages/mobile/src/api/    → HTTP fetch to remote server
```

UI components access via `useRuntimeAPIs()` hook - platform-agnostic.

### State Management

30+ Zustand stores in `packages/ui/src/stores/`:
- **Persisted**: contextStore, sessionStore, messageStore, useConfigStore, useAgentsStore
- **Global access**: `window.__zustand_*_store__` for cross-component access
- **Circular dep avoidance**: Dynamic imports or window globals

### Streaming Architecture

SDK-managed SSE with AsyncGenerator:
- 2 retry attempts, 500ms→8s exponential backoff
- Temp→real session ID swap (optimistic UI)
- `pendingAssistantParts` buffering
- Memory management: LRU eviction, viewport windowing

## Commands

```bash
bun run dev:web              # Web dev server
bun run desktop:dev          # Desktop with OpenCode CLI
bun run vscode:dev           # VS Code extension watch
bun run mobile:start         # Expo dev server

bun run build                # Build all packages
bun run type-check           # TypeScript validation
bun run lint                 # ESLint checks
```

## Anti-Patterns (FORBIDDEN)

| Pattern | Why |
|---------|-----|
| `as any`, `@ts-ignore`, `@ts-expect-error` | Type safety is mandatory |
| Hardcoded font sizes | Use semantic typography classes |
| Empty catch blocks | Always handle or log errors |
| Direct store imports causing circular deps | Use `window.__zustand_*` or dynamic imports |
| Config updates with directory param | Config is global scope |
| Awaiting model execution in multi-run | Blocks UI - only await infrastructure |

## Conventions

### Typography (CRITICAL)
Always use semantic classes - never hardcoded sizes:
- `typography-markdown`, `typography-code`, `typography-ui-label`
- CSS vars: `--text-markdown`, `--text-code`, `--text-meta`, `--text-micro`

### Tailwind CSS v4
Use `@import "tailwindcss"` syntax (not `@tailwind` directives).

### TypeScript
- `verbatimModuleSyntax: true` - explicit `import type` required
- `moduleResolution: "bundler"`
- Strict mode enabled

### Component Patterns
- Functional components only (no classes)
- `React.memo` for performance-critical components
- `cn()` utility for className composition (clsx + tailwind-merge)
- Settings sections use shared boilerplate in `packages/ui/src/components/sections/shared/`

## Complexity Hotspots

| File | Lines | Purpose |
|------|-------|---------|
| `ui/stores/messageStore.ts` | 2542 | Streaming, memory management, deduplication |
| `ui/components/chat/ModelControls.tsx` | 2338 | Model/agent selection with permissions |
| `ui/hooks/useEventStream.ts` | 1821 | SSE handling, reconnection, status tracking |
| `vscode/src/bridge.ts` | 1353 | API proxy, file/git operations |
| `ui/components/chat/ChatInput.tsx` | 1344 | Autocomplete, attachments, queue mode |
| `ui/lib/opencode/client.ts` | 1341 | OpenCode SDK wrapper |

## Dev Guidelines

### Before Committing
```bash
bun run type-check && bun run lint
```

### Adding Runtime-Specific Features
1. Extend `RuntimeAPIs` interface in `packages/ui/src/lib/api/types.ts`
2. Implement in each runtime's `api/` directory
3. Access via `useRuntimeAPIs()` hook

### Theme Changes
1. Modify `packages/shared/src/themes/`
2. CSS vars generated automatically by `cssGenerator.ts`
3. Test both light and dark themes

### Testing
No test infrastructure exists. Quality gates:
- TypeScript type checking
- ESLint rules
- Build-time compilation

## Notes

- **heroui-native/**: External React Native UI library embedded at root (not in packages/)
- **Web server is JavaScript**: `packages/web/server/index.js` is 4273 lines of JS (not TS)
- **Mobile doesn't share UI**: Separate implementation, uses @openchamber/shared for themes only
- **No CI/CD**: All builds are manual, see `scripts/` for release workflows

See package-specific AGENTS.md files for detailed documentation:
- `packages/ui/AGENTS.md` - Components, stores, hooks
- `packages/desktop/AGENTS.md` - Tauri/Rust patterns
- `packages/mobile/AGENTS.md` - Expo/React Native patterns
