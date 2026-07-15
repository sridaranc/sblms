import { useState, useEffect, useRef, useCallback } from 'react';
import { IconButton, Badge, Popover, Box, Typography, List, ListItem, ListItemAvatar, ListItemText, Avatar, Button, Divider, Chip, Alert } from '@mui/material';
import { Notifications, NotificationsActive, MarkEmailRead, ArrowForward, PersonAdd, EventNote, Assignment, TrendingUp, AccessTime, VolumeUp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetNotificationsQuery, useGetUnreadCountQuery, useMarkAsReadMutation, useMarkAllAsReadMutation } from '../api/api';

const notificationIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  lead: { icon: <PersonAdd />, color: '#667eea' },
  followup: { icon: <Assignment />, color: '#fa709a' },
  meeting: { icon: <EventNote />, color: '#a18cd1' },
  system: { icon: <TrendingUp />, color: '#00c9a7' },
};

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [880, 1100, 880, 1320];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.3);
    });
  } catch {}
}

function getUpcomingItems(followUps: any[], meetings: any[]) {
  const now = Date.now();
  const thirtyMin = 30 * 60 * 1000;
  const items: { type: 'followup' | 'meeting'; title: string; date: string; minutesAway: number; id: string }[] = [];

  (followUps || []).forEach((fu: any) => {
    if (fu.status === 'Completed' || fu.status === 'Cancelled') return;
    const dt = fu.scheduledDate ? new Date(`${fu.scheduledDate}T${fu.scheduledTime || '00:00'}`).getTime() : null;
    if (!dt) return;
    const diff = dt - now;
    if (diff > 0 && diff <= thirtyMin) {
      items.push({ type: 'followup', title: fu.type || fu.followUpType || 'Follow-up', date: fu.scheduledDate, minutesAway: Math.ceil(diff / 60000), id: fu.id });
    }
  });

  (meetings || []).forEach((mt: any) => {
    if (mt.status === 'Completed' || mt.status === 'Cancelled') return;
    const dt = mt.meetingDate ? new Date(`${mt.meetingDate}T${mt.meetingTime || '00:00'}`).getTime() : null;
    if (!dt) return;
    const diff = dt - now;
    if (diff > 0 && diff <= thirtyMin) {
      items.push({ type: 'meeting', title: mt.title || mt.subject || 'Meeting', date: mt.meetingDate, minutesAway: Math.ceil(diff / 60000), id: mt.id });
    }
  });

  return items.sort((a, b) => a.minutesAway - b.minutesAway);
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { data: notifications } = useGetNotificationsQuery({ pageNumber: 1, pageSize: 10 });
  const { data: unreadData } = useGetUnreadCountQuery(undefined);
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const [upcomingItems, setUpcomingItems] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastAlertRef = useRef<Set<string>>(new Set());
  const prevCountRef = useRef(0);

  const fetchUpcoming = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const now = new Date();
      const thirtyMinLater = new Date(now.getTime() + 30 * 60 * 1000);
      const params = new URLSearchParams({ pageSize: '50' });

      const [fuRes, mtRes] = await Promise.all([
        fetch(`/api/followups?${params}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
        fetch(`/api/meetings?startDate=${now.toISOString()}&endDate=${thirtyMinLater.toISOString()}&pageSize=50`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
      ]);

      const followUps = fuRes?.data?.items || fuRes?.data || fuRes?.items || fuRes || [];
      const meetings = mtRes?.data?.items || mtRes?.data || mtRes?.items || mtRes || [];
      const items = getUpcomingItems(Array.isArray(followUps) ? followUps : [], Array.isArray(meetings) ? meetings : []);
      setUpcomingItems(items);

      if (items.length > 0 && soundEnabled) {
        const newAlerts = items.filter(i => !lastAlertRef.current.has(i.id));
        if (newAlerts.length > 0) {
          playNotificationSound();
          newAlerts.forEach(i => lastAlertRef.current.add(i.id));
        }
      }
    } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    fetchUpcoming();
    const interval = setInterval(fetchUpcoming, 60000);
    return () => clearInterval(interval);
  }, [fetchUpcoming]);

  useEffect(() => {
    const currentCount = unreadData?.count || unreadData?.data?.count || 0;
    if (currentCount > prevCountRef.current && prevCountRef.current > 0 && soundEnabled) {
      playNotificationSound();
    }
    prevCountRef.current = currentCount;
  }, [unreadData, soundEnabled]);

  const unreadCount = unreadData?.count || unreadData?.data?.count || 0;
  const items = notifications?.data || notifications?.items || [];

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleMarkRead = async (id: string) => {
    try { await markAsRead(id).unwrap(); } catch {}
  };

  const handleMarkAllRead = async () => {
    try { await markAllAsRead(undefined).unwrap(); } catch {}
  };

  const getNotificationType = (title: string): string => {
    const lower = title.toLowerCase();
    if (lower.includes('lead')) return 'lead';
    if (lower.includes('follow')) return 'followup';
    if (lower.includes('meeting')) return 'meeting';
    return 'system';
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} sx={{ mr: 1 }}>
        <Badge badgeContent={unreadCount + upcomingItems.length} color="error" max={99}>
          {unreadCount > 0 ? <NotificationsActive sx={{ color: '#667eea' }} /> : <Notifications sx={{ color: '#667eea' }} />}
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 400, maxHeight: 520, borderRadius: '16px', mt: 1.5,
            boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(102,126,234,0.08), rgba(118,75,162,0.08))' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" fontWeight="700">Notifications</Typography>
            {unreadCount > 0 && <Chip label={`${unreadCount} new`} size="small" color="primary" />}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="small" onClick={() => setSoundEnabled(!soundEnabled)} sx={{ color: soundEnabled ? '#667eea' : '#ccc' }}>
              <VolumeUp fontSize="small" />
            </IconButton>
            {unreadCount > 0 && (
              <Button size="small" startIcon={<MarkEmailRead />} onClick={handleMarkAllRead} sx={{ textTransform: 'none' }}>
                Mark all read
              </Button>
            )}
          </Box>
        </Box>

        {upcomingItems.length > 0 && (
          <>
            <Alert severity="warning" icon={<AccessTime />} sx={{ mx: 2, mt: 1, borderRadius: '8px', fontSize: '0.8rem' }}>
              <Typography fontWeight="700" fontSize="0.8rem">Upcoming in 30 minutes</Typography>
              {upcomingItems.map((item) => (
                <Typography key={item.id} fontSize="0.75rem" sx={{ mt: 0.3 }}>
                  {item.type === 'meeting' ? '📅' : '📋'} {item.title} — in {item.minutesAway} min
                </Typography>
              ))}
            </Alert>
            <Divider sx={{ mt: 1 }} />
          </>
        )}

        <Divider />

        <List sx={{ p: 0, maxHeight: 340, overflow: 'auto' }}>
          {items.length === 0 ? (
            <ListItem>
              <ListItemText
                primary={<Typography variant="body2" color="text.secondary" textAlign="center">No notifications yet</Typography>}
              />
            </ListItem>
          ) : (
            items.map((notification: any) => {
              const type = getNotificationType(notification.title || '');
              const iconData = notificationIcons[type] || notificationIcons.system;
              return (
                <ListItem
                  key={notification.id}
                  onClick={() => { handleMarkRead(notification.id); handleClose(); }}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: notification.isRead ? 'transparent' : 'rgba(102,126,234,0.04)',
                    borderLeft: notification.isRead ? '3px solid transparent' : '3px solid #667eea',
                    '&:hover': { bgcolor: 'rgba(102,126,234,0.08)' },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: `${iconData.color}15`, color: iconData.color }}>
                      {iconData.icon}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={notification.isRead ? 400 : 600} noWrap>
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          {getTimeAgo(notification.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })
          )}
        </List>

        <Divider />

        <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center' }}>
          <Button
            endIcon={<ArrowForward />}
            onClick={() => { navigate('/notifications'); handleClose(); }}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#667eea' }}
          >
            View all notifications
          </Button>
        </Box>
      </Popover>
    </>
  );
}
