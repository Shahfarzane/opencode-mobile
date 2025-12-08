# Assistant Plan → New Execution Session Feature

## 1. Intent and Motivation

We want a feature that lets users take any **assistant message** from an existing session (the normal assistant answer rendered as markdown via Streamdown, with a copy button) and:

1. **Create a new session** (a fresh execution context).
2. Use that assistant message’s **text content** as the **first user message** in the new session.
3. Add a **synthetic text part** to that user message containing **meta instructions** explaining:
   - This message comes from another AI assistant/session.
   - If the content looks like an **implementation plan**, the new assistant’s job is to **implement** it.
   - If it looks like a **conclusion/summary**, the new assistant’s job is to **verify/confirm/refute** it.
   - The assistant must clearly state what it understands its task to be and **wait for user approval** before taking further actions.

Key point: the execution session should have a **fresh context window** but still have access to a **rich, detailed plan** that was crafted in a separate planning session, using the previous assistant’s output.

This supports a workflow where one session is used for **planning**, gathering context and drafting complex plans, and another is used for **focused execution** of that plan.


## 2. Current Architecture Overview

### 2.1 Session Creation

**Low-level Session API wrapper**

- File: `packages/ui/src/lib/opencode/client.ts`
- Class: `OpencodeService`
- Method:
  - `async createSession(params?: { parentID?: string; title?: string }): Promise<Session>`
    - Uses the OpenCode SDK client:
      - `client.session.list({ query: { directory? } })`
      - `client.session.create({ query: { directory? }, body: { parentID, title } })`
    - Includes `this.currentDirectory` in `query` when set.

**Session management store (optimistic + directory-aware)**

- File: `packages/ui/src/stores/sessionStore.ts`
- Store: `useSessionStore` (session management only)
- Method: `createSession: (title?: string, directoryOverride?: string | null) => Promise<Session | null>`
  - Computes `targetDirectory` from `directoryOverride`, `opencodeClient.getDirectory()`, and `useDirectoryStore.currentDirectory`.
  - Creates an **optimistic session**:
    - Temporary `id` (`temp_...`).
    - Title or fallback `"New session"`.
    - `directory: targetDirectory ?? null`.
    - Derived `projectID` from existing sessions if present.
  - Inserts optimistic session at the head of `sessions`, sets `currentSessionId` to the temp ID.
  - Syncs OpenCode directory:
    - `opencodeClient.setDirectory(targetDirectory)` if available.
  - Calls OpenCode API to create the real session:
    - `const createRequest = () => opencodeClient.createSession({ title });`
    - If `targetDirectory` is known, uses `opencodeClient.withDirectory(targetDirectory, createRequest)`.
  - On success, replaces the optimistic session with the real `Session`, updates `currentSessionId`, and persists directory → session mapping.
  - On failure, rolls back to the previous state and sets an error.

**Composed session store wrapper (UI-facing)**

- File: `packages/ui/src/stores/useSessionStore.ts`
- Store: `useSessionStore` (composed view over session/message/context/permission stores)
- Method:
  - `createSession: async (title?: string, directoryOverride?: string | null) => { ... }`
    - Delegates to `useSessionManagementStore.getState().createSession(title, directoryOverride)`.
    - If a session is returned, calls `setCurrentSession(result.id)` to activate it.

**Places where `createSession` is used**

- Keyboard shortcuts:
  - File: `packages/ui/src/hooks/useKeyboardShortcuts.ts`
  - `Ctrl+N` → creates a session and calls `initializeNewOpenChamberSession` with `agents`.
- Command palette:
  - File: `packages/ui/src/components/ui/CommandPalette.tsx`
  - "New Session" action → `createSession()` then `initializeNewOpenChamberSession`.
- Session sidebar:
  - File: `packages/ui/src/components/session/SessionSidebar.tsx`
  - `handleCreateSessionInGroup(directory)` → `createSession(undefined, directory)` then `initializeNewOpenChamberSession` and `setSessionDirectory`.


### 2.2 Sending User Messages & Building Parts

**Core send-message wrapper**

