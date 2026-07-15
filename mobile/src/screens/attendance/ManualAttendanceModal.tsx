import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, ScrollView, FlatList
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { attendanceAPI, usersAPI } from '../../api/api';

interface ManualAttendanceModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { label: 'Present', value: 'Present' },
  { label: 'Absent', value: 'Absent' },
  { label: 'Late', value: 'Late' },
  { label: 'Half Day', value: 'HalfDay' },
  { label: 'On Leave', value: 'OnLeave' },
];

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({ visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);

  const [targetUserId, setTargetUserId] = useState('');
  const [targetUserName, setTargetUserName] = useState('Self');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [status, setStatus] = useState('Present');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible) {
      fetchUsers();
    }
  }, [visible]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await usersAPI.getAll({ pageSize: 1000, isActive: true });
      const userData = res.data?.data?.items || res.data?.data || [];
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (err) {
      console.log('Failed to fetch users', err);
    }
    setUsersLoading(false);
  };

  const handleSubmit = async () => {
    if (!date) {
      Alert.alert('Validation Error', 'Date is required.');
      return;
    }

    setLoading(true);
    try {
      await attendanceAPI.manualEntry({
        targetUserId: targetUserId || null,
        date: new Date(date).toISOString(),
        checkInTime: checkInTime ? `${checkInTime}:00` : null,
        checkOutTime: checkOutTime ? `${checkOutTime}:00` : null,
        status,
        notes,
      });
      
      Alert.alert('Success', 'Manual attendance recorded successfully.');
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit manual attendance';
      Alert.alert('Error', msg);
    }
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Manual Attendance</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#334155" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* User Selector */}
          <Text style={styles.label}>Employee (Leave blank for self)</Text>
          <TouchableOpacity style={styles.selectorBtn} onPress={() => setShowUserPicker(!showUserPicker)}>
            <Text style={styles.selectorText}>{targetUserName}</Text>
            <Icon name={showUserPicker ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
          </TouchableOpacity>

          {showUserPicker && (
            <View style={styles.dropdownList}>
              {usersLoading ? (
                <ActivityIndicator size="small" color="#667eea" style={{ margin: 10 }} />
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.dropdownItem, targetUserId === '' && styles.dropdownItemSelected]}
                    onPress={() => { setTargetUserId(''); setTargetUserName('Self'); setShowUserPicker(false); }}
                  >
                    <Text style={[styles.dropdownItemText, targetUserId === '' && styles.dropdownItemTextSelected]}>Self</Text>
                  </TouchableOpacity>
                  {users.map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.dropdownItem, targetUserId === u.id && styles.dropdownItemSelected]}
                      onPress={() => {
                        setTargetUserId(u.id);
                        setTargetUserName(`${u.firstName} ${u.lastName}`);
                        setShowUserPicker(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, targetUserId === u.id && styles.dropdownItemTextSelected]}>
                        {u.firstName} {u.lastName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          )}

          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="e.g. 2026-07-12"
          />

          <Text style={styles.label}>Check-in Time (HH:MM) optional</Text>
          <TextInput
            style={styles.input}
            value={checkInTime}
            onChangeText={setCheckInTime}
            placeholder="e.g. 09:00"
          />

          <Text style={styles.label}>Check-out Time (HH:MM) optional</Text>
          <TextInput
            style={styles.input}
            value={checkOutTime}
            onChangeText={setCheckOutTime}
            placeholder="e.g. 17:30"
          />

          <Text style={styles.label}>Status</Text>
          <View style={styles.statusGroup}>
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.statusChip, status === opt.value && styles.statusChipActive]}
                onPress={() => setStatus(opt.value)}
              >
                <Text style={[styles.statusChipText, status === opt.value && styles.statusChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholder="Add notes..."
          />
          
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Save Record</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  closeButton: { padding: 4 },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 8, padding: 12, fontSize: 15, color: '#1e293b',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  selectorBtn: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  selectorText: { fontSize: 15, color: '#1e293b' },
  dropdownList: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 8, marginTop: 4, maxHeight: 200, overflow: 'hidden',
  },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemSelected: { backgroundColor: '#667eea15' },
  dropdownItemText: { fontSize: 14, color: '#334155' },
  dropdownItemTextSelected: { color: '#667eea', fontWeight: '600' },
  statusGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff',
  },
  statusChipActive: { backgroundColor: '#667eea', borderColor: '#667eea' },
  statusChipText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  statusChipTextActive: { color: '#fff', fontWeight: '700' },
  submitButton: {
    backgroundColor: '#667eea', borderRadius: 8, padding: 16,
    alignItems: 'center', marginTop: 24, marginBottom: 40,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
