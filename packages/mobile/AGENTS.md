# Mobile Package - AI Agent Reference

**Generated:** 2026-01-08 | **Files:** 209 | **Role:** Expo/React Native iOS app

## Overview

Native iOS app built with Expo 54 and React Native 0.81. Connects to OpenChamber web server via HTTP. Separate UI implementation from web/desktop (does not use @openchamber/ui).

## Structure

```
app/                       # Expo Router (file-based routing)
├── _layout.tsx           # Root: GestureHandler, SafeArea, Theme
├── index.tsx             # Entry/splash
├── (tabs)/               # Tab navigation
│   ├── _layout.tsx       # Tab container
│   ├── chat.tsx          # Main chat screen
│   ├── git.tsx           # Git operations
│   └── terminal.tsx      # Terminal view
├── onboarding/           # Server pairing flow
│   ├── scan.tsx          # QR code scanner
│   └── manual.tsx        # Manual URL entry
└── settings/             # Settings screens
    ├── index.tsx
    └── agents/[name].tsx # Dynamic routes

src/
├── components/           # React Native components
│   ├── chat/            # Chat UI
│   ├── settings/        # Settings UI
│   │   └── primitives/  # Reusable settings components
│   └── ui/              # Base primitives
├── hooks/               # Custom hooks
├── stores/              # Zustand stores
├── api/                 # HTTP API adapters
├── lib/                 # Utilities
│   ├── httpClient.ts    # XMLHttpRequest wrapper
│   ├── offlineCache.ts  # LRU message cache
│   └── storage.ts       # AsyncStorage + SecureStore
└── theme/               # Theme system
```

## Key Differences from Web/Desktop

| Aspect | Mobile | Web/Desktop |
|--------|--------|-------------|
| UI components | Own implementation | @openchamber/ui |
| Styling | Uniwind (Tailwind for RN) | Tailwind CSS v4 |
| Navigation | Expo Router | React Router |
| State | Own Zustand stores | Shared stores |
| Terminal | HTTP streaming | node-pty/portable-pty |
| Auth | SecureStore + biometric | Session cookies |

## Styling Patterns

### 1. Uniwind (Primary)
```tsx
<View className="flex-row items-center gap-2 px-3 py-2 rounded-xl" />
```

### 2. Tailwind Variants (Component variants)
```tsx
// component.styles.ts
import { tv } from 'tailwind-variants';
const container = tv({
  base: "relative",
  variants: { disabled: { true: "opacity-50" } }
});
```

### 3. StyleSheet (Complex/animated)
```tsx
const styles = StyleSheet.create({ container: { flex: 1 } });
```

## Adding Screens

### Tab screen
```tsx
// app/(tabs)/newscreen.tsx
export default function NewScreen() {
  return <View className="flex-1">...</View>;
}
```
Add tab in `app/(tabs)/_layout.tsx`.

### Settings screen
```tsx
// app/settings/newsetting.tsx
export default function NewSetting() { ... }
```
Add navigation in `app/settings/index.tsx`.

### Dynamic route
```tsx
// app/settings/items/[id].tsx
export default function ItemDetail() {
  const { id } = useLocalSearchParams();
}
```

## Native Modules Used

| Module | Purpose |
|--------|---------|
| `expo-camera` | QR code scanning |
| `expo-secure-store` | Encrypted token storage |
| `expo-haptics` | Tactile feedback |
| `expo-local-authentication` | Face ID / Touch ID |
| `expo-file-system` | Offline cache |
| `expo-clipboard` | Copy operations |

## Haptic Feedback Patterns

```tsx
import * as Haptics from 'expo-haptics';

// Button press
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Selection change
Haptics.selectionAsync();

// Success/Error
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

Used in 30+ files - add to all interactive elements.

## Offline/Caching

LRU cache in `lib/offlineCache.ts`:
- Max 50 sessions, 10 with full messages
- 500 messages per session
- 100MB total, 7-day TTL

```tsx
import { offlineCache } from '@/lib/offlineCache';
const cached = await offlineCache.getMessages(sessionId);
```

## Settings Primitives

Use components from `components/settings/primitives/`:
```tsx
import { SettingsScreen, SettingsSection, SettingsRow } from '@/components/settings/primitives';

<SettingsScreen title="My Settings">
  <SettingsSection title="General">
    <SettingsRow title="Option" onPress={...} />
  </SettingsSection>
</SettingsScreen>
```

## API Adapters

All in `src/api/`:
```tsx
import { sessionsApi, gitApi, terminalApi } from '@/api';

// HTTP calls to web server
const sessions = await sessionsApi.list();
```

Auth token injected automatically via `httpClient.ts`.

## Stores

| Store | Purpose |
|-------|---------|
| `useConnectionStore` | Server URL, auth token |
| `useTerminalStore` | Terminal sessions |

Persistence via SecureStore for sensitive data.

## Development

```bash
bun run start           # Expo dev server
bun run ios:simulator   # iOS Simulator
bun run ios             # Physical device
bun run build:ios       # EAS cloud build
```

## Build Profiles (eas.json)

| Profile | Bundle ID | Purpose |
|---------|-----------|---------|
| development | ceo.nerd.opencode.dev | Dev builds |
| preview | ceo.nerd.opencode.preview | TestFlight |
| production | ceo.nerd.opencode | App Store |

## Anti-Patterns

| Pattern | Fix |
|---------|-----|
| Inline styles for static | Use `className` (Uniwind) |
| Missing haptics | Add to all interactions |
| Ignoring safe areas | Use `useSafeAreaInsets()` |
| Blocking renders | Use `@shopify/flash-list` |
| Storing secrets in AsyncStorage | Use SecureStore |

## iOS-Specific

- Minimum iOS 14.0
- iPad support with adaptive layouts
- New Architecture enabled (`newArchEnabled: true`)
- Deep linking: `opencode://` scheme