- File: `packages/ui/src/lib/opencode/client.ts`
- Method: `async sendMessage(params: { ... }): Promise<string>`
  - Inputs (simplified):
    - `id: string` (session id)
    - `providerID: string`
    - `modelID: string`
    - `text: string`
    - `agent?: string`
    - `files?: Array<{ type: 'file'; mime: string; filename?: string; url: string }>`
    - `messageId?: string` (client temp id, not sent to server)
    - `agentMentions?: Array<{ name: string; source?: { value: string; start: number; end: number } }>`
  - Behaviour:
    - Generates a client-only temp message ID if `messageId` is not provided.
    - Builds `parts: Array<TextPartInput | FilePartInput | AgentPartInputLite>`:
      - If `text` is non-empty, adds a **text part**:

        ```ts
        if (params.text && params.text.trim()) {
          parts.push({ type: 'text', text: params.text });
        }
        ```

      - For each file in `params.files`, adds a **file part**:

        ```ts
        parts.push({
          type: 'file',
          mime: file.mime,
          filename: file.filename,
          url: file.url,
        });
        ```

      - For `agentMentions`, adds an **agent part** (lightweight schema):

        ```ts
        parts.push({
          type: 'agent',
          name: first.name,
          ...(first.source ? { source: first.source } : {}),
        });
        ```

      - Throws if `parts.length === 0` (must have at least one text or file part).
    - Calls OpenCode API:

      ```ts
      this.client.session.prompt({
        path: { id: params.id },
        query: this.currentDirectory ? { directory: this.currentDirectory } : undefined,
        body: {
          model: { providerID: params.providerID, modelID: params.modelID },
          agent: params.agent,
          parts,
        },
      });
      ```

    - Returns the temporary message id; the real `messageID` comes via SSE.

**High-level send-message orchestration**

- File: `packages/ui/src/stores/messageStore.ts`
- Method: `sendMessage: async (content, providerID, modelID, agent?, currentSessionId?, attachments?, agentMentionName?)`
  - Resolves `sessionId` (throws if none).
  - Handles **slash commands** (`/init`, `/summarize`) via `apiClient.session.init` / `session.summarize`.
  - For normal chat messages:
    - Optionally expands `/command` via `opencodeClient.getCommandDetails`.
    - Tracks `lastUsedProvider`.
    - Marks session memory state as streaming (`isStreaming`, `streamStartTime`).
    - Creates an `AbortController` per session and stores it in `abortControllers`.
    - Maps `attachments` to `files` payload for `sendMessage`.
    - Calls `opencodeClient.sendMessage(...)`.
    - Clears attached files on success; handles network/timeout errors and gateway timeouts gracefully.

**UI entry point (ChatInput)**

- File: `packages/ui/src/components/chat/ChatInput.tsx`
- Handler: `handleSubmit`
  - Reads `currentProviderId`, `currentModelId`, `currentAgentName` from `useConfigStore`.
  - Normalizes the message text and runs `parseAgentMentions`.
  - Copies `attachedFiles` into a local array and clears them optimistically.
  - Calls `sendMessage(sanitizedText, currentProviderId, currentModelId, currentAgentName, attachmentsToSend, agentMentionName)`.
  - On error, may restore attachments and show a toast.


### 2.3 How Messages & Parts Are Stored and Updated

**Streaming parts and message creation**

- File: `packages/ui/src/stores/messageStore.ts`
- Core methods:
  - `_addStreamingPartImmediate(sessionId, messageId, part, role?, currentSessionId?)`
  - `addStreamingPart(sessionId, messageId, part, role?, currentSessionId?)` (batching for user role)

For **user messages**:

- If message exists and `role === 'user'`:
  - Finds or appends the `part` (after normalization).
  - Skips parts with `synthetic: true` (tracked via `(part as any).synthetic === true`).
- If no existing message:
  - Creates a new user message:

    ```ts
    const newUserMessage = {
      info: {
        id: messageId,
        sessionID: sessionId,
        role: 'user',
        clientRole: 'user',
        userMessageMarker: true,
        time: { created: Date.now() },
      },
      parts: [normalizedPart],
    };
    ```

  - Inserts it into the session’s message array and sorts by `time.created`.

**Synthetic parts**

- File: `packages/ui/src/lib/messages/synthetic.ts`

  ```ts
  const isSyntheticPart = (part: Part | undefined): boolean =>
    Boolean((part as { synthetic?: boolean }).synthetic);

  export const isFullySyntheticMessage = (parts: Part[] | undefined): boolean =>
    Array.isArray(parts) && parts.length > 0 && parts.every(isSyntheticPart);
  ```

- `MessageList` filters out messages where `isFullySyntheticMessage(message.parts)` is true, so purely synthetic messages don’t appear in the UI.


### 2.4 Assistant Message Rendering (Markdown + Copy)

**Top-level message component**

