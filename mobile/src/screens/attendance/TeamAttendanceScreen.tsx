import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { attendanceAPI } from '../../api/api';

export const TeamAttendanceScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teamData, setTeamData] = useState<any[]>([]);

  const fetchTeamAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await attendanceAPI.getTeamAttendance(today);
      if (response.data?.isSuccess) {
        setTeamData(response.data.data || []);
      }
    } catch (err) {
      console.log('Failed to fetch team attendance', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeamAttendance();
  }, []);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present': return '#10b981';
      case 'late': return '#f59e0b';
      case 'absent': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.name}>{item.userFullName}</Text>
          <Text style={styles.role}>{item.role}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status?.toUpperCase() || 'ABSENT'}
          </Text>
        </View>
      </View>
      
      <View style={styles.timeRow}>
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>Check In</Text>
          <Text style={styles.timeValue}>{formatTime(item.checkInTime)}</Text>
        </View>
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>Check Out</Text>
          <Text style={styles.timeValue}>{formatTime(item.checkOutTime)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Team Attendance</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.dateSubtitle}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : (
        <FlatList
          data={teamData}
          keyExtractor={(item, index) => item.userId || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTeamAttendance(); }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="people-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No team records found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  dateSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginVertical: 15, fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 30 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  name: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  role: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 12 },
  timeBox: { flex: 1 },
  timeLabel: { fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: '500' },
  timeValue: { fontSize: 14, color: '#1e293b', fontWeight: '700' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 12, fontSize: 14, color: '#94a3b8', fontWeight: '500' },
});
