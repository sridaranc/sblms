import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  seconds: number,
  data?: Record<string, any>
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: data || {},
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}

export async function scheduleMeetingReminder(
  meetingId: string,
  title: string,
  meetingDate: string,
  meetingTime?: string
) {
  const meetingDateTime = new Date(`${meetingDate}T${meetingTime || '00:00'}`);
  const now = new Date();
  const thirtyMinBefore = new Date(meetingDateTime.getTime() - 30 * 60 * 1000);
  const secondsUntilReminder = Math.floor((thirtyMinBefore.getTime() - now.getTime()) / 1000);

  if (secondsUntilReminder <= 0) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📅 Meeting Reminder',
      body: `"${title}" starts in 30 minutes`,
      sound: true,
      data: { type: 'meeting', id: meetingId },
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntilReminder,
    },
  });
}

export async function scheduleFollowUpReminder(
  followUpId: string,
  type: string,
  scheduledDate: string,
  scheduledTime?: string
) {
  const fuDateTime = new Date(`${scheduledDate}T${scheduledTime || '00:00'}`);
  const now = new Date();
  const thirtyMinBefore = new Date(fuDateTime.getTime() - 30 * 60 * 1000);
  const secondsUntilReminder = Math.floor((thirtyMinBefore.getTime() - now.getTime()) / 1000);

  if (secondsUntilReminder <= 0) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📋 Follow-up Reminder',
      body: `"${type}" follow-up is due in 30 minutes`,
      sound: true,
      data: { type: 'followup', id: followUpId },
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntilReminder,
    },
  });
}

export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