- File: `packages/ui/src/components/chat/ChatMessage.tsx`
- Determines `messageRole` (user vs assistant) and computes `visibleParts` via `filterVisibleParts`.
- Derives `messageTextContent` from **text parts**:
  - For users: combine text from user text parts.
  - For assistants: use either the summary body or the assistant text parts.
- Exposes `hasTextContent`, `onCopyMessage`, `copiedMessage`, and passes them into `MessageBody`.

**Message body & parts**

- File: `packages/ui/src/components/chat/message/MessageBody.tsx`
- For **user** messages (`UserMessageBody`):
  - Uses `UserTextPart` (Streamdown) to render the text.
  - Adds a floating message-level copy button at the top-right of the bubble using `onCopyMessage` / `copiedMessage`.
- For **assistant** messages (`AssistantMessageBody`):
  - Uses `AssistantTextPart` to render assistant text parts via `MarkdownRenderer` → `Streamdown`.
  - Orchestrates display of reasoning (`ReasoningPart`) and tool parts (`ToolPart`), plus progressive groups and summary bodies.
  - Currently, a summary body block (if present) may also get its own copy button.

**Markdown renderers (Streamdown)**

- Assistant text: `AssistantTextPart` → `MarkdownRenderer`:
  - File: `packages/ui/src/components/chat/message/parts/AssistantTextPart.tsx`
  - Uses `Streamdown` with custom `pre`/`table` wrappers and code/table controls (`MarkdownRenderer`).
- User text: `UserTextPart` uses `Streamdown` directly.
  - File: `packages/ui/src/components/chat/message/parts/UserTextPart.tsx`

This is exactly the assistant text that should be re-used as the user message body in the new session.


## 3. Desired Feature Behavior (Agreed Design)

### 3.1 Source of text

- Use **only the assistant text parts** that are rendered as normal markdown via `Streamdown` (assistant text, not tools, not reasoning/justification).
- The extracted text should be identical to what the user would copy via the existing copy button.

### 3.2 New session behavior

- **Title**: No custom title; new sessions should be created exactly as they are today (possibly using any existing backend defaults or heuristics).
- **Directory/worktree**: The new session must inherit the **directory/worktree** of the original session where the assistant message lives.
  - This is crucial so that execution happens in the same code location that the plan assumed.
- **Parent relationship**: The new session should have `parentID` set to the source session’s ID (so the relationship is explicit in the data model and UI).

### 3.3 Initial user message in the new session

- The first message in the new session is a **user** message containing two text parts:

  1. **Meta instructions** text part:
     - Contains a fixed text such as:

       > This message comes from an AI assistant in another session. The user wants you to respond according to its content: if it is an implementation plan, your task is to implement that plan; if it is a conclusion or summary, your task is to verify it, explain whether you agree or disagree, and correct it if needed. Always clearly state what you understand your task to be, and wait for the user's approval of your conclusions before taking any further actions.

     - **Must be invisible in the UI**, but **must be sent to the model**.
     - Implemented as a normal text part at the protocol level, but marked as `synthetic: true` client-side to hide it.

  2. **Plan text** text part:
     - Contains the assistant’s answer text from the original session (flattened from text parts).
     - **Visible** in the new session UI as the first user message content.

- The new assistant then responds to this user message according to the meta instructions.

### 3.4 UI affordance

- For **every assistant message** that has normal text content (at least one assistant text part), render a small **footer row** directly below the assistant message body.
- Footer layout:
  - One line high, aligned **to the right**.
  - Contains:
    - A **copy** button (moved from wherever the assistant copy control currently lives, so copy is consistently in this footer).
    - A new button, e.g. **“Start new session from this answer”**.
- The footer should **not** appear for messages that contain only tools or reasoning/justification parts and no assistant text.


## 4. Implementation Plan

### 4.1 Extend `sendMessage` to support a preface text part

We introduce an optional `prefaceText` for `OpencodeService.sendMessage`, allowing two text parts to be sent with one call:

1. A **preface/meta** text part (the meta instructions).
2. The **main user text** (the assistant plan or conclusion).

**Changes in `OpencodeService.sendMessage`**

- File: `packages/ui/src/lib/opencode/client.ts`
- Current signature (simplified):

  ```ts
  async sendMessage(params: {
    id: string;
    providerID: string;
    modelID: string;
    text: string;
    agent?: string;
    files?: Array<...>;
    messageId?: string;
    agentMentions?: Array<...>;
  }): Promise<string> { ... }
  ```

