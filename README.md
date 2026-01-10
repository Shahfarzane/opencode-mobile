# OpenCode Mobile

A native iOS app for [OpenCode](https://opencode.ai) - the AI coding agent. Built with Expo and React Native.

> **Based on [OpenChamber](https://github.com/btriapitsyn/openchamber)** - This project is a fork that adds a fully native iOS mobile app to the OpenChamber ecosystem.

## What is this?

This is a **native mobile client** for OpenCode that lets you interact with your AI coding agent from your iPhone or iPad. It connects to an OpenChamber web server running on your development machine, giving you the full OpenCode experience on mobile.

**Key highlights:**
- Real-time streaming responses with live message updates
- QR code pairing for instant server connection
- Face ID / Touch ID authentication
- Native iOS gestures and haptic feedback throughout
- Full terminal access from your phone
- Git operations with AI-generated commit messages
- Works alongside the CLI, web, and desktop versions

The entire project was built using AI coding agents (Claude via OpenCode) under human supervision - a proof of concept that AI can create production-quality software.

![OpenChamber Chat](docs/references/chat_example.png)

<details>
<summary>More screenshots</summary>

![Tool Output](docs/references/tool_output_example.png)
![Settings](docs/references/settings_example.png)
![Web Version](docs/references/web_version_example.png)
![Diff View](docs/references/diff_example.png)
![VS Code Extension](packages/vscode/extension.jpg)

<p>
<img src="docs/references/pwa_chat_example.png" width="45%" alt="PWA Chat">
<img src="docs/references/pwa_terminal_example.png" width="45%" alt="PWA Terminal">
</p>

</details>

## Why use OpenCode Mobile?

- **Cross-device continuity**: Start in TUI, continue on your phone, return to terminal - same session
- **Code on the go**: Review and interact with your AI coding agent from anywhere
- **Native iOS experience**: Not a web wrapper - real iOS app with haptic feedback and native gestures
- **Quick server pairing**: Scan a QR code to connect instantly, or use Cloudflare tunnels for remote access

## Features

### Core (all app versions)

- Integrated terminal
- Git operations with identity management and AI commit message generation
- Smart tool visualization (inline diffs, file trees, results highlighting)
- Rich permission cards with syntax-highlighted operation previews
- Per-agent permission modes (ask/allow/full) per session
- Multi-agent runs from a single prompt (isolated worktrees; Web/PWA + Desktop)
- Branchable conversations: start a new session from any assistant response
- Task tracker UI with live progress and tool summaries
- Model selection UX: favorites, recents, and configurable tool output density
- UI scaling controls (font size and spacing)
- Session auto-cleanup with configurable retention
- Memory optimizations with LRU eviction

### Mobile App (iOS)

- **Native iOS app** built with Expo and React Native
- Real-time streaming responses with live message updates
- QR code scanner for quick server pairing
- Face ID / Touch ID for secure authentication token storage
- Haptic feedback throughout the UI
- Edge swipe gesture to access session history
- Autocomplete for agents (`#`), files (`@`), and commands (`/`)
- Markdown rendering with syntax highlighting
- Tool call visualization (reasoning, tool execution, results)
- Light and dark theme support (follows system preference)
- iPad support with adaptive layouts

### Web / PWA

- Mobile-first UI with gestures and optimized terminal controls
- Self-serve web updates (no CLI required)
- Update and restart keeps previous server settings (port/password)
- Cloudflare Quick Tunnel support for easy remote access (`--try-cf-tunnel`)

### Desktop (macOS)

- Native macOS menu bar integration with app actions
- First-launch directory picker to minimize permission prompts

### VS Code Extension

- Editor-integrated file picker and click-to-open from tool output
- In-extension Settings access and theme mapping

## Getting Started

### Prerequisites

- [OpenCode CLI](https://opencode.ai) installed on your development machine
- Node.js 20+ (for the web server)
- Xcode 15+ (for iOS development)
- [EAS CLI](https://docs.expo.dev/eas/) (for production iOS builds)

### 1. Start the OpenChamber Server

The mobile app connects to an OpenChamber web server running on your computer:

```bash
# Install the server globally
bun add -g @openchamber/web    # or npm, pnpm, yarn

# Start the server
openchamber                          # Start on port 3000
openchamber --port 8080              # Custom port
openchamber --ui-password secret     # Password-protect UI
openchamber --try-cf-tunnel          # Cloudflare tunnel for remote access
```

### 2. Run the Mobile App

**Development:**

```bash
cd packages/mobile

# Install dependencies
bun install

# Start Expo development server
bun run start

# Run on iOS Simulator
bun run ios:simulator

# Run on physical device (requires dev build)
bun run ios
```

**Production Build with EAS:**

```bash
# Build for iOS (requires EAS CLI and Apple Developer account)
bun run build:production

# Preview build (TestFlight)
bun run build:preview
```

### 3. Connect to Your Server

1. Open the mobile app
2. Scan the QR code displayed in the OpenChamber web UI
3. Or manually enter the server URL and password

## Other Platforms

This repo focuses on the mobile app, but the full OpenChamber ecosystem includes:

- **VS Code Extension**: Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=fedaykindev.openchamber)
- **Desktop App (macOS)**: Download from [OpenChamber Releases](https://github.com/btriapitsyn/openchamber/releases)
- **Web/PWA**: Included when running `openchamber` server

## Tech Stack

| Package | Technologies |
|---------|--------------|
| **Shared** | TypeScript, Zustand |
| **UI** | React 19, Tailwind CSS v4, Radix UI |
| **Web** | Vite 7, Express, @opencode-ai/sdk |
| **Desktop** | Tauri, Rust |
| **Mobile** | Expo 54, React Native 0.81, Expo Router, Reanimated |
| **VS Code** | VS Code Extension API |

## Monorepo Structure

```
packages/
├── shared/     # Shared types, themes, and utilities
├── ui/         # React component library (web/desktop)
├── web/        # Web server and PWA
├── desktop/    # Tauri desktop app (macOS)
├── mobile/     # Expo/React Native iOS app
└── vscode/     # VS Code extension
```

## Architecture

The mobile app is built with a clean separation of concerns:

```
packages/mobile/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (tabs)/            # Tab navigation (Chat, Terminal, Git, Files)
│   ├── onboarding/        # QR scan and manual connection
│   └── settings/          # Settings screens with drill-down navigation
├── src/
│   ├── api/               # HTTP API adapters (sessions, git, terminal, etc.)
│   ├── components/        # 60+ React Native components
│   │   ├── chat/         # Message list, input, model picker
│   │   ├── settings/     # Settings primitives and detail views
│   │   └── ui/           # Base primitives (Button, Card, Input)
│   ├── hooks/            # Custom hooks (streaming, auth, gestures)
│   ├── stores/           # Zustand state management
│   └── theme/            # Flexoki color scheme, typography
└── ...
```

**Key technical decisions:**
- **Separate UI from web/desktop**: The mobile app has its own component library (doesn't use `@openchamber/ui`)
- **Uniwind for styling**: Tailwind-like classes for React Native via `className` prop
- **SSE for real-time**: Server-Sent Events for streaming chat and terminal output
- **SecureStore for auth**: Encrypted token storage with biometric unlock
- **LRU caching**: Offline message cache (50 sessions, 500 messages each, 7-day TTL)

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

For mobile-specific development, check out [packages/mobile/AGENTS.md](./packages/mobile/AGENTS.md) - a comprehensive guide for understanding the mobile app architecture.

## Acknowledgments

This is an independent project, not affiliated with the OpenCode team.

**Special thanks to:**

- [btriapitsyn/openchamber](https://github.com/btriapitsyn/openchamber) - The original OpenChamber project this fork is based on
- [OpenCode](https://opencode.ai) - For the excellent AI coding agent and extensible architecture
- [Expo](https://expo.dev) - React Native development platform that makes iOS development a joy
- [Flexoki](https://github.com/kepano/flexoki) - Beautiful color scheme by [Steph Ango](https://stephango.com/flexoki)

## Author

**Shahin Farzane** - [hey@nerd.ceo](mailto:hey@nerd.ceo) - [@Shahfarzane](https://github.com/Shahfarzane)

## License

MIT
