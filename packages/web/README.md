# @openchamber/web

Web/PWA interface for the [OpenCode](https://opencode.ai) AI coding agent.

This package installs the `openchamber` CLI that runs a local web server. For the full project overview and screenshots, see the main repo:

https://github.com/btriapitsyn/openchamber

## Installation

```bash
# Quick install (auto-detects your package manager)
curl -fsSL https://raw.githubusercontent.com/btriapitsyn/openchamber/main/scripts/install.sh | bash

# Or install manually
bun add -g @openchamber/web    # or npm, pnpm, yarn
```

## Usage

```bash
openchamber                          # Start on port 3000
openchamber --port 8080              # Custom port
openchamber --daemon                 # Background mode
openchamber --ui-password secret     # Password-protect UI
openchamber stop                     # Stop server
openchamber update                   # Update to latest version
```

## Prerequisites

- [OpenCode CLI](https://opencode.ai) installed (`opencode`)
- Node.js 20+

## Features

### Core UI

- Integrated terminal
- Git operations with identity management and AI commit message generation
- Smart tool visualization (inline diffs, file trees, results highlighting)
- Rich permission cards with syntax-highlighted operation previews
- Per-agent permission modes (ask/allow/full) per session
- Branchable conversations: start a new session from any assistant response
- Task tracker UI with live progress and tool summaries
- Model selection UX: favorites, recents, and configurable tool output density
- UI scaling controls (font size and spacing)
- Session auto-cleanup with configurable retention
- Memory optimizations with LRU eviction

### Web / PWA

- Mobile-first UI with gestures and optimized terminal controls
- Remote access from any device via browser (works alongside the OpenCode TUI)
- Self-serve updates (`openchamber update`) without reinstalling
- Update + restart keeps previous server settings (port/password)

## License

MIT
