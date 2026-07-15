import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { reportsAPI, leadsAPI, meetingsAPI, followUpsAPI } from '../../api/api';

const DashboardScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState<any>(null);
  const [leadStats, setLeadStats] = useState<any>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, leadRes, meetRes, fuRes] = await Promise.all([
        reportsAPI.getDashboard(),
        leadsAPI.getStats(),
        meetingsAPI.getAll({ pageSize: 5 }),
        followUpsAPI.getAll({ pageSize: 5 }),
      ]);
      setStats(dashRes.data.data);
      setLeadStats(leadRes.data.data);
      setMeetings(Array.isArray(meetRes.data.data) ? meetRes.data.data : (meetRes.data.data?.items || []));
      setFollowUps(Array.isArray(fuRes.data.data) ? fuRes.data.data : (fuRes.data.data?.items || []));
    } catch (e) { console.error('Dashboard fetch error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const safeDate = (d: string) => {
    if (!d) return 'N/A';
    const dt = new Date(d.includes('Z') || d.includes('+') ? d : d + 'Z');
    return isNaN(dt.getTime()) ? 'N/A' : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const safeTime = (d: string) => {
    if (!d) return '';
    const dt = new Date(d.includes('Z') || d.includes('+') ? d : d + 'Z');
    return isNaN(dt.getTime()) ? '' : dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <ActivityIndicator size="large" color="#667eea" style={{ flex: 1, justifyContent: 'center' }} />;

  const statCards = [
    { title: 'Total Leads', value: stats?.totalLeads ?? 0, icon: 'people', color: '#667eea', bg: '#eef0ff' },
    { title: 'New', value: stats?.newLeads ?? 0, icon: 'star', color: '#0ea5e9', bg: '#f0f9ff' },
    { title: 'Follow-up', value: stats?.followUpLeads ?? 0, icon: 'time', color: '#f59e0b', bg: '#fffbeb' },
    { title: 'Converted', value: stats?.convertedLeads ?? 0, icon: 'checkmark-circle', color: '#10b981', bg: '#ecfdf5' },
    { title: "Today's Tasks", value: stats?.todayFollowUps ?? 0, icon: 'calendar', color: '#8b5cf6', bg: '#f5f3ff' },
    { title: 'Meetings', value: meetings.length, icon: 'videocam', color: '#06b6d4', bg: '#ecfeff' },
  ];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667eea" />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'} 👋</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notifBtn}>
          <Icon name="notifications-outline" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        {statCards.map((card, index) => (
          <TouchableOpacity key={index} style={[styles.statCard, { backgroundColor: card.bg }]} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: card.color + '15' }]}>
              <Icon name={card.icon} size={20} color={card.color} />
            </View>
            <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
            <Text style={styles.statLabel}>{card.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stats?.conversionRate ?? 0}%</Text>
            <Text style={styles.summaryLabel}>Conversion</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>${(stats?.totalValue ?? 0).toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Pipeline</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{stats?.lostLeads ?? 0}</Text>
            <Text style={styles.summaryLabel}>Lost</Text>
          </View>
        </View>
      </View>

      {followUps.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Follow-ups</Text>
            <TouchableOpacity onPress={() => navigation.navigate('FollowUps')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {followUps.slice(0, 3).map((f: any) => (
            <View key={f.id} style={styles.listItem}>
              <View style={[styles.statusDot, { backgroundColor: f.status === 'Completed' ? '#10b981' : f.status === 'Overdue' ? '#ef4444' : '#f59e0b' }]} />
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle} numberOfLines={1}>{f.notes || 'Follow-up'}</Text>
                <Text style={styles.listItemMeta}>{f.leadNumber} • {f.customerName} • {safeDate(f.scheduledDate)} {f.scheduledTime || ''}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {meetings.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {meetings.slice(0, 3).map((m: any) => (
            <View key={m.id} style={styles.listItem}>
              <View style={[styles.statusDot, { backgroundColor: m.status === 'Completed' ? '#10b981' : '#667eea' }]} />
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle} numberOfLines={1}>{m.title}</Text>
                <Text style={styles.listItemMeta}>{m.leadNumber} • {safeDate(m.scheduledDate)} {safeTime(m.scheduledDate)} • {m.location || 'Online'}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {stats?.recentActivities && stats.recentActivities.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {stats.recentActivities.slice(0, 5).map((a: any, i: number) => (
            <View key={i} style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: a.typeName === 'Meeting' ? '#667eea' : a.typeName === 'FollowUp' ? '#f59e0b' : '#10b981' }]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText} numberOfLines={2}>{a.description}</Text>
                <Text style={styles.activityMeta}>{a.userName} • {safeDate(a.createdAt)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Leads')}>
            <View style={[styles.actionIcon, { backgroundColor: '#667eea15' }]}>
              <Icon name="add-circle" size={28} color="#667eea" />
            </View>
            <Text style={styles.actionText}>Leads</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('FollowUps')}>
            <View style={[styles.actionIcon, { backgroundColor: '#f59e0b15' }]}>
              <Icon name="checkbox" size={28} color="#f59e0b" />
            </View>
            <Text style={styles.actionText}>Follow-ups</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Calendar')}>
            <View style={[styles.actionIcon, { backgroundColor: '#10b98115' }]}>
              <Icon name="calendar" size={28} color="#10b981" />
            </View>
            <Text style={styles.actionText}>Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AI Leads')}>
            <View style={[styles.actionIcon, { backgroundColor: '#8b5cf615' }]}>
              <Icon name="sparkles" size={28} color="#8b5cf6" />
            </View>
            <Text style={styles.actionText}>AI Leads</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  greeting: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
  title: { fontSize: 26, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  notifBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16 },
  statCard: { width: '31%', borderRadius: 16, padding: 14, marginBottom: 10, alignItems: 'center' },
  iconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', marginTop: 2 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginHorizontal: 16, marginTop: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 8 },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  summaryLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: '500' },
  summaryDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  seeAll: { fontSize: 13, color: '#667eea', fontWeight: '600' },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  listItemContent: { flex: 1 },
  listItemTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  listItemMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  activityDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, marginRight: 10 },
  activityContent: { flex: 1 },
  activityText: { fontSize: 13, color: '#475569', lineHeight: 18 },
  activityMeta: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  quickActions: { marginTop: 12, paddingHorizontal: 16 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  actionButton: { alignItems: 'center', padding: 8 },
  actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
});

export default DashboardScreen;
