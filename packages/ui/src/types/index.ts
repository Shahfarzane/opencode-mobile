import type { Session, Message, Part, Provider, Agent as SdkAgent, PermissionConfig, PermissionRequest, PermissionActionConfig } from "@opencode-ai/sdk/v2";

export type { Session, Message, Part, Provider, PermissionConfig, PermissionRequest, PermissionActionConfig };

// Local permission action type - simple strings only for UI comparison
export type SimplePermissionAction = 'allow' | 'ask' | 'deny' | 'full';

// Bash permission can be a simple action or a pattern-based object
export type BashPermission = SimplePermissionAction | Record<string, SimplePermissionAction>;

// Local permission object type (non-union, always an object)
// This allows direct property access without type narrowing
export interface AgentPermissionObject {
  read?: SimplePermissionAction;
  edit?: SimplePermissionAction;
  glob?: SimplePermissionAction;
  grep?: SimplePermissionAction;
  list?: SimplePermissionAction;
  bash?: BashPermission;
  task?: SimplePermissionAction;
  external_directory?: SimplePermissionAction;
  todowrite?: SimplePermissionAction;
  todoread?: SimplePermissionAction;
  webfetch?: SimplePermissionAction;
  websearch?: SimplePermissionAction;
  codesearch?: SimplePermissionAction;
  lsp?: SimplePermissionAction;
  doom_loop?: SimplePermissionAction;
  skill?: SimplePermissionAction | Record<string, SimplePermissionAction>;
  [key: string]: SimplePermissionAction | BashPermission | Record<string, SimplePermissionAction> | undefined;
}

// Extended Agent type that includes deprecated tools property and object-based permission
// This provides backward compatibility with UI code that expects these properties
export type Agent = Omit<SdkAgent, 'permission'> & {
  permission: AgentPermissionObject;
  tools?: { [key: string]: boolean };
};

// Helper function to safely convert SDK Agent to local Agent type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toLocalAgent = (sdkAgent: any): Agent => sdkAgent as Agent;

export interface ChatState {
  sessions: Session[];
  currentSessionId: string | null;
  messages: Map<string, { info: Message; parts: Part[] }[]>;
  isLoading: boolean;
  error: string | null;
  streamingMessageIds: Map<string, string | null>;
}

export interface ConfigState {
  providers: Provider[];
  currentProviderId: string;
  currentModelId: string;
  defaultProvider: { [key: string]: string };
  isConnected: boolean;
}

export interface UIState {
  theme: "light" | "dark" | "system";
  isSidebarOpen: boolean;
  isSessionSwitcherOpen: boolean;
  isMobile: boolean;
  isAbortable: boolean;
}

export interface StreamEvent {
  type: string;
  properties: Record<string, unknown>;
}

export interface ModelOption {
  providerId: string;
  modelId: string;
  displayName: string;
}

export interface ModelMetadata {
  id: string;
  providerId: string;
  name?: string;
  tool_call?: boolean;
  reasoning?: boolean;
  temperature?: boolean;
  attachment?: boolean;
  modalities?: {
    input?: string[];
    output?: string[];
  };
  cost?: {
    input?: number;
    output?: number;
    cache_read?: number;
    cache_write?: number;
  };
  limit?: {
    context?: number;
    output?: number;
  };
  knowledge?: string;
  release_date?: string;
  last_updated?: string;
}
