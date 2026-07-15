import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { followUpsAPI, leadsAPI } from '../../api/api';

const FollowUpFormScreen = ({ navigation, route }: any) => {
  const leadId = route?.params?.leadId;
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState(leadId || '');
  const [followUpType, setFollowUpType] = useState('Call');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingLeads, setFetchingLeads] = useState(!leadId);

  useEffect(() => {
    if (!leadId) {
      fetchLeads();
    }
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await leadsAPI.getAll({ pageSize: 100 });
      const items = res.data?.data?.items || res.data?.data || [];
      setLeads(Array.isArray(items) ? items : []);
    } catch {} finally { setFetchingLeads(false); }
  };

  const handleCreate = async () => {
    if (!selectedLeadId || !scheduledDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      await followUpsAPI.create({
        leadId: selectedLeadId, type: followUpType,
        scheduledDate, scheduledTime: scheduledTime || null,
        notes: notes || null,
      });
      Alert.alert('Success', 'Follow-up created', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to create follow-up');
    } finally { setLoading(false); }
  };

  const followUpTypes = ['Call', 'Email', 'Meeting', 'SMS', 'WhatsApp', 'Other'];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Follow-up</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {!leadId && (
          <View style={styles.field}>
            <Text style={styles.label}>Lead *</Text>
            {fetchingLeads ? <ActivityIndicator size="small" color="#667eea" /> : (
              <View style={styles.chipContainer}>
                {leads.slice(0, 20).map((l: any) => (
                  <TouchableOpacity key={l.id} style={[styles.chip, selectedLeadId === l.id && styles.chipActive]} onPress={() => setSelectedLeadId(l.id)}>
                    <Text style={[styles.chipText, selectedLeadId === l.id && styles.chipTextActive]} numberOfLines={1}>{l.customerName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        <View style={styles.field}>
          <Text style={styles.label}>Follow-up Type *</Text>
          <View style={styles.chipContainer}>
            {followUpTypes.map((t) => (
              <TouchableOpacity key={t} style={[styles.chip, followUpType === t && styles.chipActive]} onPress={() => setFollowUpType(t)}>
                <Text style={[styles.chipText, followUpType === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Date *</Text>
            <TextInput style={styles.input} value={scheduledDate} onChangeText={setScheduledDate} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Time</Text>
            <TextInput style={styles.input} value={scheduledTime} onChangeText={setScheduledTime} placeholder="HH:MM" placeholderTextColor="#94a3b8" />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} multiline numberOfLines={4} placeholder="Follow-up notes..." placeholderTextColor="#94a3b8" />
        </View>
        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <><Icon name="checkmark-circle" size={20} color="#fff" /><Text style={styles.submitText}>Create Follow-up</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  form: { flex: 1, padding: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#667eea', borderColor: '#667eea' },
  chipText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#667eea', borderRadius: 14, paddingVertical: 16, marginTop: 10, marginBottom: 40 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default FollowUpFormScreen;
