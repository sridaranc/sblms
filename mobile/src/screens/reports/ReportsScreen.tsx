import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { reportsAPI } from '../../api/api';

const ReportsScreen = () => {
  const [stats, setStats] = useState<any>(null);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [period, setPeriod] = useState('month');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, statusRes] = await Promise.all([
        reportsAPI.getDashboard(),
        reportsAPI.getLeadsByStatus(),
      ]);
      setStats(statsRes.data.data);
      setStatusData(statusRes.data.data?.statuses || statusRes.data.data || []);
    } catch (e) { console.error('Failed to fetch reports:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const exportExcel = () => Alert.alert('Export', 'Excel export coming soon');
  const exportPDF = () => Alert.alert('Export', 'PDF export coming soon');

  const maxVal = Math.max(...(statusData || []).map((d: any) => d.count || 0), 1);

  if (loading) return <ActivityIndicator size="large" color="#667eea" style={{ flex: 1, justifyContent: 'center' }} />;

  const statCards = [
    { label: 'Total Leads', value: stats?.totalLeads ?? 0, icon: 'people', color: '#667eea', bg: '#eef0ff' },
    { label: 'New', value: stats?.newLeads ?? 0, icon: 'star', color: '#0ea5e9', bg: '#f0f9ff' },
    { label: 'Converted', value: stats?.convertedLeads ?? 0, icon: 'checkmark-circle', color: '#10b981', bg: '#ecfdf5' },
    { label: 'Lost', value: stats?.lostLeads ?? 0, icon: 'close-circle', color: '#ef4444', bg: '#fef2f2' },
    { label: 'Pipeline', value: `$${(stats?.totalValue ?? 0).toLocaleString()}`, icon: 'cash', color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Revenue', value: `$${(stats?.monthlyRevenue ?? 0).toLocaleString()}`, icon: 'trending-up', color: '#f59e0b', bg: '#fffbeb' },
  ];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667eea" />}>
      <Text style={styles.title}>Reports</Text>

      <View style={styles.statsGrid}>
        {statCards.map((card, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: card.bg }]}>
            <Icon name={card.icon} size={22} color={card.color} />
            <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
            <Text style={styles.statLabel}>{card.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.periodSection}>
        <Text style={styles.sectionTitle}>Period</Text>
        <View style={styles.periodRow}>
          {['week', 'month', 'quarter', 'year'].map((p) => (
            <TouchableOpacity key={p} style={[styles.periodBtn, period === p && styles.periodBtnActive]} onPress={() => setPeriod(p)}>
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Leads by Status</Text>
        {statusData.length > 0 ? statusData.map((item: any, i: number) => {
          const colors: Record<string, string> = { New: '#0ea5e9', FollowUp: '#f59e0b', MeetingScheduled: '#8b5cf6', Converted: '#10b981', Lost: '#ef4444' };
          const barColor = colors[item.status] || '#667eea';
          return (
            <View key={i} style={styles.barRow}>
              <Text style={styles.barLabel}>{item.status}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(item.count / maxVal) * 100}%`, backgroundColor: barColor }]} />
              </View>
              <Text style={styles.barValue}>{item.count}</Text>
            </View>
          );
        }) : (
          <Text style={styles.noData}>No data available</Text>
        )}
      </View>

      <View style={styles.exportSection}>
        <Text style={styles.sectionTitle}>Export Data</Text>
        <View style={styles.exportRow}>
          <TouchableOpacity style={styles.exportBtn} onPress={exportExcel}>
            <Icon name="document-text" size={24} color="#10b981" />
            <Text style={styles.exportBtnText}>Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportBtn} onPress={exportPDF}>
            <Icon name="document" size={24} color="#ef4444" />
            <Text style={styles.exportBtnText}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#1e293b', marginBottom: 16, marginTop: 50 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '31%', borderRadius: 14, padding: 12, marginBottom: 10, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', marginVertical: 4 },
  statLabel: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  periodSection: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 8, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  periodRow: { flexDirection: 'row', gap: 8 },
  periodBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
  periodBtnActive: { backgroundColor: '#667eea' },
  periodText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  periodTextActive: { color: '#fff' },
  chartSection: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 12, elevation: 2 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLabel: { width: 100, fontSize: 12, color: '#64748b', fontWeight: '500' },
  barTrack: { flex: 1, height: 22, backgroundColor: '#f1f5f9', borderRadius: 11, overflow: 'hidden', marginHorizontal: 8 },
  barFill: { height: '100%', borderRadius: 11 },
  barValue: { width: 30, fontSize: 13, fontWeight: '700', textAlign: 'right', color: '#1e293b' },
  noData: { textAlign: 'center', color: '#94a3b8', padding: 20 },
  exportSection: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 12, elevation: 2 },
  exportRow: { flexDirection: 'row', gap: 12 },
  exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  exportBtnText: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
});

export default ReportsScreen;
