# @openchamber/web

Web interface for the [OpenCode](https://opencode.ai) AI coding agent.

## Installation

```bash
npm add -g @openchamber/web

openchamber                          # Start on port 3000
openchamber --port 8080              # Custom port
openchamber --daemon                 # Background mode
openchamber --ui-password secret     # Password-protect UI
openchamber stop                     # Stop server
```

## Prerequisites

- [OpenCode CLI](https://opencode.ai) installed and running (`opencode serve`)
- Node.js 20+

## Features

- Integrated terminal
- Git operations with identity management and AI commit message generation
- Beautiful themes (Flexoki Light/Dark)
- Mobile-optimized with edge-swipe gestures
- Rich permission cards with syntax-highlighted operation previews
- Smart tool visualization (inline diffs, file trees, results highlighting)
- Per-agent permission mode control

## License

MIT
