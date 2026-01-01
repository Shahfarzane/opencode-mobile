# @openchamber/desktop

Desktop application for the [OpenCode](https://opencode.ai) AI coding agent. Built with Tauri.

For the full project overview and screenshots, see the main repo:

https://github.com/btriapitsyn/openchamber

## Installation

Download from [Releases](https://github.com/btriapitsyn/openchamber/releases).

Currently available for macOS (Apple Silicon).

## Prerequisites

- [OpenCode CLI](https://opencode.ai) installed (`opencode`)
- OpenCode server running (`opencode serve`)

## Features

### Core UI

- Integrated terminal
- Git operations with identity management and AI commit message generation
- Smart tool visualization (inline diffs, file trees, results highlighting)
- Rich permission cards with syntax-highlighted operation previews
- Per-agent permission modes (ask/allow/full) per session
- Multi-agent runs from a single prompt (isolated worktrees)
- Branchable conversations: start a new session from any assistant response
- Task tracker UI with live progress and tool summaries
- Model selection UX: favorites, recents, and configurable tool output density
- UI scaling controls (font size and spacing)
- Session auto-cleanup with configurable retention
- Memory optimizations with LRU eviction

### Desktop (macOS)

- Native macOS menu bar integration with app actions
- First-launch directory picker to minimize permission prompts

## Development

```bash
git clone https://github.com/btriapitsyn/openchamber.git
cd openchamber
bun install
bun run desktop:dev
```

## License

MIT
