import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, TextInput, Modal, ScrollView, RefreshControl,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { usersAPI } from '../../api/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  department?: string;
  designation?: string;
  isActive: boolean;
  roles: string[];
  hasFaceDescriptor?: boolean;
}

interface Role {
  id: string;
  name: string;
}

const UsersScreen = ({ navigation }: any) => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    department: '',
    designation: '',
    password: '',
    roleId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll({ pageNumber: 1, pageSize: 100, searchTerm });
      const data = res.data?.data?.items || res.data?.data || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Failed to fetch users');
    }
    setLoading(false);
    setRefreshing(false);
  };

  const fetchRoles = async () => {
    try {
      const res = await usersAPI.getRoles();
      const data = res.data?.data || [];
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Failed to fetch roles');
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ email: '', firstName: '', lastName: '', phoneNumber: '', department: '', designation: '', password: '', roleId: '' });
    setModalVisible(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber || '',
      department: user.department || '',
      designation: user.designation || '',
      password: '',
      roleId: '',
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      Alert.alert('Error', 'First name, last name and email are required');
      return;
    }
    if (!editingUser && !formData.password) {
      Alert.alert('Error', 'Password is required for new users');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        await usersAPI.update(editingUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          department: formData.department,
          designation: formData.designation,
        });
        Alert.alert('Success', 'User updated successfully');
      } else {
        const res = await usersAPI.create({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          department: formData.department,
          designation: formData.designation,
          password: formData.password,
        });
        const newUser = res.data?.data;
        if (newUser && formData.roleId) {
          await usersAPI.assignRole(newUser.id, formData.roleId);
        }
        Alert.alert('Success', 'User created successfully');
      }
      setModalVisible(false);
      fetchUsers();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Operation failed');
    }
    setSubmitting(false);
  };

  const handleDelete = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.firstName} ${user.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await usersAPI.delete(user.id);
              Alert.alert('Success', 'User deleted');
              fetchUsers();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Delete failed');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await usersAPI.update(user.id, { isActive: !user.isActive });
      fetchUsers();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const filteredUsers = users.filter(u =>
    u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={[styles.avatar, { backgroundColor: item.isActive ? '#667eea' : '#94a3b8' }]}>
          <Text style={styles.avatarText}>{item.firstName?.[0]}{item.lastName?.[0]}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.designation && <Text style={styles.userRole}>{item.designation}</Text>}
        </View>
        <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#10b981' : '#ef4444' }]} />
      </View>

      <View style={styles.userDetails}>
        {item.department && (
          <View style={styles.detailChip}>
            <Icon name="business-outline" size={12} color="#667eea" />
            <Text style={styles.detailText}>{item.department}</Text>
          </View>
        )}
        {item.roles?.map((role, idx) => (
          <View key={idx} style={[styles.detailChip, { backgroundColor: '#ede9fe' }]}>
            <Icon name="shield-outline" size={12} color="#7c3aed" />
            <Text style={[styles.detailText, { color: '#7c3aed' }]}>{role}</Text>
          </View>
        ))}
        {item.hasFaceDescriptor && (
          <View style={[styles.detailChip, { backgroundColor: '#d1fae5' }]}>
            <Icon name="finger-print-outline" size={12} color="#059669" />
            <Text style={[styles.detailText, { color: '#059669' }]}>Face ID</Text>
          </View>
        )}
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
          <Icon name="create-outline" size={18} color="#667eea" />
          <Text style={[styles.actionText, { color: '#667eea' }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleStatus(item)}>
          <Icon name={item.isActive ? 'lock-closed-outline' : 'lock-open-outline'} size={18} color="#f59e0b" />
          <Text style={[styles.actionText, { color: '#f59e0b' }]}>{item.isActive ? 'Deactivate' : 'Activate'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
          <Icon name="trash-outline" size={18} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={{ color: '#94a3b8', marginTop: 12 }}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Users</Text>
          <Text style={styles.subtitle}>{filteredUsers.length} users</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
          <Icon name="person-add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={18} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={60} color="#e2e8f0" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingUser ? 'Edit User' : 'Create User'}</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color="#667eea" />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.fieldLabel}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(v) => setFormData({ ...formData, firstName: v })}
              placeholder="First name"
            />

            <Text style={styles.fieldLabel}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(v) => setFormData({ ...formData, lastName: v })}
              placeholder="Last name"
            />

            <Text style={styles.fieldLabel}>Email *</Text>
            <TextInput
              style={[styles.input, editingUser && styles.inputDisabled]}
              value={formData.email}
              onChangeText={(v) => setFormData({ ...formData, email: v })}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!editingUser}
            />

            {!editingUser && (
              <>
                <Text style={styles.fieldLabel}>Password *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(v) => setFormData({ ...formData, password: v })}
                  placeholder="Password"
                  secureTextEntry
                />
              </>
            )}

            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.phoneNumber}
              onChangeText={(v) => setFormData({ ...formData, phoneNumber: v })}
              placeholder="Phone number"
              keyboardType="phone-pad"
            />

            <Text style={styles.fieldLabel}>Department</Text>
            <TextInput
              style={styles.input}
              value={formData.department}
              onChangeText={(v) => setFormData({ ...formData, department: v })}
              placeholder="Department"
            />

            <Text style={styles.fieldLabel}>Designation</Text>
            <TextInput
              style={styles.input}
              value={formData.designation}
              onChangeText={(v) => setFormData({ ...formData, designation: v })}
              placeholder="Designation"
            />

            {!editingUser && roles.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>Role</Text>
                <View style={styles.roleContainer}>
                  {roles.map((role) => (
                    <TouchableOpacity
                      key={role.id}
                      style={[styles.roleChip, formData.roleId === role.id && styles.roleChipActive]}
                      onPress={() => setFormData({ ...formData, roleId: role.id })}
                    >
                      <Text style={[styles.roleChipText, formData.roleId === role.id && styles.roleChipTextActive]}>
                        {role.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  addBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#667eea',
    alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#667eea', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 16, borderRadius: 12, paddingHorizontal: 14,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 14, color: '#0f172a' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  userCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  userHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  userEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  userRole: { fontSize: 12, color: '#667eea', fontWeight: '600', marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  userDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  detailChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4,
  },
  detailText: { fontSize: 11, color: '#475569', fontWeight: '500' },
  userActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 12 },
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#f1f5f9' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modalCancel: { fontSize: 16, color: '#64748b' },
  modalSave: { fontSize: 16, fontWeight: '700', color: '#667eea' },
  modalBody: { padding: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0',
  },
  inputDisabled: { backgroundColor: '#f8fafc', color: '#94a3b8' },
  roleContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
  },
  roleChipActive: { backgroundColor: '#667eea', borderColor: '#667eea' },
  roleChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  roleChipTextActive: { color: '#fff' },
});

export default UsersScreen;