- New signature (conceptual):

  ```ts
  async sendMessage(params: {
    id: string;
    providerID: string;
    modelID: string;
    text: string;
    prefaceText?: string;  // NEW: optional meta instructions
    agent?: string;
    files?: Array<...>;
    messageId?: string;
    agentMentions?: Array<...>;
  }): Promise<string> { ... }
  ```

- Parts construction becomes:

  ```ts
  const parts: Array<TextPartInput | FilePartInput | AgentPartInputLite> = [];

  if (params.prefaceText && params.prefaceText.trim()) {
    parts.push({ type: 'text', text: params.prefaceText });
  }

  if (params.text && params.text.trim()) {
    parts.push({ type: 'text', text: params.text });
  }

  // existing file parts
  if (params.files && params.files.length > 0) {
    for (const file of params.files) {
      parts.push({
        type: 'file',
        mime: file.mime,
        filename: file.filename,
        url: file.url,
      });
    }
  }

  // existing agent mention part
  if (params.agentMentions && params.agentMentions.length > 0) {
    const [first] = params.agentMentions;
    if (first?.name) {
      parts.push({
        type: 'agent',
        name: first.name,
        ...(first.source ? { source: first.source } : {}),
      });
    }
  }

  if (parts.length === 0) {
    throw new Error('Message must have at least one part (text or file)');
  }
  ```

All existing calls to `sendMessage` continue to work as before; they simply don’t pass `prefaceText`.


### 4.2 Define and recognize the meta instructions text

We need a canonical meta instructions string and a way to recognize it in incoming parts so we can mark it as synthetic.

**New helper module**

- Suggested file: `packages/ui/src/lib/messages/executionMeta.ts`
- Contents (conceptual):

  ```ts
  export const EXECUTION_FORK_META_TEXT =
    "This message comes from an AI assistant in another session. The user wants you to respond according to its content: " +
    "if it is an implementation plan, your task is to implement that plan; " +
    "if it is a conclusion or summary, your task is to verify it, explain whether you agree or disagree, and correct it if needed. " +
    "Always clearly state what you understand your task to be, and wait for the user's approval of your conclusions before taking any further actions.";

  export const isExecutionForkMetaText = (text: string | null | undefined): boolean =>
    typeof text === 'string' && text.trim() === EXECUTION_FORK_META_TEXT.trim();
  ```

This provides one source of truth for both **sending** and **recognizing** the meta part.


### 4.3 Mark the meta text part as synthetic on the client

Since the protocol doesn’t know about `synthetic`, we mark the meta part client-side when we load or sync messages.

**During message load (`loadMessages`)**

- File: `packages/ui/src/stores/messageStore.ts`
- Spot: where `serverParts` is constructed in `loadMessages` (around `line ~344`).
- Change `serverParts` creation to:

  ```ts
  const serverParts = (Array.isArray(message.parts) ? message.parts : []).map((part) => {
    if (part?.type === 'text') {
      const raw = (part as any).text ?? (part as any).content ?? '';
      if (isExecutionForkMetaText(raw)) {
        return { ...part, synthetic: true } as Part;
      }
    }
    return part;
  });
  ```

**During message sync (`syncMessages`)**

- File: `packages/ui/src/stores/messageStore.ts`
- Spot: the analogous `serverParts` assignment in `syncMessages` (around `1775–1817`).
- Apply the same mapping there.

**(Optional) Streaming path**

- For robustness, we can also mark streaming parts in `_addStreamingPartImmediate`:
  - Compute `incomingText = extractTextFromPart(part)`.
  - If `isExecutionForkMetaText(incomingText)` then set `(part as any).synthetic = true` before normal handling.

This ensures:

- The meta part arrives as a `text` part in the client message; and
- `(part as any).synthetic === true` only for that meta part.


### 4.4 Hide synthetic parts from rendering

Right now we only hide whole messages that are **fully synthetic** (`isFullySyntheticMessage`). We also need to hide synthetic parts **within** mixed messages (meta + plan), so that the user doesn’t see the meta instructions.

We can do this in the **part filtering** layer used by `ChatMessage`.

- File: `packages/ui/src/components/chat/message/partUtils.ts`
- Function: `filterVisibleParts(parts, { includeReasoning })`
- Change to drop synthetic parts first:

  ```ts
  export const filterVisibleParts = (parts: Part[], options: { includeReasoning: boolean }): Part[] => {
    const nonSynthetic = parts.filter((part) => !(part as any)?.synthetic);

    // existing logic operates on `nonSynthetic` instead of `parts`,
    // e.g. filter out reasoning/tool parts based on options.
  };
  ```

