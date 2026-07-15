import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { followUpsAPI } from '../../api/api';

const statusColors: Record<string, string> = {
  Pending: '#f59e0b', Completed: '#10b981', Cancelled: '#ef4444', Overdue: '#ef4444',
};

const FollowUpsScreen = () => {
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFollowUps = useCallback(async (pageNum: number = 1) => {
    try {
      const response = await followUpsAPI.getAll({ pageNumber: pageNum, pageSize: 15 });
      const items = Array.isArray(response.data.data) ? response.data.data : (response.data.data?.items || []);
      if (pageNum === 1) setFollowUps(items);
      else setFollowUps((prev) => [...prev, ...items]);
      setHasMore(items.length === 15);
    } catch (e) { console.error('Failed to fetch follow-ups'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchFollowUps(1); }, [fetchFollowUps]);
  const onRefresh = () => { setRefreshing(true); setPage(1); fetchFollowUps(1); };
  const loadMore = () => { if (hasMore && !loading) { const nextPage = page + 1; setPage(nextPage); fetchFollowUps(nextPage); } };

  const handleComplete = (id: string) => {
    Alert.alert('Complete Follow-up', 'Mark as completed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: async () => {
        try {
          await followUpsAPI.complete(id, 'Completed via mobile');
          setFollowUps((prev) => prev.map((f) => f.id === id ? { ...f, status: 'Completed' } : f));
          Alert.alert('Success', 'Follow-up completed');
        } catch { Alert.alert('Error', 'Failed to complete follow-up'); }
      }},
    ]);
  };

  const safeDate = (d: string) => {
    if (!d) return 'N/A';
    const dt = new Date(d.includes('Z') || d.includes('+') ? d : d + 'Z');
    return isNaN(dt.getTime()) ? 'N/A' : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (item: any) => {
    if (item.status === 'Completed' || item.status === 'Cancelled') return false;
    const scheduled = new Date(item.scheduledDate.includes('Z') || item.scheduledDate.includes('+') ? item.scheduledDate : item.scheduledDate + 'Z');
    return scheduled < new Date();
  };

  const renderFollowUp = ({ item }: { item: any }) => {
    const overdue = isOverdue(item);
    const status = overdue ? 'Overdue' : item.status;
    return (
      <View style={[styles.card, overdue && styles.cardOverdue]}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusDot, { backgroundColor: statusColors[status] || '#94a3b8' }]} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.notes || 'Follow-up'}</Text>
            <Text style={styles.cardSubtitle}>{item.leadNumber || ''} • {item.customerName || 'No lead'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: (statusColors[status] || '#94a3b8') + '15' }]}>
            <Text style={[styles.statusText, { color: statusColors[status] || '#94a3b8' }]}>{status}</Text>
          </View>
        </View>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Icon name="calendar-outline" size={14} color="#94a3b8" />
            <Text style={styles.metaText}>{safeDate(item.scheduledDate)}</Text>
          </View>
          {item.scheduledTime ? (
            <View style={styles.metaItem}>
              <Icon name="time-outline" size={14} color="#94a3b8" />
              <Text style={styles.metaText}>{item.scheduledTime}</Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Icon name="person-outline" size={14} color="#94a3b8" />
            <Text style={styles.metaText}>{item.userName || '-'}</Text>
          </View>
        </View>
        {item.status === 'Pending' && (
          <TouchableOpacity style={styles.completeBtn} onPress={() => handleComplete(item.id)}>
            <Icon name="checkmark-circle-outline" size={16} color="#10b981" />
            <Text style={styles.completeText}>Mark Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading && followUps.length === 0) return <ActivityIndicator size="large" color="#667eea" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Follow-ups</Text>
        <Text style={styles.subtitle}>{followUps.length} total</Text>
      </View>
      <FlatList
        data={followUps}
        renderItem={renderFollowUp}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667eea" />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={followUps.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Icon name="checkbox-outline" size={60} color="#e2e8f0" />
            <Text style={styles.emptyText}>No follow-ups found</Text>
          </View>
        }
        ListFooterComponent={loading && followUps.length > 0 ? <ActivityIndicator size="small" color="#667eea" style={{ marginVertical: 16 }} /> : null}
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
  cardOverdue: { borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  cardSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#94a3b8' },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: '#ecfdf5' },
  completeText: { fontSize: 13, color: '#10b981', fontWeight: '600' },
});

export default FollowUpsScreen;
