import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { clientsAPI } from '../../api/api';

const statusColors: Record<string, string> = {
  Active: '#10b981', Inactive: '#94a3b8', Pending: '#f59e0b', Suspended: '#ef4444',
};

const ClientsListScreen = ({ navigation }: any) => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [clientsRes, statsRes] = await Promise.all([
        clientsAPI.getAll(),
        clientsAPI.getStats(),
      ]);
      setClients(clientsRes.data.data || []);
      setStats(statsRes.data.data);
    } catch (e) { console.error('Failed to fetch clients'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const filtered = clients.filter((c) =>
    !search || c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    c.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
    c.emailAddress?.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const getAvatarColor = (name: string) => {
    const colors = ['#667eea', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    return colors[name?.charCodeAt(0) % colors.length || 0];
  };

  const renderClient = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ClientDetail', { id: item.id })} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.companyName) }]}>
          <Text style={styles.avatarText}>{getInitials(item.companyName)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.companyName}</Text>
          <Text style={styles.cardSubtitle}>{item.contactPerson || '-'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: (statusColors[item.status] || '#94a3b8') + '15' }]}>
          <Text style={[styles.statusText, { color: statusColors[item.status] || '#94a3b8' }]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardDetails}>
        {item.emailAddress ? (
          <View style={styles.detailRow}><Icon name="mail-outline" size={12} color="#94a3b8" /><Text style={styles.detailText}>{item.emailAddress}</Text></View>
        ) : null}
        {(item.city || item.country) ? (
          <View style={styles.detailRow}><Icon name="location-outline" size={12} color="#94a3b8" /><Text style={styles.detailText}>{[item.city, item.country].filter(Boolean).join(', ')}</Text></View>
        ) : null}
      </View>
      <View style={styles.cardFooter}>
        {item.industry ? (
          <View style={styles.chip}><Icon name="business-outline" size={12} color="#667eea" /><Text style={styles.chipText}>{item.industry}</Text></View>
        ) : null}
        <View style={styles.chip}><Icon name="folder-outline" size={12} color="#8b5cf6" /><Text style={styles.chipText}>{item.projectCount || 0} Projects</Text></View>
        {item.lifetimeValue ? (
          <View style={styles.chip}><Icon name="cash-outline" size={12} color="#10b981" /><Text style={styles.chipText}>${item.lifetimeValue.toLocaleString()}</Text></View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  if (loading && clients.length === 0) return <ActivityIndicator size="large" color="#667eea" style={{ flex: 1, justifyContent: 'center' }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Clients</Text>
          <Text style={styles.subtitle}>{filtered.length} clients</Text>
        </View>
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#eef0ff' }]}>
            <Text style={[styles.statValue, { color: '#667eea' }]}>{stats.totalClients}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ecfdf5' }]}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.activeClients}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#f5f3ff' }]}>
            <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{stats.totalProjects}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Icon name="search" size={18} color="#94a3b8" />
        <TextInput style={styles.searchInput} placeholder="Search clients..." placeholderTextColor="#cbd5e1" value={search} onChangeText={setSearch} />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Icon name="close-circle" size={18} color="#94a3b8" /></TouchableOpacity> : null}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderClient}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667eea" />}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Icon name="business-outline" size={60} color="#e2e8f0" />
            <Text style={styles.emptyText}>No clients found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, height: 44, elevation: 1 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1e293b' },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  emptyContainer: { flex: 1 },
  emptyView: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  cardSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardDetails: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  detailText: { fontSize: 12, color: '#94a3b8', flex: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 8, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f8fafc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  chipText: { fontSize: 11, color: '#64748b', fontWeight: '500' },
});

export default ClientsListScreen;