Consequences:

- The meta text part (marked synthetic) is present in `Part[]` for the message → still sent to the model.
- It is **never rendered** in the UI (because all rendering paths go through `filterVisibleParts`).
- `isFullySyntheticMessage` still behaves correctly: a message with *only* the meta part would be hidden entirely, while a message with meta + plan text will remain visible but only show the plan.


### 4.5 Extend session creation to support `parentID`

We want to explicitly model the relationship between the planning session and the execution session.

**Session management store**

- File: `packages/ui/src/stores/sessionStore.ts`
- Method: `createSession`
- Extend the signature to accept `parentID?: string | null`:

  ```ts
  createSession: async (
    title?: string,
    directoryOverride?: string | null,
    parentID?: string | null,
  ) => { ... }
  ```

- In the section where `createRequest` is defined, include `parentID`:

  ```ts
  const createRequest = () => opencodeClient.createSession({
    title,
    parentID: parentID ?? undefined,
  });
  ```

- All existing call sites can continue calling `createSession(title?, directoryOverride?)`; `parentID` will be `undefined` by default.

**Composed session store wrapper**

- File: `packages/ui/src/stores/useSessionStore.ts`
- Method: `createSession`
- Mirror the new signature and pass `parentID` through to the management store:

  ```ts
  createSession: async (title?: string, directoryOverride?: string | null, parentID?: string | null) => {
    const result = await useSessionManagementStore
      .getState()
      .createSession(title, directoryOverride, parentID);

    if (result?.id) {
      await get().setCurrentSession(result.id);
    }
    return result;
  },
  ```

This allows us to create a new session with a specific `parentID` when forking from an assistant message.


### 4.6 Helper to flatten assistant text parts

We’ll reuse the same logic for **copying** and for **building the plan text** in the new session.

**New helper module**

- Suggested file: `packages/ui/src/lib/messages/messageText.ts`
- Function:

  ```ts
  import type { Part } from '@opencode-ai/sdk';

  export const flattenAssistantTextParts = (parts: Part[]): string => {
    const textParts = parts
      .filter((part): part is Part & { type: 'text'; text?: string; content?: string } => part.type === 'text')
      .map((part) => (part as any).text || (part as any).content || '')
      .map((text) => text.trim())
      .filter((text) => text.length > 0);

    const combined = textParts.join('\n');
    return combined.replace(/\n\s*\n+/g, '\n');
  };
  ```

- Use this helper in:
  - `ChatMessage` when computing `messageTextContent` for assistant messages (to keep copy text consistent), and
  - The new `createSessionFromAssistantMessage` flow described next.


### 4.7 New store method: `createSessionFromAssistantMessage`

We add a high-level convenience method that encapsulates the entire “fork this assistant answer into a new session” behavior.

**Location and signature**

- File: `packages/ui/src/stores/useSessionStore.ts`
- New method on `useSessionStore`:

  ```ts
  createSessionFromAssistantMessage: (sourceMessageId: string) => Promise<void>;
  ```

**Implementation steps**

1. **Find the source message and its session**

   - Use `useMessageStore.getState().messages` to scan for the message:

     ```ts
     const { messages } = useMessageStore.getState();
     let sourceEntry: { info: Message; parts: Part[] } | undefined;
     let sourceSessionId: string | undefined;

     messages.forEach((messageList, sessionId) => {
       const found = messageList.find((entry) => entry.info?.id === sourceMessageId);
       if (found && !sourceEntry) {
         sourceEntry = found;
         sourceSessionId = sessionId;
       }
     });
     ```

   - Validate:
     - The message exists.
     - `sourceEntry.info.role === 'assistant'`.
     - There is at least one assistant text part (`flattenAssistantTextParts(sourceEntry.parts)` is non-empty).

2. **Extract assistant plan text**

   - Use `flattenAssistantTextParts(sourceEntry.parts)` to obtain the assistant’s answer body.
   - If empty, show a toast (or no-op) since there is nothing meaningful to fork.

3. **Resolve directory and parentID**

   - `parentID` = `sourceSessionId`.
   - Use the existing directory resolution logic from `useSessionStore.setCurrentSession`:

     ```ts
     const smStore = useSessionManagementStore.getState();
     const directory = resolveSessionDirectory(
       smStore.sessions,
       sourceSessionId,
       smStore.getWorktreeMetadata,
     );
     ```

   - This yields the same effective directory/worktree we would use for the original session.

