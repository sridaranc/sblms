import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Modal, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { aiLeadsAPI } from '../../api/api';

interface AiSearchResult {
  id: string;
  companyName: string;
  contactPerson: string;
  emailAddress: string;
  contactPersonEmail: string;
  phone: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  website: string;
  natureOfBusiness: string;
  industry: string;
  companySize: string;
  linkedinUrl: string;
  foundedYear: number;
  revenueRange: string;
  isDuplicate: boolean;
  isConfirmed: boolean;
}

interface SearchRequest {
  id: string;
  keywords: string;
  country: string;
  industry: string;
  aiProvider: string;
  resultsCount: number;
  status: string;
  userName: string;
  createdAt: string;
}

const countries = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Japan', 'Singapore', 'UAE', 'South Africa', 'Brazil',
];

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
  'Education', 'Real Estate', 'Energy', 'Agriculture', 'Other',
];

const aiProviders = [
  { value: 'Ollama', label: 'Ollama (Local)', color: '#000000', desc: '100% free, local', free: true },
  { value: 'Groq', label: 'Groq (Llama 3)', color: '#f97316', desc: 'Fast inference', free: true },
  { value: 'Google Gemini', label: 'Google Gemini', color: '#4285f4', desc: '15 RPM free', free: true },
  { value: 'HuggingFace', label: 'HuggingFace', color: '#ffd21e', desc: 'Open source', free: true },
  { value: 'OpenAI', label: 'ChatGPT (OpenAI)', color: '#10a37f', desc: 'GPT-4o Mini', free: true },
];

const providerColor: Record<string, string> = {
  Ollama: '#000000', Groq: '#f97316', 'Google Gemini': '#4285f4', HuggingFace: '#ffd21e', OpenAI: '#10a37f',
};

