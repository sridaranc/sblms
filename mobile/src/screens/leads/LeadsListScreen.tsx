import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { leadsAPI } from '../../api/api';

const statusColors: Record<string, string> = {
  New: '#0ea5e9', FollowUp: '#f59e0b', Contacted: '#8b5cf6', MeetingScheduled: '#6366f1',
  ProposalSent: '#f97316', Negotiation: '#ef4444', Converted: '#10b981', Lost: '#ef4444', Closed: '#94a3b8',
};

const LeadsListScreen = ({ navigation }: any) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLeads = useCallback(async (pageNum: number = 1) => {
    try {
      const response = await leadsAPI.getAll({ pageNumber: pageNum, pageSize: 20 });
      const items = Array.isArray(response.data.data) ? response.data.data : (response.data.data?.items || []);
      if (pageNum === 1) { setLeads(items); } else { setLeads((prev) => [...prev, ...items]); }
      setHasMore(items.length === 20);
    } catch (e) { console.error('Failed to fetch leads'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchLeads(1); }, [fetchLeads]);
  const onRefresh = () => { setRefreshing(true); setPage(1); fetchLeads(1); };
  const loadMore = () => { if (hasMore && !loading) { const nextPage = page + 1; setPage(nextPage); fetchLeads(nextPage); } };

  const filtered = leads.filter((l) =>
    !search || l.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    l.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    l.emailAddress?.toLowerCase().includes(search.toLowerCase()) ||
    l.leadNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const renderLead = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('LeadDetail', { id: item.id })} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: (statusColors[item.status] || '#94a3b8') + '20' }]}>
          <Text style={[styles.avatarText, { color: statusColors[item.status] || '#94a3b8' }]}>{item.customerName?.[0] || '?'}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.customerName}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>{item.companyName || item.emailAddress || '-'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] || '#94a3b8' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Icon name="hash" size={12} color="#94a3b8" />
          <Text style={styles.cardMeta}>{item.leadNumber}</Text>
        </View>
        {item.value ? (
          <View style={styles.footerItem}>
            <Icon name="cash" size={12} color="#10b981" />
            <Text style={styles.cardValue}>${item.value.toLocaleString()}</Text>
          </View>
        ) : null}
        <View style={styles.footerItem}>
          <Icon name="pricetag" size={12} color="#94a3b8" />
          <Text style={styles.cardMeta}>{item.source?.replace('AI_', 'AI ') || '-'}</Text>
        </View>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CreateMeeting', { leadId: item.id })}>
          <Icon name="videocam" size={14} color="#8b5cf6" />
          <Text style={[styles.actionText, { color: '#8b5cf6' }]}>Meeting</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CreateFollowUp', { leadId: item.id })}>
          <Icon name="alarm" size={14} color="#f59e0b" />
          <Text style={[styles.actionText, { color: '#f59e0b' }]}>Follow-up</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leads</Text>
        <Text style={styles.subtitle}>{filtered.length} total</Text>
      </View>
      <View style={styles.searchContainer}>
        <Icon name="search" size={18} color="#94a3b8" />
        <TextInput style={styles.searchInput} placeholder="Search leads..." placeholderTextColor="#cbd5e1" value={search} onChangeText={setSearch} />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Icon name="close-circle" size={18} color="#94a3b8" /></TouchableOpacity> : null}
      </View>
      {loading && leads.length === 0 ? (
        <ActivityIndicator size="large" color="#667eea" style={styles.loader} />
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderLead}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667eea" />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Icon name="people-outline" size={60} color="#e2e8f0" />
              <Text style={styles.emptyText}>No leads found</Text>
            </View>
          }
          ListFooterComponent={loading && leads.length > 0 ? <ActivityIndicator size="small" color="#667eea" style={{ marginVertical: 16 }} /> : null}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, height: 44, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1e293b' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  cardSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 16 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMeta: { fontSize: 12, color: '#94a3b8' },
  cardValue: { fontSize: 12, fontWeight: '700', color: '#10b981' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  actionText: { fontSize: 12, fontWeight: '600' },
  emptyContainer: { flex: 1 },
  emptyView: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 12 },
});

export default LeadsListScreen;
