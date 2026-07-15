import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { notificationsAPI } from '../../api/api';

const getIcon = (type: string) => {
  switch (type) {
    case 'LeadCreated': return 'person-add';
    case 'FollowUpDue': case 'FollowUp': return 'alarm';
    case 'MeetingScheduled': case 'Meeting': return 'videocam';
    case 'LeadConverted': case 'StatusChange': return 'checkmark-circle';
    default: return 'notifications';
  }
};

const getIconColor = (type: string) => {
  switch (type) {
    case 'LeadCreated': return '#667eea';
    case 'FollowUpDue': case 'FollowUp': return '#f59e0b';
    case 'MeetingScheduled': case 'Meeting': return '#8b5cf6';
    case 'LeadConverted': case 'StatusChange': return '#10b981';
    default: return '#94a3b8';
  }
};

const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationsAPI.getAll({ pageNumber: 1, pageSize: 50 }),
        notificationsAPI.getUnreadCount(),
      ]);
      setNotifications(notifRes.data.data || []);
      setUnreadCount(countRes.data.data?.unreadCount || 0);
    } catch (e) { console.error('Failed to fetch notifications:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const markAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const renderNotification = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.cardUnread]}
      onPress={() => !item.isRead && markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.type || item.typeName) + '15' }]}>
        <Icon name={getIcon(item.type || item.typeName)} size={20} color={getIconColor(item.type || item.typeName)} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator size="large" color="#667eea" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && <Text style={styles.subtitle}>{unreadCount} unread</Text>}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667eea" />}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Icon name="notifications-off-outline" size={60} color="#e2e8f0" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>You'll see updates about your leads and activities here</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 26, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#667eea', fontWeight: '500', marginTop: 2 },
  markAllBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#667eea' },
  markAllText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  listContent: { padding: 16 },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, alignItems: 'flex-start' },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: '#667eea' },
  iconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  cardMessage: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  cardTime: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#667eea', marginTop: 4 },
  emptyContainer: { flex: 1 },
  emptyView: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#94a3b8', marginTop: 16 },
  emptySubtext: { fontSize: 13, color: '#cbd5e1', textAlign: 'center', marginTop: 8 },
});

export default NotificationsScreen;