const AiLeadsScreen = ({ navigation }: any) => {
  const [tab, setTab] = useState<'search' | 'history'>('search');
  const [keywords, setKeywords] = useState('');
  const [country, setCountry] = useState('');
  const [industry, setIndustry] = useState('');
  const [prompt, setPrompt] = useState('');
  const [aiProvider, setAiProvider] = useState('Groq');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AiSearchResult[]>([]);
  const [requests, setRequests] = useState<SearchRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SearchRequest | null>(null);
  const [detailResults, setDetailResults] = useState<AiSearchResult[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await aiLeadsAPI.getRequests({ pageNumber: 1, pageSize: 50 });
      if (response.data.isSuccess) setRequests(response.data.data.items);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleSearch = async () => {
    if (!keywords.trim() || !country) {
      Alert.alert('Validation', 'Please enter keywords and select a country');
      return;
    }
    setLoading(true);
    setSearchSuccess(null);
    setSearchError(null);
    try {
      const response = await aiLeadsAPI.search({ keywords, country, industry, prompt, aiProvider });
      const data = response.data;
      if (data.isSuccess) {
        setResults(data.data.results);
        const count = data.data.resultsCount;
        const duplicates = data.data.duplicatesSkipped || 0;
        if (count === 0) {
          setSearchError(`No results found for "${keywords}" in ${country}. Try different keywords.`);
        } else {
          setSearchSuccess(`Found ${count} companies${duplicates > 0 ? ` (${duplicates} duplicates skipped)` : ''}`);
        }
        fetchRequests();
      } else {
        setSearchError(data.message || 'Search failed');
      }
    } catch {
      setSearchError('Network error. Please check your connection.');
    }
    setLoading(false);
  };

  const handleConfirm = async (result: AiSearchResult) => {
    setConfirmingId(result.id);
    try {
      const response = await aiLeadsAPI.confirmLead(result.id);
      const data = response.data;
      if (data.isSuccess) {
        Alert.alert('Success', `Lead created: ${data.data.leadNumber}`);
        setResults(results.map(r => r.id === result.id ? { ...r, isConfirmed: true } : r));
      } else {
        Alert.alert('Error', data.message || 'Failed to confirm lead');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Network error';
      Alert.alert('Error', msg);
    }
    setConfirmingId(null);
  };

  const viewRequestDetail = async (request: SearchRequest) => {
    setSelectedRequest(request);
    setDetailLoading(true);
    try {
      const response = await aiLeadsAPI.getRequestById(request.id);
      if (response.data.isSuccess) setDetailResults(response.data.data.results);
    } catch (err) { console.error(err); }
    setDetailLoading(false);
  };

  const renderProviderCard = (provider: typeof aiProviders[0]) => {
    const isSelected = aiProvider === provider.value;
    return (
      <TouchableOpacity
        key={provider.value}
        style={[styles.providerCard, isSelected && { borderColor: provider.color, backgroundColor: `${provider.color}08` }]}
        onPress={() => setAiProvider(provider.value)}
        activeOpacity={0.7}
      >
        <View style={[styles.providerDot, { backgroundColor: provider.color }]} />
        <View style={styles.providerInfo}>
          <Text style={[styles.providerName, isSelected && { color: provider.color }]}>{provider.label}</Text>
          <Text style={styles.providerDesc}>{provider.desc}</Text>
        </View>
        {provider.free && (
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>FREE</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderResultCard = (result: AiSearchResult) => (
    <View key={result.id} style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <View style={styles.resultAvatar}>
          <Text style={styles.resultAvatarText}>{result.companyName[0]}</Text>
        </View>
        <View style={styles.resultHeaderInfo}>
          <Text style={styles.resultCompanyName} numberOfLines={1}>{result.companyName}</Text>
          <Text style={styles.resultBusiness} numberOfLines={1}>{result.natureOfBusiness}</Text>
        </View>
        <View style={styles.resultBadges}>
          {result.isConfirmed && (
            <View style={[styles.statusChip, { backgroundColor: '#e8f5e9' }]}>
              <Icon name="checkmark-circle" size={12} color="#2e7d32" />
              <Text style={[styles.statusChipText, { color: '#2e7d32' }]}>Confirmed</Text>
            </View>
          )}
          {result.isDuplicate && !result.isConfirmed && (
            <View style={[styles.statusChip, { backgroundColor: '#fff3e0' }]}>
              <Icon name="warning" size={12} color="#ed6c02" />
              <Text style={[styles.statusChipText, { color: '#ed6c02' }]}>Duplicate</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.resultDetails}>
        {result.emailAddress ? (
          <View style={styles.detailRow}>
            <Icon name="mail-outline" size={14} color="#999" />
            <Text style={styles.detailText} numberOfLines={1}>{result.emailAddress}</Text>
          </View>
        ) : null}
        {result.contactPersonEmail ? (
          <View style={styles.detailRow}>
            <Icon name="person-outline" size={14} color="#999" />
            <Text style={styles.detailText} numberOfLines={1}>{result.contactPersonEmail}</Text>
          </View>
        ) : null}
        {(result.phone || result.mobile) ? (
          <View style={styles.detailRow}>
            <Icon name="call-outline" size={14} color="#999" />
            <Text style={styles.detailText}>{result.mobile || result.phone}</Text>
          </View>
        ) : null}
        {result.city ? (
          <View style={styles.detailRow}>
            <Icon name="location-outline" size={14} color="#999" />
            <Text style={styles.detailText} numberOfLines={1}>{result.city}, {result.country}</Text>
          </View>
        ) : null}
        {result.website ? (
          <View style={styles.detailRow}>
            <Icon name="globe-outline" size={14} color="#999" />
            <Text style={styles.detailText} numberOfLines={1}>{result.website}</Text>
          </View>
        ) : null}
        {result.industry ? (
          <View style={styles.detailRow}>
            <Icon name="business-outline" size={14} color="#999" />
            <Text style={styles.detailText} numberOfLines={1}>{result.industry}</Text>
          </View>
        ) : null}
        {result.companySize ? (
          <View style={styles.detailRow}>
            <Icon name="people-outline" size={14} color="#999" />
            <Text style={styles.detailText}>{result.companySize}</Text>
          </View>
        ) : null}
      </View>

      {result.contactPerson ? (
        <View style={styles.contactBox}>
          <Text style={styles.contactLabel}>Contact: {result.contactPerson}</Text>
          {result.contactPersonEmail ? (
            <Text style={styles.contactEmail}>{result.contactPersonEmail}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.extraInfoRow}>
        {result.linkedinUrl ? (
          <TouchableOpacity style={styles.extraChip} onPress={() => {}}>
            <Icon name="logo-linkedin" size={12} color="#0a66c2" />
            <Text style={[styles.extraChipText, { color: '#0a66c2' }]}>LinkedIn</Text>
          </TouchableOpacity>
        ) : null}
        {result.foundedYear ? (
          <View style={styles.extraChip}>
            <Icon name="calendar-outline" size={12} color="#666" />
            <Text style={styles.extraChipText}>Est. {result.foundedYear}</Text>
          </View>
        ) : null}
        {result.revenueRange ? (
          <View style={styles.extraChip}>
            <Icon name="cash-outline" size={12} color="#666" />
            <Text style={styles.extraChipText}>{result.revenueRange}</Text>
          </View>
        ) : null}
      </View>

      {!result.isConfirmed && !result.isDuplicate && (
        <TouchableOpacity
          style={[styles.confirmButton, confirmingId === result.id && styles.confirmButtonDisabled]}
          onPress={() => handleConfirm(result)}
          disabled={confirmingId === result.id}
          activeOpacity={0.7}
        >
          {confirmingId === result.id ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.confirmButtonText}>Confirm as Lead</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHistoryItem = (req: SearchRequest) => (
    <TouchableOpacity
      key={req.id}
      style={styles.historyCard}
      onPress={() => viewRequestDetail(req)}
      activeOpacity={0.7}
    >
      <View style={styles.historyHeader}>
        <Text style={styles.historyKeywords} numberOfLines={1}>{req.keywords}</Text>
        <View style={[styles.historyProviderBadge, { backgroundColor: `${providerColor[req.aiProvider] || '#999'}15` }]}>
          <Text style={[styles.historyProviderText, { color: providerColor[req.aiProvider] || '#999' }]}>{req.aiProvider || 'Unknown'}</Text>
        </View>
      </View>
      <View style={styles.historyMeta}>
        <View style={styles.historyMetaRow}>
          <Icon name="location-outline" size={12} color="#999" />
          <Text style={styles.historyMetaText}>{req.country}</Text>
        </View>
        <View style={styles.historyMetaRow}>
          <Icon name="person-outline" size={12} color="#999" />
          <Text style={styles.historyMetaText}>{req.userName}</Text>
        </View>
      </View>
      <View style={styles.historyFooter}>
        <View style={styles.historyResultsBadge}>
          <Text style={styles.historyResultsText}>{req.resultsCount} found</Text>
        </View>
        <Text style={styles.historyDate}>{new Date(req.createdAt).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    items: string[],
    onSelect: (value: string) => void,
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => { onSelect(item); onClose(); }}>
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Lead Discovery</Text>
        <Text style={styles.headerSubtitle}>Discover real business leads using AI</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'search' && styles.tabActive]}
          onPress={() => setTab('search')}
        >
          <Icon name="sparkles" size={16} color={tab === 'search' ? '#667eea' : '#999'} />
          <Text style={[styles.tabText, tab === 'search' && styles.tabTextActive]}>Search AI</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'history' && styles.tabActive]}
          onPress={() => setTab('history')}
        >
          <Icon name="time" size={16} color={tab === 'history' ? '#667eea' : '#999'} />
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>History ({requests.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {tab === 'search' ? (
          <>
            <Text style={styles.sectionTitle}>Select AI Provider</Text>
            <View style={styles.providersGrid}>
              {aiProviders.map(renderProviderCard)}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Search Parameters</Text>

              <Text style={styles.inputLabel}>Business Keywords *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Software Company, IT Solutions..."
                placeholderTextColor="#aaa"
                value={keywords}
                onChangeText={setKeywords}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Country *</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowCountryPicker(true)}>
                <Text style={[styles.pickerText, !country && { color: '#aaa' }]}>
                  {country || 'Select country'}
                </Text>
                <Icon name="chevron-down" size={18} color="#999" />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Industry (Optional)</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowIndustryPicker(true)}>
                <Text style={[styles.pickerText, !industry && { color: '#aaa' }]}>
                  {industry || 'All Industries'}
                </Text>
                <Icon name="chevron-down" size={18} color="#999" />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Additional Prompt (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe what kind of companies you're looking for..."
                placeholderTextColor="#aaa"
                value={prompt}
                onChangeText={setPrompt}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.searchButton, loading && styles.searchButtonDisabled]}
                onPress={handleSearch}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="search" size={20} color="#fff" />
                    <Text style={styles.searchButtonText}>Search with {aiProviders.find(p => p.value === aiProvider)?.label}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {searchSuccess && (
              <View style={styles.successBanner}>
                <Icon name="checkmark-circle" size={18} color="#2e7d32" />
                <Text style={styles.successText}>{searchSuccess}</Text>
              </View>
            )}

            {searchError && (
              <View style={styles.errorBanner}>
                <Icon name="alert-circle" size={18} color="#d32f2f" />
                <Text style={styles.errorText}>{searchError}</Text>
              </View>
            )}

            {results.length > 0 && (
              <View style={styles.resultsSection}>
                <View style={styles.resultsHeader}>
                  <Text style={styles.sectionTitle}>Results ({results.length})</Text>
                  <Text style={styles.resultsConfirmed}>
                    {results.filter(r => r.isConfirmed).length} confirmed
                  </Text>
                </View>
                {results.map(renderResultCard)}
              </View>
            )}
          </>
        ) : (
          <View style={styles.historySection}>
            {requests.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="time-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No search history yet</Text>
              </View>
            ) : (
              requests.map(renderHistoryItem)
            )}
          </View>
        )}
      </ScrollView>

      {renderPickerModal(showCountryPicker, () => setShowCountryPicker(false), 'Select Country', countries, setCountry)}
      {renderPickerModal(showIndustryPicker, () => setShowIndustryPicker(false), 'Select Industry', ['All Industries', ...industries], (v) => setIndustry(v === 'All Industries' ? '' : v))}

      <Modal visible={!!selectedRequest} animationType="slide">
        <View style={styles.detailModal}>
          <View style={styles.detailHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailTitle} numberOfLines={1}>{selectedRequest?.keywords}</Text>
              {selectedRequest && (
                <View style={[styles.historyProviderBadge, { backgroundColor: `${providerColor[selectedRequest.aiProvider] || '#999'}15`, alignSelf: 'flex-start', marginTop: 4 }]}>
                  <Text style={[styles.historyProviderText, { color: providerColor[selectedRequest.aiProvider] || '#999' }]}>{selectedRequest.aiProvider}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => { setSelectedRequest(null); setDetailResults([]); }}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          {detailLoading ? (
            <ActivityIndicator size="large" color="#667eea" style={{ flex: 1, justifyContent: 'center' }} />
          ) : (
            <ScrollView style={{ flex: 1 }}>
              {detailResults.map(renderResultCard)}
            </ScrollView>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#667eea' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#999' },
  tabTextActive: { color: '#667eea', fontWeight: '600' },
  scrollContent: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 12 },
  providersGrid: { gap: 8 },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: '#eee',
  },
  providerDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 14, fontWeight: '700', color: '#333' },
  providerDesc: { fontSize: 11, color: '#999', marginTop: 2 },
  freeBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  freeBadgeText: { fontSize: 10, fontWeight: '700', color: '#2e7d32' },
  formSection: { marginTop: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 14,
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  pickerButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: { fontSize: 14, color: '#333' },
  searchButton: {
    backgroundColor: '#667eea',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  searchButtonDisabled: { opacity: 0.7 },
  searchButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  successText: { fontSize: 13, color: '#2e7d32', fontWeight: '500', flex: 1 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  errorText: { fontSize: 13, color: '#d32f2f', fontWeight: '500', flex: 1 },
  resultsSection: { marginTop: 20, marginBottom: 40 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultsConfirmed: { fontSize: 12, color: '#2e7d32', fontWeight: '600' },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  resultAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  resultHeaderInfo: { flex: 1 },
  resultCompanyName: { fontSize: 15, fontWeight: '700', color: '#222' },
  resultBusiness: { fontSize: 12, color: '#999', marginTop: 2 },
  resultBadges: { alignItems: 'flex-end', gap: 4 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  statusChipText: { fontSize: 11, fontWeight: '600' },
  resultDetails: { gap: 6, marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: '#555', flex: 1 },
  contactBox: {
    backgroundColor: 'rgba(102,126,234,0.04)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  contactLabel: { fontSize: 12, fontWeight: '600', color: '#555' },
  contactEmail: { fontSize: 12, color: '#777', marginTop: 2 },
  extraInfoRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  extraChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  extraChipText: { fontSize: 11, fontWeight: '600', color: '#666' },
  confirmButton: {
    backgroundColor: '#667eea',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  historySection: { marginBottom: 40 },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyKeywords: { fontSize: 14, fontWeight: '600', color: '#333', flex: 1, marginRight: 8 },
  historyProviderBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  historyProviderText: { fontSize: 11, fontWeight: '700' },
  historyMeta: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  historyMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyMetaText: { fontSize: 12, color: '#999' },
  historyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyResultsBadge: { backgroundColor: '#e3f2fd', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  historyResultsText: { fontSize: 11, fontWeight: '600', color: '#1976d2' },
  historyDate: { fontSize: 12, color: '#999' },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  modalItemText: { fontSize: 15, color: '#333' },
  detailModal: { flex: 1, backgroundColor: '#f5f5f5' },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailTitle: { fontSize: 17, fontWeight: '700', color: '#333' },
});

export default AiLeadsScreen;
