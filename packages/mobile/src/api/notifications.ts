import * as Haptics from "expo-haptics";

export interface NotificationPayload {
	title?: string;
	body?: string;
	tag?: string;
}

export interface NotificationsAPI {
	notifyAgentCompletion(payload?: NotificationPayload): Promise<boolean>;
	canNotify: () => boolean;
}

export const notificationsApi: NotificationsAPI = {
	async notifyAgentCompletion(): Promise<boolean> {
		try {
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		} catch {
			return false;
		}
		return false;
	},

	canNotify(): boolean {
		return false;
	},
};
