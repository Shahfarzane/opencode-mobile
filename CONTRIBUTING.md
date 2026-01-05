# Contributing to OpenChamber

## Development

```bash
git clone https://github.com/btriapitsyn/openchamber.git
cd openchamber
bun install

# Web development
bun run dev:web:full

# Desktop app (Tauri)
bun run desktop:dev

# Mobile app (Expo/iOS)
bun run mobile:start          # Start Expo dev server
bun run mobile:ios:simulator  # Run on iOS Simulator
bun run mobile:ios            # Run on physical device

# VS Code extension
bun run vscode:build && code --extensionDevelopmentPath="$(pwd)/packages/vscode"

# Production build (all packages)
bun run build
```

## Mobile Development

The mobile app is built with Expo and React Native. It requires:

- Node.js 20+
- Xcode 15+ (for iOS development)
- iOS Simulator or physical iOS device
- EAS CLI (for production builds)

### Running Locally

```bash
cd packages/mobile

# Install dependencies
bun install

# Start Expo development server
bun run start

# Run on iOS Simulator
bun run ios:simulator

# Run on physical device
bun run ios
```

### Building for Production

```bash
# Build using EAS (requires Apple Developer account)
bun run build:ios

# Local build (requires Xcode)
bun run build:ios:local
```

### Type Checking

```bash
bun run mobile:type-check
```

## Before Submitting

```bash
bun run type-check   # Must pass
bun run lint         # Must pass
bun run build        # Must succeed
```

## Code Style

- Functional React components only
- TypeScript strict mode - no `any` without justification
- Use existing theme colors/typography - don't add new ones
- Components must support light and dark themes
- Mobile components should use the shared theme from `@openchamber/shared`

## Pull Requests

1. Fork and create a branch
2. Make changes
3. Run validation commands above
4. Submit PR with clear description of what and why

## Project Structure

```
packages/
├── shared/     # Shared types, themes, and utilities
├── ui/         # React component library (web/desktop)
├── web/        # Web server and PWA
├── desktop/    # Tauri desktop app (macOS)
├── mobile/     # Expo/React Native iOS app
└── vscode/     # VS Code extension
```

See [AGENTS.md](./AGENTS.md) for detailed architecture reference.

## Questions?

Open an issue.
