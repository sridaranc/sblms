import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { clientsAPI } from '../../api/api';

const projectStatusColors: Record<string, string> = {
  Planning: '#0288d1',
  'In Progress': '#ed6c02',
  OnHold: '#757575',
  Completed: '#2e7d32',
  Cancelled: '#d32f2f',
};

const ClientDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    budget: '',
    startDate: '',
    status: 'Planning',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      const response = await clientsAPI.getById(id);
      setClient(response.data.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load client details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async () => {
    if (!newProject.name.trim()) {
      Alert.alert('Error', 'Project name is required');
      return;
    }

    setSubmitting(true);
    try {
      await clientsAPI.addProject(id, {
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        budget: newProject.budget ? parseFloat(newProject.budget) : undefined,
        startDate: newProject.startDate || undefined,
        status: newProject.status,
      });
      Alert.alert('Success', 'Project added successfully');
      setShowAddProject(false);
      setNewProject({ name: '', description: '', budget: '', startDate: '', status: 'Planning' });
      fetchClient();
    } catch (error) {
      Alert.alert('Error', 'Failed to add project');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  if (!client) return null;

  const projects = client.projects || [];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerGradient}>
          <View style={styles.headerOverlay} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarTextLarge}>{getInitials(client.companyName)}</Text>
            </View>
            <Text style={styles.companyName}>{client.companyName}</Text>
            {client.clientNumber && (
              <Text style={styles.clientNumber}>{client.clientNumber}</Text>
            )}
            {client.contactPerson && (
              <Text style={styles.contactPerson}>
                <Icon name="person-outline" size={14} color="rgba(255,255,255,0.8)" /> {client.contactPerson}
              </Text>
            )}
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoGrid}>
            <InfoCard icon="mail" label="Email" value={client.emailAddress || '-'} color="#1976d2" />
            <InfoCard icon="call" label="Phone" value={client.phone || '-'} color="#2e7d32" />
            <InfoCard icon="phone-portrait" label="Mobile" value={client.mobile || '-'} color="#7b1fa2" />
            <InfoCard icon="call" label="Alt Phone" value={client.alternativePhone || '-'} color="#7b1fa2" />
            <InfoCard icon="location" label="Address" value={[client.address, client.city, client.state, client.country, client.postalCode].filter(Boolean).join(', ') || '-'} color="#ed6c02" />
            <InfoCard icon="globe" label="Website" value={client.website || '-'} color="#00897b" />
            <InfoCard icon="briefcase" label="Industry" value={client.industry || '-'} color="#c62828" />
            <InfoCard icon="people" label="Company Size" value={client.companySize || '-'} color="#5c6bc0" />
            <InfoCard icon="business" label="Nature of Business" value={client.natureOfBusiness || '-'} color="#00897b" />
            <InfoCard icon="star" label="Priority" value={client.customerPriority || '-'} color="#ff9800" />
            <InfoCard icon="ribbon" label="Rating" value={client.rating || '-'} color="#ffd600" />
            <InfoCard icon="pricetag" label="Lifetime Value" value={client.lifetimeValue ? `$${client.lifetimeValue.toLocaleString()}` : '-'} color="#2e7d32" />
          </View>
        </View>

        {/* Company Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Details</Text>
          <View style={styles.infoGrid}>
            <InfoCard icon="document-text" label="Reg. Number" value={client.businessRegistrationNumber || '-'} color="#1565c0" />
            <InfoCard icon="card" label="Tax ID" value={client.taxIdentificationNumber || '-'} color="#6a1b9a" />
            <InfoCard icon="receipt" label="GST Number" value={client.gstNumber || '-'} color="#00695c" />
            <InfoCard icon="trending-up" label="Annual Revenue" value={client.annualRevenue || '-'} color="#2e7d32" />
            <InfoCard icon="calendar" label="Year Established" value={client.yearEstablished || '-'} color="#e65100" />
            <InfoCard icon="flag" label="Source" value={client.sourceLeadNumber ? `Lead ${client.sourceLeadNumber}` : '-'} color="#1976d2" />
          </View>
        </View>

        {/* Primary Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Contact</Text>
          <View style={styles.infoGrid}>
            <InfoCard icon="person" label="Contact Person" value={client.contactPerson || '-'} color="#1976d2" />
            <InfoCard icon="mail" label="Contact Email" value={client.contactPersonEmail || '-'} color="#2e7d32" />
            <InfoCard icon="call" label="Contact Phone" value={client.contactPersonPhone || '-'} color="#7b1fa2" />
            <InfoCard icon="id-card" label="Role" value={client.contactPersonRole || '-'} color="#00897b" />
          </View>
        </View>

        {/* Secondary Contact */}
        {(client.secondaryContactName || client.secondaryContactEmail || client.secondaryContactPhone) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Secondary Contact</Text>
            <View style={styles.infoGrid}>
              <InfoCard icon="person" label="Name" value={client.secondaryContactName || '-'} color="#1976d2" />
              <InfoCard icon="mail" label="Email" value={client.secondaryContactEmail || '-'} color="#2e7d32" />
              <InfoCard icon="call" label="Phone" value={client.secondaryContactPhone || '-'} color="#7b1fa2" />
            </View>
          </View>
        )}

        {/* Business & Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business & Payment</Text>
          <View style={styles.infoGrid}>
            <InfoCard icon="chatbubbles" label="Preferred Comm." value={client.preferredCommunication || '-'} color="#1565c0" />
            <InfoCard icon="wallet" label="Payment Terms" value={client.paymentTerms || '-'} color="#6a1b9a" />
            <InfoCard icon="card" label="Credit Limit" value={client.creditLimit || '-'} color="#00695c" />
            <InfoCard icon="cash" label="Currency" value={client.currency || '-'} color="#2e7d32" />
            <InfoCard icon="calendar" label="Contract Start" value={client.contractStartDate || '-'} color="#e65100" />
            <InfoCard icon="calendar" label="Contract End" value={client.contractEndDate || '-'} color="#c62828" />
          </View>
        </View>

        {/* Notes */}
        {client.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={{ fontSize: 14, color: '#555', lineHeight: 20 }}>{client.notes}</Text>
          </View>
        )}

        {/* Tags */}
        {client.tags && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {client.tags.split(',').map((tag: string, i: number) => (
                <View key={i} style={{ backgroundColor: '#e3f2fd', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                  <Text style={{ fontSize: 12, color: '#1565c0', fontWeight: '600' }}>{tag.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Projects Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Projects ({projects.length})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddProject(true)}
            >
              <Icon name="add-circle" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Project</Text>
            </TouchableOpacity>
          </View>

          {projects.length === 0 ? (
            <View style={styles.emptyProjects}>
              <Icon name="folder-open-outline" size={48} color="#ccc" />
              <Text style={styles.emptyProjectsText}>No projects yet</Text>
              <Text style={styles.emptyProjectsSubtext}>Add your first project to get started</Text>
            </View>
          ) : (
            projects.map((project: any) => (
              <View key={project.id} style={styles.projectCard}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <View
                    style={[
                      styles.projectStatusBadge,
                      { backgroundColor: projectStatusColors[project.status] || '#757575' },
                    ]}
                  >
                    <Text style={styles.projectStatusText}>{project.status}</Text>
                  </View>
                </View>
                {project.description && (
                  <Text style={styles.projectDescription} numberOfLines={2}>
                    {project.description}
                  </Text>
                )}
                <View style={styles.projectDetails}>
                  {project.budget && (
                    <View style={styles.projectDetailItem}>
                      <Icon name="cash-outline" size={14} color="#2e7d32" />
                      <Text style={styles.projectBudget}>${project.budget.toLocaleString()}</Text>
                    </View>
                  )}
                  {project.startDate && (
                    <View style={styles.projectDetailItem}>
                      <Icon name="calendar-outline" size={14} color="#1976d2" />
                      <Text style={styles.projectDate}>{formatDate(project.startDate)}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Project Modal */}
      <Modal visible={showAddProject} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Project</Text>
              <TouchableOpacity onPress={() => setShowAddProject(false)}>
                <Icon name="close-circle" size={28} color="#999" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Project Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter project name"
                placeholderTextColor="#999"
                value={newProject.name}
                onChangeText={(text) => setNewProject({ ...newProject, name: text })}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Enter project description"
                placeholderTextColor="#999"
                value={newProject.description}
                onChangeText={(text) => setNewProject({ ...newProject, description: text })}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Budget ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={newProject.budget}
                onChangeText={(text) => setNewProject({ ...newProject, budget: text })}
              />

              <Text style={styles.inputLabel}>Start Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
                value={newProject.startDate}
                onChangeText={(text) => setNewProject({ ...newProject, startDate: text })}
              />

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusSelector}>
                {Object.keys(projectStatusColors).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      newProject.status === status && {
                        backgroundColor: projectStatusColors[status],
                        borderColor: projectStatusColors[status],
                      },
                    ]}
                    onPress={() => setNewProject({ ...newProject, status })}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        newProject.status === status && { color: '#fff' },
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddProject(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleAddProject}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="add-circle" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Add Project</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const InfoCard = ({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) => (
  <View style={infoCardStyles.container}>
    <View style={[infoCardStyles.iconContainer, { backgroundColor: `${color}15` }]}>
      <Icon name={icon} size={18} color={color} />
    </View>
    <Text style={infoCardStyles.label}>{label}</Text>
    <Text style={infoCardStyles.value} numberOfLines={2}>{value}</Text>
  </View>
);

const infoCardStyles = StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  // Header
  headerGradient: {
    backgroundColor: '#1976d2',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarTextLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  clientNumber: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  contactPerson: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  // Sections
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Projects
  emptyProjects: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyProjectsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '600',
  },
  emptyProjectsSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  projectStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  projectStatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  projectDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  projectDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  projectDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  projectBudget: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginLeft: 6,
  },
  projectDate: {
    fontSize: 13,
    color: '#1976d2',
    marginLeft: 6,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  statusSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default ClientDetailScreen;
