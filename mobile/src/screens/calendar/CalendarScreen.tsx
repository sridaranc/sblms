import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { meetingsAPI } from '../../api/api';

const statusColors: Record<string, string> = {
  Scheduled: '#667eea', Completed: '#10b981', Cancelled: '#ef4444', Rescheduled: '#f59e0b', InProgress: '#8b5cf6',
};

const CalendarScreen = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMeetings = useCallback(async () => {
    try {
      const response = await meetingsAPI.getAll({ pageNumber: 1, pageSize: 50 });
      setMeetings(Array.isArray(response.data.data) ? response.data.data : (response.data.data?.items || []));
    } catch (e) { console.error('Failed to fetch meetings'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);
  const onRefresh = () => { setRefreshing(true); fetchMeetings(); };

  const handleComplete = (id: string) => {
    Alert.alert('Complete Meeting', 'Mark as completed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: async () => {
        try {
          await meetingsAPI.complete(id, 'Completed via mobile', 'Completed');
          setMeetings((prev) => prev.map((m) => m.id === id ? { ...m, status: 'Completed' } : m));
          Alert.alert('Success', 'Meeting completed');
        } catch { Alert.alert('Error', 'Failed to complete meeting'); }
      }},
    ]);
  };

  const safeDate = (d: string) => {
    if (!d) return { day: '-', month: '-', time: '-' };
    const dt = new Date(d.includes('Z') || d.includes('+') ? d : d + 'Z');
    if (isNaN(dt.getTime())) return { day: '-', month: '-', time: '-' };
    return {
      day: dt.getDate().toString(),
      month: dt.toLocaleDateString('en', { month: 'short' }),
      time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const renderMeeting = ({ item }: { item: any }) => {
    const date = safeDate(item.scheduledDate);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.dateBadge, { backgroundColor: (statusColors[item.status] || '#94a3b8') + '15' }]}>
            <Text style={[styles.dateDay, { color: statusColors[item.status] || '#94a3b8' }]}>{date.day}</Text>
            <Text style={[styles.dateMonth, { color: statusColors[item.status] || '#94a3b8' }]}>{date.month}</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.leadNumber || ''} • {item.customerName || 'No lead'}</Text>
            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <Icon name="time-outline" size={14} color="#94a3b8" />
                <Text style={styles.metaText}>{date.time}</Text>
              </View>
              {item.location ? (
                <View style={styles.metaItem}>
                  <Icon name="location-outline" size={14} color="#94a3b8" />
                  <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] || '#94a3b8' }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          {item.meetingUrl && (
            <View style={styles.footerItem}>
              <Icon name="link" size={12} color="#667eea" />
              <Text style={styles.urlText} numberOfLines={1}>{item.meetingUrl}</Text>
            </View>
          )}
          {item.status === 'Scheduled' && (
            <TouchableOpacity style={styles.completeBtn} onPress={() => handleComplete(item.id)}>
              <Icon name="checkmark-circle-outline" size={16} color="#10b981" />
              <Text style={styles.completeText}>Complete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading && meetings.length === 0) return <ActivityIndicator size="large" color="#667eea" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meetings</Text>
        <Text style={styles.subtitle}>{meetings.length} scheduled</Text>
      </View>
      <FlatList
        data={meetings}
        renderItem={renderMeeting}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667eea" />}
        contentContainerStyle={meetings.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Icon name="videocam-outline" size={60} color="#e2e8f0" />
            <Text style={styles.emptyText}>No meetings scheduled</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  emptyContainer: { flex: 1 },
  emptyView: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  dateBadge: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  dateDay: { fontSize: 20, fontWeight: '800' },
  dateMonth: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  cardSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#94a3b8' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  urlText: { fontSize: 11, color: '#667eea', flex: 1 },
  completeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#ecfdf5' },
  completeText: { fontSize: 12, color: '#10b981', fontWeight: '600' },
});

export default CalendarScreen;
