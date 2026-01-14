import { apiDelete, apiGet, apiPatch, apiPost } from "../lib/httpClient";

export interface MessageAttachment {
	name: string;
	type: string;
	base64?: string;
	uri?: string;
}

export interface Session {
	id: string;
	projectID?: string;
	directory?: string;
	parentID?: string;
	title?: string;
	summary?: {
		additions: number;
		deletions: number;
		files: number;
	};
	share?: {
		url: string;
	};
	time?: {
		created: number;
		updated: number;
	};
	// Legacy compatibility
	createdAt?: number;
	updatedAt?: number;
	path?: string;
}

export interface TokenBreakdown {
	input?: number;
	output?: number;
	reasoning?: number;
	cache?: { read?: number; write?: number };
}

export interface MessageInfo {
	id: string;
	role: "user" | "assistant";
	createdAt?: number;
	// Model/agent info for restoring session state
	providerID?: string;
	modelID?: string;
	mode?: string; // agent name
	// Token usage info
	tokens?: number | TokenBreakdown;
}

export interface MessagePart {
	type: string;
	text?: string;
	toolName?: string;
	state?: string;
	content?: string;
	[key: string]: unknown;
}

export interface SessionMessage {
	info: MessageInfo;
	parts: MessagePart[];
}

type SessionListResponse =
	| Session[]
	| { data?: Session[]; sessions?: Session[] }
	| Session;
type MessagesResponse =
	| SessionMessage[]
	| { data?: SessionMessage[]; messages?: SessionMessage[] };
type CreateResponse = { id: string } | { data?: { id: string } } | Session;

function unwrapArray<T>(response: unknown): T[] {
	if (Array.isArray(response)) {
		return response;
	}
	if (response && typeof response === "object") {
		const obj = response as Record<string, unknown>;
		if (Array.isArray(obj.data)) {
			return obj.data as T[];
		}
	}
	return [];
}

export const sessionsApi = {
	async list(): Promise<Session[]> {
		const response = await apiGet<SessionListResponse>(
			"/api/session",
			{},
			true,
		);
		return unwrapArray<Session>(response);
	},

	async get(sessionId: string): Promise<Session | null> {
		try {
			const response = await apiGet<Session | { data?: Session }>(
				`/api/session/${sessionId}`,
				{},
				true,
			);
			if (response && typeof response === "object") {
				const obj = response as Record<string, unknown>;
				if (typeof obj.id === "string") {
					return response as Session;
				}
				if (obj.data && typeof obj.data === "object") {
					return obj.data as Session;
				}
			}
			return null;
		} catch {
			return null;
		}
	},

	async create(): Promise<{ id: string }> {
		const response = await apiPost<CreateResponse>("/api/session", {}, true);
		if (response && typeof response === "object") {
			const obj = response as Record<string, unknown>;
			if (typeof obj.id === "string") {
				return { id: obj.id };
			}
			if (obj.data && typeof obj.data === "object") {
				const data = obj.data as Record<string, unknown>;
				if (typeof data.id === "string") {
					return { id: data.id };
				}
			}
		}
		throw new Error("Failed to create session: invalid response");
	},

	async getMessages(sessionId: string): Promise<SessionMessage[]> {
		const response = await apiGet<MessagesResponse>(
			`/api/session/${sessionId}/message`,
			{},
			true,
		);
		return unwrapArray<SessionMessage>(response);
	},

	async delete(sessionId: string): Promise<{ success: boolean }> {
		return apiDelete<{ success: boolean }>(
			`/api/session/${sessionId}`,
			{},
			true,
		);
	},

	async sendMessage(
		sessionId: string,
		text: string,
		providerID?: string,
		modelID?: string,
		agentName?: string,
		attachments?: MessageAttachment[],
	): Promise<void> {
		// Build parts array - files first, then text
		const parts: Array<Record<string, unknown>> = [];

		// Add file parts first
		if (attachments && attachments.length > 0) {
			for (const attachment of attachments) {
				if (attachment.base64) {
					// Create data URL format: data:mime;base64,...
					const dataUrl = `data:${attachment.type};base64,${attachment.base64}`;
					parts.push({
						type: "file",
						mime: attachment.type,
						filename: attachment.name,
						url: dataUrl,
					});
				}
			}
		}

		// Add text part
		if (text.trim()) {
			parts.push({ type: "text", text });
		}

		const body: Record<string, unknown> = { parts };

		if (providerID && modelID) {
			body.model = { providerID, modelID };
		}

		if (agentName) {
			body.agent = agentName;
		}

		await apiPost(`/api/session/${sessionId}/prompt_async`, body, true);
	},

	async respondToPermission(
		sessionId: string,
		permissionId: string,
		response: "once" | "always" | "reject",
	): Promise<void> {
		await apiPost(
			`/api/session/${sessionId}/permission/${permissionId}/respond`,
			{ response },
			true,
		);
	},

	async updateTitle(sessionId: string, title: string): Promise<Session> {
		return apiPatch<Session>(
			`/api/session/${sessionId}`,
			{ title },
			true,
		);
	},

	async share(sessionId: string): Promise<Session> {
		return apiPost<Session>(
			`/api/session/${sessionId}/share`,
			{},
			true,
		);
	},

	async unshare(sessionId: string): Promise<Session> {
		return apiDelete<Session>(
			`/api/session/${sessionId}/share`,
			{},
			true,
		);
	},

	async fork(sessionId: string, messageId: string): Promise<Session> {
		return apiPost<Session>(
			`/api/session/${sessionId}/fork`,
			{ messageId },
			true,
		);
	},

	async revert(sessionId: string, messageId?: string): Promise<void> {
		await apiPost(
			`/api/session/${sessionId}/revert`,
			messageId ? { messageId } : {},
			true,
		);
	},

	async unrevert(sessionId: string): Promise<void> {
		await apiPost(
			`/api/session/${sessionId}/unrevert`,
			{},
			true,
		);
	},
};
