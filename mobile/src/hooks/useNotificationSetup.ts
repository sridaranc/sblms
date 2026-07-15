import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  registerForPushNotifications,
  scheduleMeetingReminder,
  scheduleFollowUpReminder,
  cancelAllScheduledNotifications,
} from '../services/notificationService';

const API_URL = 'http://192.168.1.8:5080';

export function useNotificationSetup() {
  const hasScheduledRef = useRef(false);

  useEffect(() => {
    registerForPushNotifications();
    scheduleUpcomingReminders();
    const interval = setInterval(scheduleUpcomingReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function scheduleUpcomingReminders() {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      await cancelAllScheduledNotifications();
      hasScheduledRef.current = true;

      const now = new Date();
      const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const [fuRes, mtRes] = await Promise.all([
        fetch(`${API_URL}/api/followups?pageSize=50`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()).catch(() => null),
        fetch(`${API_URL}/api/meetings?startDate=${now.toISOString()}&endDate=${endDate.toISOString()}&pageSize=50`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()).catch(() => null),
      ]);

      const followUps = fuRes?.data?.items || fuRes?.data || fuRes?.items || fuRes || [];
      const meetings = mtRes?.data?.items || mtRes?.data || mtRes?.items || mtRes || [];

      (Array.isArray(followUps) ? followUps : []).forEach((fu: any) => {
        if (fu.status === 'Completed' || fu.status === 'Cancelled' || !fu.scheduledDate) return;
        scheduleFollowUpReminder(fu.id, fu.type || fu.followUpType || 'Follow-up', fu.scheduledDate, fu.scheduledTime);
      });

      (Array.isArray(meetings) ? meetings : []).forEach((mt: any) => {
        if (mt.status === 'Completed' || mt.status === 'Cancelled' || !mt.meetingDate) return;
        scheduleMeetingReminder(mt.id, mt.title || mt.subject || 'Meeting', mt.meetingDate, mt.meetingTime);
      });
    } catch {}
  }
}
