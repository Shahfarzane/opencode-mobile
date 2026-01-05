# Mobile App Updates for v1.4.3 Upstream Sync

This document outlines the features added in the web/desktop apps (v1.4.0 → v1.4.3) that should be implemented in the React Native mobile app for feature parity.

## Summary of Changes

| Version | Feature | Mobile Priority | Status |
|---------|---------|-----------------|--------|
| v1.4.1 | Model selector search | High | TODO |
| v1.4.1 | Revert on all messages | High | TODO |
| v1.4.1 | HEIC image support | Low | iOS native |
| v1.4.2 | Fork from user messages | High | TODO |
| v1.4.2 | Timeline navigation | Medium | TODO |
| v1.4.2 | Undo/Redo commands | Medium | TODO |
| v1.4.3 | Permission patterns display | Medium | TODO |
| v1.4.3 | SubAgent session navigation | Medium | TODO |

---

## High Priority Features

### 1. Model Selector Search

**Web Implementation:** `packages/ui/src/components/chat/ModelControls.tsx`

**Mobile Files to Update:**
- `src/components/chat/ModelPicker.tsx`

**Changes Needed:**
```typescript
// Add search state
const [searchQuery, setSearchQuery] = useState('');

// Filter models based on search
const filteredModels = useMemo(() => {
  if (!searchQuery.trim()) return models;
  const query = searchQuery.toLowerCase();
  return models.filter(model =>
    model.name?.toLowerCase().includes(query) ||
    model.id?.toLowerCase().includes(query)
  );
}, [models, searchQuery]);

// Add TextInput for search in the picker UI
<TextInput
  placeholder="Search models..."
  value={searchQuery}
  onChangeText={setSearchQuery}
  style={styles.searchInput}
/>
```

---

### 2. Revert on All User Messages

**Web Implementation:** `packages/ui/src/components/chat/message/MessageBody.tsx`

The web version removed the `!isFirstMessage` check to show revert on ALL user messages.

**Mobile Files to Update:**
- `src/components/chat/MessageActions.tsx` (or wherever message actions are rendered)

**Changes Needed:**
- Ensure revert button appears on every user message, including the first one
- The revert action should call the existing `revertToMessage` API

---

### 3. Fork from User Messages

**Web Implementation:**
- `packages/ui/src/components/chat/message/MessageBody.tsx`
- `packages/ui/src/stores/useSessionStore.ts` (forkFromUserMessage method)

**Mobile Files to Update:**
- `src/components/chat/MessageActions.tsx`
- `src/api/sessions.ts`

**New API Method:**
```typescript
// Add to sessions.ts
export async function forkSession(sessionId: string, messageId?: string): Promise<Session> {
  return apiPost(`/session/${sessionId}/fork`, { messageID: messageId });
}
```

**UI Changes:**
- Add "Fork" button/option to message actions menu
- When tapped, create new session branching from that message

---

## Medium Priority Features

### 4. Timeline Navigation

**Web Implementation:** `packages/ui/src/components/chat/TimelineDialog.tsx`

**Mobile Files to Create:**
- `src/components/TimelineSheet.tsx`

**Implementation Notes:**
- Use a bottom sheet (e.g., `@gorhom/bottom-sheet`) for mobile-friendly UX
- Show chronological list of user/assistant message pairs
- Allow tapping to scroll to that message
- Include fork and revert actions for each entry

**UI Pattern:**
```typescript
<BottomSheet>
  <FlatList
    data={turns}
    renderItem={({ item }) => (
      <TimelineEntry
        turn={item}
        onNavigate={() => scrollToMessage(item.id)}
        onFork={() => forkFromMessage(item.id)}
        onRevert={() => revertToMessage(item.id)}
      />
    )}
  />
</BottomSheet>
```

---

### 5. Undo/Redo Commands

**Web Implementation:** `packages/ui/src/stores/useSessionStore.ts`

The web version uses `/undo` and `/redo` commands. Mobile should provide button alternatives.

**Mobile Files to Update:**
- `src/app/(tabs)/chat.tsx` or header component