4. **Create the new session**

   - Call the extended `createSession` with `parentID`:

     ```ts
     const session = await useSessionManagementStore
       .getState()
       .createSession(
         /* title */ undefined,          // let normal behavior apply
         /* directoryOverride */ directory ?? null,
         /* parentID */ sourceSessionId ?? null,
       );

     if (!session) {
       // handle error (toast, etc.) and return
       return;
     }

     // useSessionStore.createSession wrapper will setCurrentSession(session.id)
     ```

5. **Send the initial user message to the new session**

   - Get provider/model/agent from configuration:

     - From `useConfigStore`: `currentProviderId`, `currentModelId`, `currentAgentName`.
     - Optionally, use `getLastMessageModel(sourceSessionId)` to match the last model used, but initial version can just use current selections.

   - Call `opencodeClient.sendMessage` with both `prefaceText` and `text`:

     ```ts
     await opencodeClient.sendMessage({
       id: session.id,
       providerID: currentProviderId,
       modelID: currentModelId,
       text: assistantPlanText,           // from flattenAssistantTextParts
       prefaceText: EXECUTION_FORK_META_TEXT,
       agent: currentAgentName,
     });
     ```

   - The server sees **two text parts** in one user message. On the client, we mark the preface part as `synthetic` and hide it; the plan text part remains visible.

6. **UX refinements (optional)**

   - After sending, ensure the UI is showing the new session (already handled by `createSession` wrapper) and scroll to bottom.
   - (Optional) briefly highlight the first user message in the new session to indicate the fork.


### 4.8 Assistant message footer: copy + “new session from this answer”

We add a small footer row below each assistant message that has text content, providing:

1. A message-level **copy** button (moved here for consistency).
2. A **“Start new session from this answer”** button wired to the new `createSessionFromAssistantMessage` method.

**Where to add the footer**

- File: `packages/ui/src/components/chat/message/MessageBody.tsx`
- Component: `AssistantMessageBody`

We already have access to:

- `hasTextContent`: whether there is any text to copy.
- `onCopyMessage` / `copiedMessage`: handlers and state for copy.
- `messageId`: ID of the current assistant message.

We can render a footer at the bottom of the assistant message body, inside the `px-3` container, after `renderedParts` and the optional summary block:

```tsx
{hasTextContent && (
  <div className="mt-2 mb-1 flex items-center justify-end gap-2">
    {/* Copy button */}
    {onCopyMessage && (
      <Button ... onClick={...uses onCopyMessage...}>
        {/* Icon toggling based on copiedMessage */}
      </Button>
    )}

    {/* Fork to new session button */}
    <Button ... onClick={handleForkClick}>
      Start new session from this answer
    </Button>
  </div>
)}
```

**Hooking up `createSessionFromAssistantMessage`**

- Within `AssistantMessageBody`:

  - Import `useSessionStore` and get the new method:

    ```ts
    const createSessionFromAssistantMessage = useSessionStore(
      (state) => state.createSessionFromAssistantMessage,
    );
    ```

  - Define `handleForkClick`:

    ```ts
    const handleForkClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        event.preventDefault();
        void createSessionFromAssistantMessage(messageId);
      },
      [createSessionFromAssistantMessage, messageId],
    );
    ```

- Conditions for showing the footer:
  - `hasTextContent` is true.
  - There is at least one assistant text part (e.g. `assistantTextParts.length > 0`).

This ensures the footer appears only under assistant answers that actually have visible text content (not under pure tool / reasoning messages).


## 5. Summary

This document captures:

- The **initial intent**: fork any assistant message into a new session where that message becomes the first user message (plus hidden meta instructions) to drive execution.
- The **current architecture** for sessions, message sending, parts construction, and assistant text rendering.
- A detailed **implementation plan** that:
  - Extends `sendMessage` with an optional `prefaceText`.
  - Introduces a canonical meta instructions text and marks its part as `synthetic` on the client.
  - Filters synthetic parts out of the rendered view while preserving them for the model.
  - Extends session creation to accept `parentID`.
  - Adds `createSessionFromAssistantMessage` to fork from a specific assistant message, inheriting directory/worktree and creating the initial user message with meta + plan text.
  - Adds a footer under assistant messages (copy + "start new session from this answer" button) to trigger the flow.

This plan is intended to be used later, in a fresh implementation session, to build the feature end-to-end without having to rediscover how sessions, messages, and parts work in the current codebase.