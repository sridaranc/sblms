import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { notificationsAPI, usersAPI } from '../../api/api';

const ProfileScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countRes, profileRes] = await Promise.all([
          notificationsAPI.getUnreadCount(),
          usersAPI.getMe(),
        ]);
        setUnreadCount(countRes.data.data?.unreadCount || 0);
        setProfile(profileRes.data.data);
      } catch {}
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  const displayName = profile?.fullName || `${user?.firstName} ${user?.lastName}` || 'User';
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;
  const role = user?.roles?.[0] || 'User';

  const menuItems = [
    { icon: 'notifications', label: 'Notifications', badge: unreadCount, onPress: () => navigation.navigate('Notifications'), color: '#667eea' },
    { icon: 'people', label: 'Manage Leads', onPress: () => navigation.navigate('Leads'), color: '#0ea5e9' },
    { icon: 'checkbox', label: 'Follow-ups', onPress: () => navigation.navigate('FollowUps'), color: '#f59e0b' },
    { icon: 'videocam', label: 'Meetings', onPress: () => navigation.navigate('Calendar'), color: '#8b5cf6' },
    { icon: 'business', label: 'Clients', onPress: () => navigation.navigate('Clients'), color: '#10b981' },
    { icon: 'sparkles', label: 'AI Leads', onPress: () => navigation.navigate('AI Leads'), color: '#ec4899' },
    { icon: 'bar-chart', label: 'Reports', onPress: () => navigation.navigate('Reports'), color: '#06b6d4' },
    { icon: 'person-circle', label: 'Users', onPress: () => navigation.navigate('Users'), color: '#8b5cf6' },
    { icon: 'finger-print', label: 'Face Enrolment', onPress: () => navigation.navigate('FaceEnrolment'), color: '#00c9a7' },
    { icon: 'settings', label: 'Settings', onPress: () => {}, color: '#94a3b8' },
    { icon: 'help-circle', label: 'Help & Support', onPress: () => {}, color: '#94a3b8' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Icon name="shield-checkmark" size={14} color="#667eea" />
          <Text style={styles.roleText}>{role}</Text>
        </View>
        {profile?.phoneNumber && (
          <Text style={styles.phone}>{profile.phoneNumber}</Text>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile?.isActive ? 'Active' : 'Inactive'}</Text>
          <Text style={styles.statLabel}>Status</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{unreadCount}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString() : 'Never'}</Text>
          <Text style={styles.statLabel}>Last Login</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
              <Icon name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <View style={styles.menuRight}>
              {item.badge !== undefined && item.badge > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{item.badge}</Text></View>
              )}
              <Icon name="chevron-forward" size={18} color="#cbd5e1" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
        <Icon name="log-out" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>SBLMS v1.0.0</Text>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#1e293b' },
  profileCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, marginHorizontal: 16, marginTop: 12, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  userName: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  userEmail: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef0ff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8, gap: 6 },
  roleText: { fontSize: 12, fontWeight: '600', color: '#667eea' },
  phone: { fontSize: 13, color: '#64748b', marginTop: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginTop: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0' },
  menuSection: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginTop: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1e293b', marginLeft: 12 },
  menuRight: { flexDirection: 'row', alignItems: 'center' },
  badge: { backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginRight: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, marginHorizontal: 16, padding: 16, backgroundColor: '#fff', borderRadius: 16, elevation: 2, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, borderWidth: 1, borderColor: '#fecaca' },
  logoutText: { fontSize: 16, color: '#ef4444', fontWeight: '600', marginLeft: 8 },
  version: { textAlign: 'center', color: '#cbd5e1', fontSize: 12, marginTop: 20 },
});

export default ProfileScreen;