**Implementation:**
```typescript
// Add undo/redo buttons to chat header or as floating actions
const handleUndo = async () => {
  const lastUserMessage = messages.reverse().find(m => m.role === 'user');
  if (lastUserMessage) {
    await sessionsApi.revertToMessage(sessionId, lastUserMessage.id);
    refreshMessages();
  }
};

const handleRedo = async () => {
  await sessionsApi.unrevertSession(sessionId);
  refreshMessages();
};
```

---

### 6. Permission Patterns Display

**Web Implementation:** `packages/ui/src/components/chat/PermissionCard.tsx`

**Mobile Files to Update:**
- `src/components/chat/permission/PermissionCard.tsx`

**Changes Needed:**
```typescript
// Add pattern display to permission card
{permission.pattern && (
  <View style={styles.patternContainer}>
    <Text style={styles.patternLabel}>Pattern:</Text>
    {Array.isArray(permission.pattern)
      ? permission.pattern.map((p, i) => (
          <Text key={i} style={styles.patternCode}>{p}</Text>
        ))
      : <Text style={styles.patternCode}>{permission.pattern}</Text>
    }
  </View>
)}
```

---

### 7. SubAgent Session Navigation

**Web Implementation:** `packages/ui/src/components/chat/message/parts/ToolPart.tsx`

**Mobile Files to Update:**
- `src/components/chat/ToolOutput.tsx` (or equivalent)
- Session context/state management

**Changes Needed:**
```typescript
// In tool output component, check for subAgent session
{metadata?.subAgentSessionId && (
  <TouchableOpacity
    onPress={() => {
      // Switch to the subAgent session
      setCurrentSession(metadata.subAgentSessionId);
    }}
    style={styles.subAgentButton}
  >
    <Text>Open subAgent session</Text>
  </TouchableOpacity>
)}
```

---

## Low Priority / Platform-Handled Features

### HEIC Image Support

iOS handles HEIC images natively through the image picker. No additional implementation needed unless you want to display HEIC mime type in the UI.

### Multi-Run / Agent Manager

This is a desktop/web feature for running prompts across multiple models in parallel. Not recommended for mobile due to complexity and resource constraints.

### Platform Keyboard Shortcuts

Mobile doesn't use keyboard shortcuts. Touch gestures and button alternatives are used instead.

---

## API Changes Summary

New/updated endpoints to add to mobile API layer:

### New Endpoints

```typescript
// src/api/sessions.ts

// Fork a session from a specific message
export async function forkSession(sessionId: string, messageId?: string): Promise<Session> {
  return apiPost(`/session/${sessionId}/fork`, { messageID: messageId });
}

// Unrevert a session (redo)
export async function unrevertSession(sessionId: string): Promise<Session> {
  return apiPost(`/session/${sessionId}/unrevert`, {});
}
```

### Type Updates

```typescript
// Update Permission type
interface Permission {
  // ... existing fields
  pattern?: string | string[];  // NEW: Pattern for permission matching
}
```

---

## Testing Checklist

After implementing each feature:

- [ ] Model selector search filters correctly
- [ ] Revert button appears on first user message
- [ ] Fork creates new session with correct parent
- [ ] Timeline sheet opens and displays messages
- [ ] Timeline navigation scrolls to correct message
- [ ] Undo removes last message turn
- [ ] Redo restores undone message
- [ ] Permission patterns display correctly
- [ ] SubAgent session button switches sessions

---

## Files Reference

### Key Web/UI Files (Reference)
- `packages/ui/src/components/chat/ModelControls.tsx` - Model selector with search
- `packages/ui/src/components/chat/message/MessageBody.tsx` - Revert/Fork buttons
- `packages/ui/src/components/chat/TimelineDialog.tsx` - Timeline navigation
- `packages/ui/src/components/chat/PermissionCard.tsx` - Permission UI
- `packages/ui/src/stores/useSessionStore.ts` - Session state management
- `packages/ui/src/lib/opencode/client.ts` - API client

### Mobile Files (To Update)
- `src/components/chat/ModelPicker.tsx` - Add search
- `src/components/chat/MessageActions.tsx` - Add revert/fork
- `src/components/chat/permission/PermissionCard.tsx` - Add patterns
- `src/api/sessions.ts` - Add fork/unrevert APIs
- `src/app/(tabs)/chat.tsx` - Timeline/undo/redo integration
