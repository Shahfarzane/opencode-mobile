
import type { NotificationsAPI, NotificationPayload } from '@openchamber/ui/lib/api/types';
import { isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';
import { safeInvoke } from '../lib/tauriCallbackManager';

export const requestInitialNotificationPermission = async (): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('[notifications] Notification permission not granted');
      }
    }
  } catch (error) {
    console.error('[notifications] Failed to request permission:', error);
  }
};

export const createDesktopNotificationsAPI = (): NotificationsAPI => ({
  async notifyAgentCompletion(payload?: NotificationPayload): Promise<boolean> {
    try {
      let granted = await isPermissionGranted();
      if (!granted) {
        const permission = await requestPermission();
        granted = permission === 'granted';
      }

      if (!granted) {
        console.warn('[notifications] Cannot send notification: Permission denied');
        return false;
      }

      await safeInvoke(
        'desktop_notify',
        { payload },
        {
          timeout: 5000,
          onCancel: () => {
            console.warn('[NotificationsAPI] Notify operation timed out');
          },
        },
      );
      return true;
    } catch (error) {
      console.error('[notifications] Failed to send notification:', error);
      return false;
    }
  },

  async canNotify(): Promise<boolean> {
    try {
      return await isPermissionGranted();
    } catch (error) {
      console.warn('[notifications] Failed to check notification permission:', error);
      return false;
    }
  }
});
