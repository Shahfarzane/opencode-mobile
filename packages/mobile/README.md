# OpenCode Mobile

Native iOS app for [OpenCode](https://opencode.ai) - the AI coding agent. Built with Expo 54 and React Native 0.81.

## Overview

OpenCode Mobile is a fully native iOS client that connects to an OpenChamber web server, giving you access to your AI coding agent from your iPhone or iPad. It's not a web wrapper - it's a purpose-built native app with 60+ custom React Native components.

**Key capabilities:**
- Chat with your AI coding agent with real-time streaming responses
- Full terminal access - run commands from your phone
- Git operations - view status, commit, push, pull, switch branches
- Browse and preview files in your project
- Configure AI providers, agents, and settings

## Quick Start

### Prerequisites

- An OpenChamber server running on your development machine
- Xcode 15+ (for iOS development)
- Node.js 20+ or Bun

### Development

```bash
# Install dependencies
bun install

# Start Expo dev server
bun run start

# Run on iOS Simulator
bun run ios:simulator

# Run on physical device
bun run ios
```

### Production Builds

```bash
# Development build (internal testing)
bun run build:dev

# Preview build (TestFlight)
bun run build:preview

# Production build (App Store)
bun run build:production
```

## Features

### Chat
- Real-time streaming responses via Server-Sent Events
- Markdown rendering with syntax highlighting
- Tool call visualization (reasoning, execution, results)
- Permission cards with operation previews
- Session management - create, rename, delete, fork conversations
- Model and agent selection with search
- Smart autocomplete: `#` for agents, `@` for files, `/` for commands
- File attachments via camera or document picker

### Terminal
- Full terminal access with real-time output streaming
- ANSI color support
- Special key buttons (Esc, Tab, Ctrl, Cmd, arrows)
- Session persistence

### Git
- View repository status and diff stats
- Browse branches and commits
- Create, switch, and manage branches
- Commit with AI-generated messages
- Push, pull, and other git operations
- Manage git identities

### Settings
- Connection management (server URL, authentication)
- Appearance (theme mode, font sizes)
- Session preferences (retention, input bar offset)
- Provider management (add/edit API providers)
- Agent and command configuration
- Skills management

## Architecture

```
app/                       # Expo Router (file-based routing)
├── _layout.tsx           # Root: GestureHandler, SafeArea, Theme
├── index.tsx             # Entry/splash with auth check
├── (tabs)/               # Tab navigation
│   ├── chat.tsx          # Main chat screen
│   ├── terminal.tsx      # Terminal interface
│   ├── git.tsx           # Git operations
│   └── files.tsx         # File browser
├── onboarding/           # Server pairing
│   ├── scan.tsx          # QR code scanner
│   └── manual.tsx        # Manual URL entry
└── settings/             # Full-screen settings
    └── [various screens]

src/
├── api/                  # HTTP API adapters
│   ├── sessions.ts       # Session CRUD, messages, streaming
│   ├── terminal.ts       # Terminal sessions
│   ├── git.ts           # Git operations
│   ├── files.ts         # File listing and search
│   └── ...
├── components/           # React Native components
│   ├── chat/            # Chat UI components
│   ├── settings/        # Settings screens and primitives
│   ├── ui/              # Base primitives (Button, Card, Input)
│   └── ...
├── hooks/               # Custom hooks
│   ├── useEventStream   # SSE for chat streaming
│   ├── useTerminalStream # SSE for terminal output
│   └── ...
├── stores/              # Zustand state management
│   ├── useConnectionStore # Server URL, auth token
│   └── useTerminalStore   # Terminal sessions
├── lib/                 # Utilities
│   ├── httpClient.ts    # XMLHttpRequest wrapper with retry
│   ├── offlineCache.ts  # LRU message cache
│   └── storage.ts       # AsyncStorage + SecureStore
└── theme/               # Theme system
    ├── colors.ts        # Flexoki color scheme
    └── typography.ts    # IBM Plex fonts
```

## Native Modules

| Module | Purpose |
|--------|---------|
| `expo-camera` | QR code scanning for server pairing |
| `expo-secure-store` | Encrypted storage for auth tokens |
| `expo-haptics` | Tactile feedback on interactions |
| `expo-local-authentication` | Face ID / Touch ID support |
| `expo-file-system` | Offline message caching |
| `expo-clipboard` | Copy operations |
| `expo-image-picker` | Photo/camera attachments |
| `expo-document-picker` | File attachments |

## Styling

The app uses three complementary styling approaches:

### 1. Uniwind (Primary)
Tailwind-like classes via the `className` prop:
```tsx
<View className="flex-row items-center gap-2 px-3 py-2 rounded-xl" />
```

### 2. Tailwind Variants (Component variants)
For complex component states:
```tsx
const button = tv({
  base: "px-4 py-2 rounded-lg",
  variants: {
    variant: {
      primary: "bg-primary",
      ghost: "bg-transparent"
    }
  }
});
```

### 3. StyleSheet (Complex/animated)
For performance-critical or animated styles:
```tsx
const styles = StyleSheet.create({
  container: { flex: 1 }
});
```

## State Management

### Connection Store
Manages server connection state with SecureStore persistence:
```tsx
import { useConnectionStore } from '@/stores/useConnectionStore';

const { serverUrl, authToken, isConnected, disconnect } = useConnectionStore();
```

### Terminal Store
Manages terminal sessions and output:
```tsx
import { useTerminalStore } from '@/stores/useTerminalStore';

const { sessions, addOutput, clearOutput } = useTerminalStore();
```

## API Integration

All API calls go through typed adapters in `src/api/`:

```tsx
import { sessionsApi, gitApi, terminalApi } from '@/api';

// List sessions
const sessions = await sessionsApi.list();

// Get git status
const status = await gitApi.status();

// Create terminal session
const session = await terminalApi.createSession({ directory: '/path' });
```

Auth tokens are automatically injected via `httpClient.ts`.

## Real-time Streaming

### Chat Streaming
```tsx
import { useEventStream } from '@/hooks/useEventStream';

const { messages, isStreaming, error } = useEventStream({
  sessionId,
  onMessage: (msg) => console.log(msg)
});
```

### Terminal Streaming
```tsx
import { useTerminalStream } from '@/hooks/useTerminalStream';

const { output, isConnected } = useTerminalStream({
  sessionId,
  onData: (data) => console.log(data)
});
```

## Offline Support

The app includes an LRU cache for offline message viewing:

```tsx
import { offlineCache } from '@/lib/offlineCache';

// Get cached messages
const messages = await offlineCache.getMessages(sessionId);

// Cache is automatically managed:
// - Max 50 sessions
// - 500 messages per session
// - 7-day TTL
// - 100MB total limit
```

## Build Profiles

| Profile | Bundle ID | Purpose |
|---------|-----------|---------|
| `development` | `ceo.nerd.opencode.dev` | Dev builds with Expo dev client |
| `development-simulator` | `ceo.nerd.opencode.dev` | Simulator-only dev builds |
| `preview` | `ceo.nerd.opencode.preview` | TestFlight distribution |
| `production` | `ceo.nerd.opencode` | App Store release |

## Scripts

```bash
bun run start           # Start Expo dev server
bun run start:clear     # Start with cache cleared
bun run ios             # Run on physical device
bun run ios:simulator   # Run on iOS Simulator
bun run type-check      # TypeScript type checking
bun run lint            # ESLint
bun run build:dev       # EAS development build
bun run build:preview   # EAS preview build
bun run build:production # EAS production build
```

## Platform Support

- **iOS**: 14.0+ (primary target)
- **iPad**: Supported with adaptive layouts
- **Android**: Not currently supported (contributions welcome!)

## Contributing

See [AGENTS.md](./AGENTS.md) for detailed development guidelines, including:
- How to add new screens
- Styling patterns and best practices
- Native module usage
- Haptic feedback patterns
- Anti-patterns to avoid

## License

MIT
