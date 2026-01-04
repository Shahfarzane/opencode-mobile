export { filesApi } from "./files";
export type {
	DirectoryListResult,
	FileListEntry,
	FileSearchResult,
} from "./files";

export { gitApi } from "./git";
export type {
	GeneratedCommitMessage,
	GitBranch,
	GitBranchDetails,
	GitCommitResult,
	GitIdentityProfile,
	GitIdentitySummary,
	GitPullResult,
	GitPushResult,
	GitStatus,
	GitStatusFile,
} from "./git";

export { notificationsApi } from "./notifications";
export type { NotificationPayload, NotificationsAPI } from "./notifications";

export { permissionsApi } from "./permissions";
export type {
	DirectoryPermissionRequest,
	DirectoryPermissionResult,
	PermissionsAPI,
	StartAccessingResult,
} from "./permissions";

export { sessionsApi } from "./sessions";
export type { MessageInfo, MessagePart, Session, SessionMessage } from "./sessions";

export { settingsApi } from "./settings";
export type { SettingsLoadResult, SettingsPayload } from "./settings";

export { toolsApi } from "./tools";
export type { ToolsAPI } from "./tools";

export { terminalApi } from "./terminal";
export type {
	CreateTerminalOptions,
	TerminalSession,
	TerminalStreamEvent,
} from "./terminal";

export { agentsApi, isAgentBuiltIn, isAgentHidden } from "./agents";
export type { Agent, AgentConfig } from "./agents";

export { commandsApi, isCommandBuiltIn } from "./commands";
export type { Command, CommandConfig } from "./commands";

export { providersApi } from "./providers";
export type { Provider, Model } from "./providers";
