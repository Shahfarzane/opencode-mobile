export interface Permission {
	id: string;
	type: string;
	pattern?: string | string[];
	sessionID: string;
	messageID: string;
	callID?: string;
	title: string;
	metadata: Record<string, unknown>;
	time: {
		created: number;
	};
}

export type PermissionResponse = "once" | "always" | "reject";
