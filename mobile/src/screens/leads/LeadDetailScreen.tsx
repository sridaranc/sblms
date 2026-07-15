import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, FlatList } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import api, { leadsAPI, followUpsAPI, meetingScheduleAPI } from '../../api/api';

const safeDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z');
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
};

const safeDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z');
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
};

const statusColors: Record<string, string> = {
  New: '#0288d1', FollowUp: '#ed6c02', Contacted: '#7b1fa2', MeetingScheduled: '#9c27b0',
  ProposalSent: '#ff9800', Negotiation: '#ff5722', Converted: '#2e7d32', Lost: '#d32f2f', Closed: '#757575',
};

const meetingTypes = [
  { value: 0, label: 'Google Meet', icon: '🟢', color: '#10a37f' },
  { value: 1, label: 'Microsoft Teams', icon: '🟣', color: '#6264a7' },
  { value: 2, label: 'Zoom', icon: '🔵', color: '#2d8cff' },
  { value: 4, label: 'Phone Call', icon: '📞', color: '#1976d2' },
  { value: 5, label: 'In-Person', icon: '🤝', color: '#00c9a7' },
];

const setupStatusColors: Record<string, string> = {
  NotStarted: '#999', SettingUp: '#ffc107', Ready: '#4caf50', SentToClient: '#2196f3', Accepted: '#00c9a7', Declined: '#ff6b6b',
};

const LeadDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [meetingModal, setMeetingModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [meetingType, setMeetingType] = useState(0);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingDuration, setMeetingDuration] = useState('30');
  const [meetingDesc, setMeetingDesc] = useState('');
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [setupResult, setSetupResult] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    customerName: '', companyName: '', emailAddress: '', mobileNumber: '',
    website: '', address: '', city: '', state: '', country: '', postalCode: '',
    source: 'Website', value: '', notes: '', requirements: '',
    taxId: '', annualRevenue: '', employeeCount: '', fax: '',
  });

  useEffect(() => {
    fetchLead();
    fetchMeetings();
    fetchFollowUps();
  }, [id]);

  const fetchLead = async () => {
    try {
      const response = await leadsAPI.getById(id);
      const data = response.data.data;
      setLead(data);
      setEditForm({
        customerName: data.customerName || '',
        companyName: data.companyName || '',
        emailAddress: data.emailAddress || '',
        mobileNumber: data.mobileNumber || '',
        website: data.website || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        postalCode: data.postalCode || '',
        source: data.source || 'Website',
        value: data.value ? String(data.value) : '',
        notes: data.notes || '',
        requirements: data.requirements || '',
        taxId: data.taxId || '',
        annualRevenue: data.annualRevenue ? String(data.annualRevenue) : '',
        employeeCount: data.employeeCount ? String(data.employeeCount) : '',
        fax: data.fax || '',
      });
    } catch { Alert.alert('Error', 'Failed to load lead'); navigation.goBack(); }
    finally { setLoading(false); }
  };

  const fetchMeetings = async () => {
    try {
      const response = await meetingScheduleAPI.getByLead(id);
      const data = response.data;
      setMeetings(Array.isArray(data.data) ? data.data : (data.data?.items || []));
    } catch {}
  };

  const fetchFollowUps = async () => {
    try {
      const response = await followUpsAPI.getAll({ leadId: id, pageSize: 50 });
      const data = response.data;
      setFollowUps(Array.isArray(data.data) ? data.data : (data.data?.items || []));
    } catch {}
  };

  const handleStatusChange = (newStatus: string) => {
    Alert.alert('Change Status', `Set status to "${newStatus}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
        try { await leadsAPI.updateStatus(id, newStatus); setLead({ ...lead, status: newStatus }); Alert.alert('Success', 'Status updated'); }
        catch { Alert.alert('Error', 'Failed'); }
      }},
    ]);
  };

  const handleEditLead = async () => {
    if (!editForm.customerName.trim()) { Alert.alert('Error', 'Customer name is required'); return; }
    setEditLoading(true);
    try {
      const payload: any = { ...editForm };
      if (payload.value) payload.value = parseFloat(payload.value);
      else delete payload.value;
      if (payload.annualRevenue) payload.annualRevenue = parseFloat(payload.annualRevenue);
      else delete payload.annualRevenue;
      if (payload.employeeCount) payload.employeeCount = parseInt(payload.employeeCount);
      else delete payload.employeeCount;
      await leadsAPI.update(id, payload);
      Alert.alert('Success', 'Lead updated');
      setEditModal(false);
      fetchLead();
    } catch { Alert.alert('Error', 'Failed to update lead'); }
    setEditLoading(false);
  };

  const handleDeleteLead = () => {
    Alert.alert('Delete Lead', 'This action cannot be undone. Delete this lead?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await leadsAPI.delete(id); Alert.alert('Deleted', 'Lead deleted'); navigation.goBack(); }
        catch { Alert.alert('Error', 'Failed to delete lead'); }
      }},
    ]);
  };

  const handleSetupMeeting = async () => {
    if (!meetingTitle || !meetingDate) { Alert.alert('Error', 'Fill title and date'); return; }
    setMeetingLoading(true);
    try {
      const response = await meetingScheduleAPI.schedule({
        leadId: id, title: meetingTitle, description: meetingDesc,
        scheduledDate: new Date(meetingDate).toISOString(), duration: parseInt(meetingDuration),
        meetingType, clientEmail: lead.emailAddress || '', clientName: lead.customerName || '',
      });
      const data = response.data;
      if (data.isSuccess) {
        setSetupResult(data.data);
        Alert.alert('Success', 'Meeting setup ready! Tap "Send to Client" to invite.');
        fetchMeetings();
      } else { Alert.alert('Error', data.message || 'Failed'); }
    } catch { Alert.alert('Error', 'Network error'); }
    setMeetingLoading(false);
  };

  const handleSendToClient = async () => {
    if (!setupResult) return;
    setMeetingLoading(true);
    try {
      const response = await api.post(`/meetingschedule/send/${setupResult.meetingId}`);
      const data = response.data;
      if (data.isSuccess) {
        Alert.alert('Sent!', `Invitation sent to ${lead.emailAddress}`);
        setSetupResult(null);
        setMeetingModal(false);
        fetchMeetings();
      }
    } catch { Alert.alert('Error', 'Failed'); }
    setMeetingLoading(false);
  };

  if (loading) return <ActivityIndicator size="large" color="#1976d2" style={styles.loader} />;
  if (!lead) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{lead.customerName || lead.companyName || 'Lead'}</Text>
        <TouchableOpacity onPress={() => setEditModal(true)} style={styles.headerBtn}>
          <Icon name="create-outline" size={22} color="#1976d2" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteLead} style={styles.headerBtn}>
          <Icon name="trash-outline" size={22} color="#d32f2f" />
        </TouchableOpacity>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[lead.status] || '#757575' }]}>
          <Text style={styles.statusText}>{lead.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <InfoRow icon="person" label="Customer" value={lead.customerName} />
        <InfoRow icon="business" label="Company" value={lead.companyName || '-'} />
        <InfoRow icon="mail" label="Email" value={lead.emailAddress || '-'} />
        <InfoRow icon="call" label="Mobile" value={lead.mobileNumber || '-'} />
        <InfoRow icon="globe" label="Website" value={lead.website || '-'} />
        <InfoRow icon="cash" label="Value" value={lead.value ? `$${lead.value.toLocaleString()}` : '-'} />
        <InfoRow icon="pricetag" label="Source" value={lead.source?.startsWith('AI_') ? `AI (${lead.source.replace('AI_', '')})` : lead.source} />
        <InfoRow icon="hash" label="Lead #" value={lead.leadNumber} />
        {lead.taxId && <InfoRow icon="document-text" label="Tax ID" value={lead.taxId} />}
        {lead.annualRevenue && <InfoRow icon="trending-up" label="Revenue" value={`$${lead.annualRevenue.toLocaleString()}`} />}
        {lead.employeeCount && <InfoRow icon="people" label="Employees" value={String(lead.employeeCount)} />}
        <InfoRow icon="time" label="Created" value={safeDate(lead.createdAt)} />
        <InfoRow icon="time" label="Updated" value={safeDate(lead.updatedAt)} />
      </View>

      {lead.addresses?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Addresses ({lead.addresses.length})</Text>
          {lead.addresses.map((addr: any) => (
            <View key={addr.id} style={styles.addressCard}>
              <View style={styles.addressLabel}>
                <Icon name="location" size={14} color="#00c9a7" />
                <Text style={styles.addressLabelText}>{addr.label}</Text>
              </View>
              {addr.addressLine1 && <InfoRow icon="location" label="Address" value={addr.addressLine1} />}
              {addr.addressLine2 && <InfoRow icon="location" label="" value={addr.addressLine2} />}
              {addr.city && <InfoRow icon="map" label="City" value={addr.city} />}
              {addr.state && <InfoRow icon="map-outline" label="State" value={addr.state} />}
              {addr.postalCode && <InfoRow icon="hash" label="Postal" value={addr.postalCode} />}
              {addr.country && <InfoRow icon="globe" label="Country" value={addr.country} />}
            </View>
          ))}
        </View>
      )}

      {lead.contactPersons?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Persons ({lead.contactPersons.length})</Text>
          {lead.contactPersons.map((cp: any) => (
            <View key={cp.id} style={styles.contactCard}>
              <Text style={styles.contactName}>{cp.name}</Text>
              {cp.designation && <Text style={styles.contactDesignation}>{cp.designation}</Text>}
              {cp.phone && <InfoRow icon="call" label="Phone" value={cp.phone} />}
              {cp.mobile && <InfoRow icon="phone-portrait" label="Mobile" value={cp.mobile} />}
              {cp.email && <InfoRow icon="mail" label="Email" value={cp.email} />}
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Status</Text>
        <View style={styles.statusGrid}>
          {Object.keys(statusColors).map((s) => (
            <TouchableOpacity key={s} style={[styles.statusButton, lead.status === s && styles.statusButtonActive, { borderColor: statusColors[s] }]}
              onPress={() => handleStatusChange(s)}>
              <Text style={[styles.statusButtonText, lead.status === s && { color: '#fff' }, { color: statusColors[s] }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meetings ({meetings.length})</Text>
          <TouchableOpacity style={styles.addMeetingBtn} onPress={() => { setMeetingModal(true); setMeetingTitle(`Meeting with ${lead.customerName}`); setSetupResult(null); }}>
            <Icon name="add-circle" size={20} color="#1976d2" />
            <Text style={styles.addMeetingText}>Schedule</Text>
          </TouchableOpacity>
        </View>
        {meetings.length === 0 ? (
          <Text style={styles.noMeetings}>No meetings scheduled</Text>
        ) : meetings.map((m: any) => (
          <View key={m.id} style={styles.meetingCard}>
            <View style={styles.meetingHeader}>
              <Text style={styles.meetingTitle}>{m.title}</Text>
              <View style={[styles.setupBadge, { backgroundColor: (setupStatusColors[m.setupStatus] || '#999') + '20' }]}>
                <Text style={[styles.setupText, { color: setupStatusColors[m.setupStatus] || '#999' }]}>{m.setupStatus || m.status || 'Unknown'}</Text>
              </View>
            </View>
            <Text style={styles.meetingMeta}>{m.meetingType} | {safeDateTime(m.scheduledDate)}</Text>
            <View style={styles.meetingInfo}>
              <Text style={styles.meetingInfoLabel}>Set up by: {m.createdByName || m.setupByName || 'Unknown'}</Text>
              <Text style={styles.meetingInfoLabel}>Client: {m.clientResponse === 'Accepted' ? '✓ Accepted' : m.clientResponse === 'Declined' ? '✗ Declined' : '⏳ Pending'}</Text>
            </View>
            {m.meetingUrl && (
              <TouchableOpacity style={styles.meetingLink} onPress={() => Alert.alert('Meeting URL', m.meetingUrl)}>
                <Icon name="link" size={14} color="#1976d2" />
                <Text style={styles.meetingLinkText} numberOfLines={1}>{m.meetingUrl}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Follow-ups ({followUps.length})</Text>
        {followUps.length === 0 ? (
          <Text style={styles.noMeetings}>No follow-ups scheduled</Text>
        ) : followUps.map((f: any) => (
          <View key={f.id} style={styles.meetingCard}>
            <View style={styles.meetingHeader}>
              <Text style={styles.meetingTitle}>{f.notes || 'Follow-up'}</Text>
              <View style={[styles.setupBadge, { backgroundColor: (f.status === 'Completed' ? '#4caf50' : f.status === 'Overdue' ? '#d32f2f' : '#ffc107') + '20' }]}>
                <Text style={[styles.setupText, { color: f.status === 'Completed' ? '#4caf50' : f.status === 'Overdue' ? '#d32f2f' : '#ffc107' }]}>{f.status}</Text>
              </View>
            </View>
            <Text style={styles.meetingMeta}>{safeDateTime(f.scheduledDate)} {f.scheduledTime ? `at ${f.scheduledTime}` : ''}</Text>
            <Text style={styles.meetingInfoLabel}>By: {f.userName || 'Unknown'}</Text>
          </View>
        ))}
      </View>

      <Modal visible={meetingModal} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule Meeting</Text>
            <TouchableOpacity onPress={() => setMeetingModal(false)}><Icon name="close" size={24} color="#333" /></TouchableOpacity>
          </View>

          <Text style={styles.label}>Meeting Type</Text>
          <View style={styles.typeGrid}>
            {meetingTypes.map((t) => (
              <TouchableOpacity key={t.value} style={[styles.typeCard, meetingType === t.value && { borderColor: t.color, backgroundColor: t.color + '10' }]}
                onPress={() => setMeetingType(t.value)}>
                <Text style={styles.typeIcon}>{t.icon}</Text>
                <Text style={[styles.typeLabel, meetingType === t.value && { color: t.color }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Title</Text>
          <TextInput style={styles.input} value={meetingTitle} onChangeText={setMeetingTitle} placeholder="Meeting title" />

          <Text style={styles.label}>Date & Time</Text>
          <TextInput style={styles.input} value={meetingDate} onChangeText={setMeetingDate} placeholder="YYYY-MM-DDTHH:MM" />

          <Text style={styles.label}>Duration (minutes)</Text>
          <TextInput style={styles.input} value={meetingDuration} onChangeText={setMeetingDuration} keyboardType="numeric" placeholder="30" />

          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, { height: 80 }]} value={meetingDesc} onChangeText={setMeetingDesc} multiline placeholder="Optional description" />

          {!setupResult ? (
            <TouchableOpacity style={[styles.primaryBtn, meetingLoading && styles.btnDisabled]} onPress={handleSetupMeeting} disabled={meetingLoading}>
              {meetingLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Setup Meeting</Text>}
            </TouchableOpacity>
          ) : (
            <View style={styles.setupResult}>
              <View style={styles.setupSuccess}>
                <Icon name="checkmark-circle" size={24} color="#4caf50" />
                <Text style={styles.setupSuccessText}>Meeting Ready!</Text>
              </View>
              <Text style={styles.setupUrl}>{setupResult.meetingUrl}</Text>
              <TouchableOpacity style={[styles.primaryBtn, meetingLoading && styles.btnDisabled]} onPress={handleSendToClient} disabled={meetingLoading}>
                {meetingLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send to Client</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </Modal>

      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Lead</Text>
            <TouchableOpacity onPress={() => setEditModal(false)}><Icon name="close" size={24} color="#333" /></TouchableOpacity>
          </View>

          <Text style={styles.label}>Customer Name *</Text>
          <TextInput style={styles.input} value={editForm.customerName} onChangeText={(v) => setEditForm({ ...editForm, customerName: v })} />

          <Text style={styles.label}>Company</Text>
          <TextInput style={styles.input} value={editForm.companyName} onChangeText={(v) => setEditForm({ ...editForm, companyName: v })} />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={editForm.emailAddress} onChangeText={(v) => setEditForm({ ...editForm, emailAddress: v })} keyboardType="email-address" />

          <Text style={styles.label}>Mobile</Text>
          <TextInput style={styles.input} value={editForm.mobileNumber} onChangeText={(v) => setEditForm({ ...editForm, mobileNumber: v })} keyboardType="phone-pad" />

          <Text style={styles.label}>Website</Text>
          <TextInput style={styles.input} value={editForm.website} onChangeText={(v) => setEditForm({ ...editForm, website: v })} keyboardType="url" />

          <Text style={styles.label}>Address</Text>
          <TextInput style={styles.input} value={editForm.address} onChangeText={(v) => setEditForm({ ...editForm, address: v })} />

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>City</Text>
              <TextInput style={styles.input} value={editForm.city} onChangeText={(v) => setEditForm({ ...editForm, city: v })} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>State</Text>
              <TextInput style={styles.input} value={editForm.state} onChangeText={(v) => setEditForm({ ...editForm, state: v })} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Country</Text>
              <TextInput style={styles.input} value={editForm.country} onChangeText={(v) => setEditForm({ ...editForm, country: v })} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Postal Code</Text>
              <TextInput style={styles.input} value={editForm.postalCode} onChangeText={(v) => setEditForm({ ...editForm, postalCode: v })} />
            </View>
          </View>

          <Text style={styles.label}>Value ($)</Text>
          <TextInput style={styles.input} value={editForm.value} onChangeText={(v) => setEditForm({ ...editForm, value: v })} keyboardType="numeric" />

          <Text style={styles.label}>Tax ID / GST</Text>
          <TextInput style={styles.input} value={editForm.taxId} onChangeText={(v) => setEditForm({ ...editForm, taxId: v })} />

          <Text style={styles.label}>Annual Revenue ($)</Text>
          <TextInput style={styles.input} value={editForm.annualRevenue} onChangeText={(v) => setEditForm({ ...editForm, annualRevenue: v })} keyboardType="numeric" />

          <Text style={styles.label}>Employee Count</Text>
          <TextInput style={styles.input} value={editForm.employeeCount} onChangeText={(v) => setEditForm({ ...editForm, employeeCount: v })} keyboardType="numeric" />

          <Text style={styles.label}>Fax</Text>
          <TextInput style={styles.input} value={editForm.fax} onChangeText={(v) => setEditForm({ ...editForm, fax: v })} />

          <Text style={styles.label}>Notes</Text>
          <TextInput style={[styles.input, { height: 60 }]} value={editForm.notes} onChangeText={(v) => setEditForm({ ...editForm, notes: v })} multiline />

          <Text style={styles.label}>Requirements</Text>
          <TextInput style={[styles.input, { height: 60 }]} value={editForm.requirements} onChangeText={(v) => setEditForm({ ...editForm, requirements: v })} multiline />

          <TouchableOpacity style={[styles.primaryBtn, editLoading && styles.btnDisabled]} onPress={handleEditLead} disabled={editLoading}>
            {editLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save Changes</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.deleteBtn]} onPress={handleDeleteLead}>
            <Text style={styles.deleteBtnText}>Delete Lead</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
};

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={infoStyles.row}>
    <Icon name={icon} size={18} color="#999" style={infoStyles.icon} />
    <Text style={infoStyles.label}>{label}</Text>
    <Text style={infoStyles.value}>{value}</Text>
  </View>
);

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  icon: { width: 24, marginRight: 8 },
  label: { width: 80, fontSize: 13, color: '#666' },
  value: { flex: 1, fontSize: 14, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 50, marginBottom: 16 },
  title: { flex: 1, fontSize: 20, fontWeight: 'bold', marginLeft: 12 },
  headerBtn: { padding: 6, marginRight: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  addMeetingBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addMeetingText: { fontSize: 13, color: '#1976d2', fontWeight: '600' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusButton: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  statusButtonActive: { backgroundColor: '#1976d2', borderColor: '#1976d2' },
  statusButtonText: { fontSize: 11, fontWeight: '600' },
  noMeetings: { textAlign: 'center', color: '#999', padding: 20 },
  meetingCard: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, marginBottom: 10 },
  meetingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meetingTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  setupBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  setupText: { fontSize: 11, fontWeight: '600' },
  meetingMeta: { fontSize: 12, color: '#666', marginTop: 4 },
  meetingInfo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  meetingInfoLabel: { fontSize: 11, color: '#888' },
  meetingLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, padding: 8, backgroundColor: '#e3f2fd', borderRadius: 6 },
  meetingLinkText: { fontSize: 12, color: '#1976d2', flex: 1 },
  modalContainer: { flex: 1, backgroundColor: '#fff', padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, fontSize: 14, borderWidth: 1, borderColor: '#e0e0e0' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeCard: { width: '30%', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
  typeIcon: { fontSize: 20, marginBottom: 4 },
  typeLabel: { fontSize: 10, fontWeight: '600', color: '#666', textAlign: 'center' },
  primaryBtn: { backgroundColor: '#1976d2', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 20 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  setupResult: { marginTop: 16 },
  setupSuccess: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#e8f5e9', borderRadius: 8, marginBottom: 12 },
  setupSuccessText: { fontSize: 14, fontWeight: '700', color: '#2e7d32' },
  setupUrl: { fontSize: 12, color: '#1976d2', fontFamily: 'monospace', marginBottom: 12 },
  deleteBtn: { borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#d32f2f' },
  deleteBtnText: { color: '#d32f2f', fontSize: 16, fontWeight: '700' },
  addressCard: { backgroundColor: '#f0fdf9', borderRadius: 10, padding: 12, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#00c9a7' },
  addressLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  addressLabelText: { fontSize: 13, fontWeight: '700', color: '#00c9a7' },
  contactCard: { backgroundColor: '#fdf2f8', borderRadius: 10, padding: 12, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#fa709a' },
  contactName: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  contactDesignation: { fontSize: 12, color: '#94a3b8', marginBottom: 6 },
});

export default LeadDetailScreen;
