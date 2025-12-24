# OpenChamber VS Code Extension

OpenChamber inside VS Code: embeds the OpenChamber chat UI in the activity bar and connects it to the [OpenCode](https://opencode.ai) API.

![VS Code Extension](https://github.com/btriapitsyn/openchamber/raw/HEAD/packages/vscode/extension.jpg)

- Project overview + screenshots: https://github.com/btriapitsyn/openchamber

## Features

### OpenChamber UI

- Smart tool visualization (inline diffs, file trees, results highlighting)
- Rich permission cards with syntax-highlighted operation previews
- Per-agent permission modes (ask/allow/full) per session
- Branchable conversations: start a new session from any assistant response
- Task tracker UI with live progress and tool summaries
- Model selection UX (favorites, recents, and configurable tool output density)
- UI scaling controls (font size and spacing)

### VS Code Integration

- Chat UI in activity bar
- Session management with history
- File attachments via native VS Code file picker (10MB limit)
- Click-to-open files from tool output
- Auto-start `opencode` instance if not running
- Workspace-isolated OpenCode instances (different workspaces get unique instances)
- Adapts to VS Code's light/dark/high-contrast themes

## Commands

| Command | Description |
|---------|-------------|
| `OpenChamber: Focus on Chat View` | Focus chat panel |
| `OpenChamber: Restart API Connection` | Restart OpenCode API process |
| `OpenChamber: Show OpenCode Status` | Provide debug info useful for development or bug report |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `openchamber.apiUrl` | `http://localhost:47339` | OpenCode API server URL. Not required by default. Spawns its own process when not set. |

## Requirements

- OpenCode CLI installed and available in PATH (or set via `OPENCODE_BINARY` env var)
- VS Code 1.85.0+

## Development

```bash
pnpm install
pnpm -C packages/vscode run build            # build extension + webview
pnpm -C packages/vscode exec vsce package --no-dependencies
```

## Local Install

- After packaging: `code --install-extension packages/vscode/openchamber-*.vsix`
- Or in VS Code: Extensions panel → "Install from VSIX…" and select the file
