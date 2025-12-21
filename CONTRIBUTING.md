# Contributing to OpenChamber

## Development

```bash
git clone https://github.com/btriapitsyn/openchamber.git
cd openchamber
pnpm install

# Web development
pnpm run dev:web:full

# Desktop app (Tauri)
pnpm desktop:dev

# VS Code extension
pnpm vscode:build && code --extensionDevelopmentPath="$(pwd)/packages/vscode"

# Production build
pnpm run build
```

## Before Submitting

```bash
pnpm -r type-check   # Must pass
pnpm -r lint         # Must pass
pnpm -r build        # Must succeed
```

## Code Style

- Functional React components only
- TypeScript strict mode - no `any` without justification
- Use existing theme colors/typography - don't add new ones
- Components must support light and dark themes

## Pull Requests

1. Fork and create a branch
2. Make changes
3. Run validation commands above
4. Submit PR with clear description of what and why

## Project Structure

See [AGENTS.md](./AGENTS.md) for detailed architecture reference.

## Questions?

Open an issue.
