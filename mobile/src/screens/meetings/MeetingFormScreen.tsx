import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { meetingsAPI, leadsAPI } from '../../api/api';

const meetingTypes = [
  { value: 0, label: 'Google Meet', icon: 'logo-google', color: '#34a853', duration: 30 },
  { value: 1, label: 'Teams', icon: 'logo-microsoft', color: '#6264a7', duration: 30 },
  { value: 2, label: 'Zoom', icon: 'videocam', color: '#2d8cff', duration: 30 },
  { value: 3, label: 'Webex', icon: 'globe', color: '#00bceb', duration: 30 },
  { value: 4, label: 'Phone Call', icon: 'call', color: '#f59e0b', duration: 15 },
  { value: 5, label: 'In-Person', icon: 'people', color: '#10b981', duration: 60 },
];

const MeetingFormScreen = ({ navigation, route }: any) => {
  const leadId = route?.params?.leadId;
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState(leadId || '');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [meetingType, setMeetingType] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingLeads, setFetchingLeads] = useState(!leadId);
  const [step, setStep] = useState(0);
  const [meetingResult, setMeetingResult] = useState<any>(null);

  useEffect(() => {
    if (!leadId) fetchLeads();
  }, []);

  useEffect(() => {
    const lead = leads.find((l) => l.id === selectedLeadId);
    setSelectedLead(lead || null);
    if (lead) {
      setTitle(`${meetingTypes[meetingType].label} with ${lead.customerName}`);
      setClientEmail(lead.emailAddress || '');
    }
  }, [selectedLeadId, leads]);

  useEffect(() => {
    const mt = meetingTypes.find((t) => t.value === meetingType);
    if (mt) setDuration(String(mt.duration));
  }, [meetingType]);

  const fetchLeads = async () => {
    try {
      const res = await leadsAPI.getAll({ pageSize: 100 });
      const items = res.data?.data?.items || res.data?.data || [];
      setLeads(Array.isArray(items) ? items : []);
    } catch {} finally { setFetchingLeads(false); }
  };

  const handleSetup = async () => {
    if (!selectedLeadId || !title || !meetingDate || !meetingTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    setStep(1);
    try {
      const dateStr = `${meetingDate}T${meetingTime}:00`;
      const durationNum = parseInt(duration) || null;
      const durationStr = durationNum ? `${String(Math.floor(durationNum / 60)).padStart(2, '0')}:${String(durationNum % 60).padStart(2, '0')}:00` : null;

      const res = await meetingsAPI.create({
        leadId: selectedLeadId, title, description: description || null,
        meetingDate, meetingTime, duration: durationStr, meetingType,
        clientEmail: clientEmail || null,
        clientName: selectedLead?.customerName || null,
      });

      const data = res.data?.data || res.data;
      setMeetingResult(data);
      setStep(2);
      Alert.alert('Meeting Ready', `Meeting URL: ${data?.meetingUrl || 'Generated'}\n\nReady to send invitation to client.`);
    } catch (e: any) {
      setStep(0);
      Alert.alert('Error', e?.response?.data?.message || 'Failed to setup meeting');
    } finally { setLoading(false); }
  };

  const handleSendInvite = async () => {
    if (!meetingResult?.meetingId) return;
    setLoading(true);
    try {
      await meetingsAPI.sendToClient(meetingResult.meetingId);
      setStep(3);
      Alert.alert('Sent!', 'Meeting invitation has been sent to the client.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to send');
    } finally { setLoading(false); }
  };

  const currentMt = meetingTypes.find((t) => t.value === meetingType);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Meeting</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Steps */}
      <View style={styles.stepsRow}>
        {['Setup', 'Ready', 'Send'].map((s, i) => (
          <View key={i} style={[styles.stepChip, i < step && styles.stepDone, i === step && styles.stepActive]}>
            <Text style={[styles.stepText, (i <= step) && styles.stepTextActive]}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Lead Selection */}
        {!leadId && (
          <View style={styles.field}>
            <Text style={styles.label}>Lead *</Text>
            {fetchingLeads ? <ActivityIndicator size="small" color="#667eea" /> : (
              <View style={styles.chipContainer}>
                {leads.slice(0, 15).map((l) => (
                  <TouchableOpacity key={l.id} style={[styles.chip, selectedLeadId === l.id && styles.chipActive]} onPress={() => setSelectedLeadId(l.id)}>
                    <Text style={[styles.chipText, selectedLeadId === l.id && styles.chipTextActive]} numberOfLines={1}>{l.customerName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Lead Info */}
        {selectedLead && (
          <View style={styles.leadCard}>
            <View style={styles.leadHeader}>
              <View style={styles.leadAvatar}><Text style={styles.leadAvatarText}>{selectedLead.customerName?.[0]}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.leadName}>{selectedLead.customerName}</Text>
                <Text style={styles.leadCompany}>{selectedLead.companyName || selectedLead.emailAddress}</Text>
              </View>
            </View>
            {selectedLead.emailAddress && (
              <View style={styles.leadDetail}><Icon name="mail" size={14} color="#667eea" /><Text style={styles.leadDetailText}>{selectedLead.emailAddress}</Text></View>
            )}
            {selectedLead.mobileNumber && (
              <View style={styles.leadDetail}><Icon name="call" size={14} color="#667eea" /><Text style={styles.leadDetailText}>{selectedLead.mobileNumber}</Text></View>
            )}
          </View>
        )}

        {/* Meeting Type */}
        <View style={styles.field}>
          <Text style={styles.label}>Meeting Type *</Text>
          <View style={styles.typeGrid}>
            {meetingTypes.map((type) => (
              <TouchableOpacity key={type.value} style={[styles.typeCard, meetingType === type.value && { borderColor: type.color, backgroundColor: type.color + '10' }]} onPress={() => setMeetingType(type.value)}>
                <Icon name={type.icon as any} size={24} color={meetingType === type.value ? type.color : '#94a3b8'} />
                <Text style={[styles.typeLabel, meetingType === type.value && { color: type.color }]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Meeting Details */}
        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Meeting title" placeholderTextColor="#94a3b8" />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Date *</Text>
            <TextInput style={styles.input} value={meetingDate} onChangeText={setMeetingDate} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Time *</Text>
            <TextInput style={styles.input} value={meetingTime} onChangeText={setMeetingTime} placeholder="HH:MM" placeholderTextColor="#94a3b8" />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Duration (min)</Text>
            <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholderTextColor="#94a3b8" />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Client Email</Text>
            <TextInput style={styles.input} value={clientEmail} onChangeText={setClientEmail} placeholder="client@email.com" placeholderTextColor="#94a3b8" keyboardType="email-address" />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description / Agenda</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={3} placeholder="Meeting agenda..." placeholderTextColor="#94a3b8" />
        </View>

        {/* Meeting URL Preview */}
        {meetingResult?.meetingUrl && (
          <View style={styles.urlCard}>
            <Icon name="link" size={20} color="#10b981" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.urlLabel}>Meeting URL Generated</Text>
              <Text style={styles.urlText} numberOfLines={2}>{meetingResult.meetingUrl}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {step < 2 ? (
          <TouchableOpacity style={[styles.submitBtn, loading && styles.btnDisabled]} onPress={handleSetup} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <><Icon name="videocam" size={20} color="#fff" /><Text style={styles.submitText}>Setup Meeting</Text></>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.sendBtn, loading && styles.btnDisabled]} onPress={handleSendInvite} disabled={loading || step >= 3}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <><Icon name="send" size={20} color="#fff" /><Text style={styles.submitText}>{step >= 3 ? 'Invitation Sent!' : 'Send Invitation to Client'}</Text></>}
          </TouchableOpacity>
        )}

        {step >= 3 && (
          <View style={styles.successCard}>
            <Icon name="checkmark-circle" size={40} color="#10b981" />
            <Text style={styles.successTitle}>Invitation Sent!</Text>
            <Text style={styles.successText}>The client will receive a professional email with all meeting details.</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  stepsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: '#fff' },
  stepChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9' },
  stepActive: { backgroundColor: '#667eea' },
  stepDone: { backgroundColor: '#10b981' },
  stepText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  stepTextActive: { color: '#fff' },
  form: { flex: 1, padding: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#667eea', borderColor: '#667eea' },
  chipText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  leadCard: { backgroundColor: '#f0f4ff', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e0e8ff' },
  leadHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  leadAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  leadAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  leadName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  leadCompany: { fontSize: 12, color: '#64748b', marginTop: 2 },
  leadDetail: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  leadDetailText: { fontSize: 12, color: '#475569' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: { width: '30%', aspectRatio: 1.2, borderRadius: 12, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', gap: 4 },
  typeLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', textAlign: 'center' },
  urlCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0' },
  urlLabel: { fontSize: 12, fontWeight: '700', color: '#166534' },
  urlText: { fontSize: 11, color: '#16a34a', marginTop: 2 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#667eea', borderRadius: 14, paddingVertical: 16, marginTop: 10 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10b981', borderRadius: 14, paddingVertical: 16, marginTop: 10 },
  btnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successCard: { alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 14, padding: 24, marginTop: 16, borderWidth: 1, borderColor: '#bbf7d0' },
  successTitle: { fontSize: 18, fontWeight: '700', color: '#166534', marginTop: 8 },
  successText: { fontSize: 13, color: '#16a34a', textAlign: 'center', marginTop: 4 },
});

export default MeetingFormScreen;
