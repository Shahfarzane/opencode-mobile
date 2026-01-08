# Desktop Package - AI Agent Reference

**Generated:** 2026-01-08 | **Files:** 34 | **Role:** Tauri desktop app (macOS)

## Overview

Native macOS app using Tauri (Rust backend + Vite frontend). Manages OpenCode CLI lifecycle, provides native terminal (PTY), file system access, and Git operations.

## Structure

```
src/                        # TypeScript frontend
├── main.tsx               # Bootstrap, bridge setup, API injection
├── lib/
│   ├── bridge.ts          # Fetch/EventSource patching for IPC
│   └── tauriCallbackManager.ts  # IPC lifecycle management
└── api/                   # Runtime API adapters
    ├── index.ts           # Factory function
    ├── terminal.ts        # PTY via Tauri commands
    ├── git.ts             # Git via Tauri commands
    └── files.ts           # FS via Tauri commands

src-tauri/                 # Rust backend
├── src/
│   ├── main.rs           # App setup, menu, HTTP proxy (84k lines)
│   ├── opencode_manager.rs  # OpenCode CLI process manager
│   ├── commands/         # Tauri command modules
│   │   ├── terminal.rs   # PTY sessions (portable-pty)
│   │   ├── git.rs        # Git operations
│   │   ├── files.rs      # File system ops
│   │   └── permissions.rs # macOS directory access
│   └── *.rs              # Other modules
├── tauri.conf.json       # App configuration
└── Cargo.toml            # Rust dependencies
```

## Adding Tauri Commands

### 1. Rust side (`src-tauri/src/commands/`)

```rust
// In appropriate module (terminal.rs, git.rs, files.rs, etc.)
#[tauri::command]
pub async fn my_command(
    param: String,
    state: tauri::State<'_, DesktopRuntime>,
) -> Result<MyResponse, String> {
    // Implementation
    Ok(MyResponse { ... })
}
```

### 2. Register in `main.rs`

```rust
.invoke_handler(tauri::generate_handler![
    // ... existing commands
    commands::my_module::my_command,
])
```

### 3. TypeScript adapter (`src/api/`)

```typescript
// In appropriate adapter file
export async function myCommand(param: string): Promise<MyResponse> {
  return safeInvoke('my_command', { param });
}
```

### 4. Add to RuntimeAPIs (`src/api/index.ts`)

```typescript
export function createDesktopAPIs(): RuntimeAPIs {
  return {
    // ... existing
    myFeature: { myCommand },
  };
}
```

## Key Patterns

### IPC Bridge (`lib/bridge.ts`)

Patches `fetch` and `EventSource` to route through HTTP proxy:
```typescript
// Rewrites: /api/sessions → http://127.0.0.1:<port>/api/sessions
window.__OPENCHAMBER_DESKTOP_SERVER__ = { port, apiPrefix };
```

### Safe Invoke (`lib/tauriCallbackManager.ts`)

Wraps Tauri `invoke()` with timeout and cleanup:
```typescript
const result = await safeInvoke('command_name', { params }, 30000);
```

### OpenCode Manager (`opencode_manager.rs`)

- Spawns `opencode serve --port <port>` as child process
- Detects port from stdout via regex
- Health checks `/config` endpoint
- Graceful shutdown: SIGTERM → 3s wait → SIGKILL

### Terminal PTY (`commands/terminal.rs`)

- Uses `portable-pty` for cross-platform PTY
- SSE events via `app_handle.emit("terminal://<id>", data)`
- Resize support, force kill

### macOS Specifics

- **Private API**: Enabled for window effects (`macOSPrivateApi: true`)
- **Traffic lights**: Custom positioning for title bar
- **Menu bar**: Native menu with keyboard shortcuts
- **Vibrancy**: Sidebar material with corner radius

## Rust Dependencies

| Crate | Purpose |
|-------|---------|
| `tauri` | App framework |
| `portable-pty` | PTY sessions |
| `axum` | HTTP proxy server |
| `tokio` | Async runtime |
| `serde` | JSON serialization |
| `reqwest` | HTTP client |

## Commands Reference

| Command | Module | Purpose |
|---------|--------|---------|
| `create_terminal_session` | terminal | Start PTY |
| `terminal_input` | terminal | Send input to PTY |
| `terminal_resize` | terminal | Resize PTY |
| `git_status` | git | Get repo status |
| `git_commit` | git | Create commit |
| `list_directory` | files | List directory |
| `search_files` | files | Search files |
| `request_directory_access` | permissions | macOS picker |

## Development

```bash
bun run desktop:dev    # Tauri dev mode (hot reload)
bun run desktop:build  # Production build (DMG)
```

### Debugging

- **Rust logs**: `~/Library/Logs/ai.opencode.openchamber/openchamber.log`
- **Devtools**: Cmd+Option+I (enabled in production)
- **IPC stats**: `getTauriCallbackManager().getStats()`

## Anti-Patterns

| Pattern | Fix |
|---------|-----|
| Blocking main thread | Use `tokio::spawn` for async |
| Hardcoded paths | Use `expand_tilde_path()` |
| Missing cleanup | Use `CloseRequested` event |
| IPC without timeout | Use `safeInvoke()` wrapper |
