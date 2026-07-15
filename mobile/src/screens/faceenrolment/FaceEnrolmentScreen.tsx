import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, TextInput, Modal, RefreshControl,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Icon from '@expo/vector-icons/Ionicons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { usersAPI, faceEnrolmentAPI } from '../../api/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  hasFaceDescriptor?: boolean;
}

interface Enrolment {
  userId: string;
  isActive: boolean;
  enrolledAt: string;
  userFullName: string;
}

const FaceEnrolmentScreen = ({ navigation }: any) => {
  const [users, setUsers] = useState<User[]>([]);
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Camera state
  const [cameraVisible, setCameraVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [captureStep, setCaptureStep] = useState<'idle' | 'countdown' | 'capturing' | 'success' | 'error'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [statusMessage, setStatusMessage] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureStepRef = useRef(captureStep);

  useEffect(() => { captureStepRef.current = captureStep; }, [captureStep]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, enrolRes] = await Promise.all([
        usersAPI.getAll({ pageNumber: 1, pageSize: 200 }),
        faceEnrolmentAPI.getAll(),
      ]);
      const usersData = usersRes.data?.data?.items || usersRes.data?.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
      const enrolData = enrolRes.data?.data || [];
      setEnrolments(Array.isArray(enrolData) ? enrolData : []);
    } catch (err) {
      console.log('Failed to fetch data');
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const getEnrolmentForUser = (userId: string) => {
    return enrolments.find(e => e.userId === userId && e.isActive);
  };

  const openCamera = async (user: User) => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required for face enrolment.');
        return;
      }
    }
    setSelectedUser(user);
    setCaptureStep('idle');
    setCountdown(3);
    setStatusMessage('Position your face in the frame');
    setCameraVisible(true);
    setTimeout(() => startCountdown(), 1200);
  };

  const closeCamera = () => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    setCameraVisible(false);
    setCaptureStep('idle');
    setSelectedUser(null);
  };

  const startCountdown = () => {
    if (captureStepRef.current !== 'idle') return;
    setCaptureStep('countdown');
    setStatusMessage('Auto-capturing in...');
    let count = 3;
    setCountdown(count);
    countdownInterval.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownInterval.current!);
        countdownInterval.current = null;
        if (captureStepRef.current === 'countdown') {
          capturePhoto();
        }
      }
    }, 1000);
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || captureStepRef.current === 'capturing' || captureStepRef.current === 'success') return;
    setCaptureStep('capturing');
    setStatusMessage('Enrolling face...');
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: false, // Don't get base64 yet, resize first
        quality: 0.5,
        exif: false,
      });

      // Resize image to max 640px width to reduce payload size
      const manipResult = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 640 } }],
        { compress: 0.7, format: SaveFormat.JPEG, base64: true }
      );

      let base64Data = manipResult.base64 || '';
      if (base64Data.startsWith('data:image')) {
        base64Data = base64Data.split(',')[1];
      }
      await enrollFace(base64Data);
    } catch (err) {
      setCaptureStep('error');
      setStatusMessage('Capture failed. Retrying...');
      setTimeout(() => {
        setCaptureStep('idle');
        setStatusMessage('Position your face in the frame');
        startCountdown();
      }, 2500);
    }
  };

  const enrollFace = async (base64Image: string) => {
    if (!selectedUser) return;
    try {
      const existing = getEnrolmentForUser(selectedUser.id);
      if (existing) {
        await faceEnrolmentAPI.update(selectedUser.id, { imageBase64: base64Image });
      } else {
        await faceEnrolmentAPI.enrol({ userId: selectedUser.id, imageBase64: base64Image });
      }
      setCaptureStep('success');
      setStatusMessage('Face enrolled successfully!');
      setTimeout(() => {
        closeCamera();
        fetchData();
      }, 1500);
    } catch (err: any) {
      setCaptureStep('error');
      setStatusMessage(err.response?.data?.message || 'Enrolment failed');
      setTimeout(() => {
        setCaptureStep('idle');
        setStatusMessage('Position your face in the frame');
        startCountdown();
      }, 3000);
    }
  };

  const handleRemoveEnrolment = (user: User) => {
    const enrolment = getEnrolmentForUser(user.id);
    if (!enrolment) return;

    Alert.alert(
      'Remove Face Enrolment',
      `Remove face enrolment for ${user.firstName} ${user.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await faceEnrolmentAPI.remove(user.id);
              Alert.alert('Success', 'Face enrolment removed');
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to remove');
            }
          },
        },
      ]
    );
  };

  const getRingColor = () => {
    if (captureStep === 'success') return '#00c9a7';
    if (captureStep === 'error') return '#ff6b6b';
    if (captureStep === 'capturing') return '#667eea';
    if (captureStep === 'countdown') return '#ffc107';
    return 'rgba(255,255,255,0.6)';
  };

  const filteredUsers = users.filter(u =>
    u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    enrolled: users.filter(u => getEnrolmentForUser(u.id)).length,
  };

  const renderUser = ({ item }: { item: User }) => {
    const enrolled = !!getEnrolmentForUser(item.id);
    return (
      <View style={[styles.userCard, enrolled && styles.userCardEnrolled]}>
        <View style={styles.userHeader}>
          <View style={[styles.avatar, { backgroundColor: enrolled ? '#00c9a7' : '#667eea' }]}>
            <Text style={styles.avatarText}>{item.firstName?.[0]}{item.lastName?.[0]}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          {enrolled && (
            <View style={styles.enrolledBadge}>
              <Icon name="checkmark-circle" size={16} color="#00c9a7" />
              <Text style={styles.enrolledText}>Enrolled</Text>
            </View>
          )}
        </View>

        <View style={styles.userActions}>
          {enrolled ? (
            <>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fef3c7' }]} onPress={() => openCamera(item)}>
                <Icon name="refresh" size={16} color="#92400e" />
                <Text style={[styles.actionBtnText, { color: '#92400e' }]}>Re-enrol</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} onPress={() => handleRemoveEnrolment(item)}>
                <Icon name="trash" size={16} color="#991b1b" />
                <Text style={[styles.actionBtnText, { color: '#991b1b' }]}>Remove</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ede9fe' }]} onPress={() => openCamera(item)}>
              <Icon name="finger-print" size={16} color="#667eea" />
              <Text style={[styles.actionBtnText, { color: '#667eea' }]}>Enrol Face</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={{ color: '#94a3b8', marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Face Enrolment</Text>
          <Text style={styles.subtitle}>{stats.enrolled}/{stats.total} enrolled</Text>
        </View>
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
            <Icon name="face-recognition" size={60} color="#e2e8f0" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />

      {/* Camera Modal */}
      <Modal visible={cameraVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={closeCamera}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeCamera} style={styles.modalCloseBtn}>
              <Icon name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Enrol - {selectedUser?.firstName}</Text>
            <View style={{ width: 40 }} />
          </View>

          <Text style={styles.modalStatus}>{statusMessage}</Text>

          <View style={styles.cameraWrapper}>
            <View style={[styles.ringOuter, { borderColor: getRingColor() }]}>
              <View style={[styles.cameraContainer, { borderColor: getRingColor() }]}>
                <CameraView style={styles.camera} ref={cameraRef} facing="front">
                  <View style={styles.faceGuideContainer}>
                    <View style={[styles.faceGuide, { borderColor: getRingColor() }]} />
                  </View>

                  {captureStep === 'countdown' && (
                    <View style={styles.overlay}>
                      <Text style={styles.countdownText}>{countdown}</Text>
                    </View>
                  )}
                  {captureStep === 'capturing' && (
                    <View style={styles.overlay}>
                      <ActivityIndicator size="large" color="#667eea" />
                      <Text style={styles.overlayText}>Enrolling...</Text>
                    </View>
                  )}
                  {captureStep === 'success' && (
                    <View style={[styles.overlay, { backgroundColor: 'rgba(0,201,167,0.5)' }]}>
                      <Icon name="checkmark-circle" size={72} color="#fff" />
                      <Text style={styles.overlayText}>Enrolled!</Text>
                    </View>
                  )}
                  {captureStep === 'error' && (
                    <View style={[styles.overlay, { backgroundColor: 'rgba(255,107,107,0.5)' }]}>
                      <Icon name="close-circle" size={72} color="#fff" />
                      <Text style={styles.overlayText}>Failed</Text>
                    </View>
                  )}
                </CameraView>
              </View>
            </View>
          </View>

          {(captureStep === 'idle' || captureStep === 'countdown') && (
            <TouchableOpacity
              style={[styles.captureBtn, { backgroundColor: '#667eea' }]}
              onPress={() => { if (countdownInterval.current) { clearInterval(countdownInterval.current); } capturePhoto(); }}
            >
              <Icon name="camera" size={22} color="#fff" />
              <Text style={styles.captureBtnText}>Capture Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </View>
  );
};

const CAMERA_SIZE = 260;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 16, borderRadius: 12, paddingHorizontal: 14,
    elevation: 2,
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 14, color: '#0f172a' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  userCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 2,
  },
  userCardEnrolled: { borderLeftWidth: 4, borderLeftColor: '#00c9a7' },
  userHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  userEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  enrolledBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  enrolledText: { fontSize: 12, color: '#00c9a7', fontWeight: '600' },
  userActions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 12 },
  // Camera Modal
  modalContainer: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' },
  modalHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  modalCloseBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  modalStatus: {
    fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center',
    marginBottom: 24, paddingHorizontal: 32, marginTop: 110,
  },
  cameraWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  ringOuter: {
    width: CAMERA_SIZE + 20, height: CAMERA_SIZE + 20, borderRadius: (CAMERA_SIZE + 20) / 2,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
  },
  cameraContainer: {
    width: CAMERA_SIZE, height: CAMERA_SIZE, borderRadius: CAMERA_SIZE / 2,
    overflow: 'hidden', borderWidth: 2,
  },
  camera: { flex: 1 },
  faceGuideContainer: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  faceGuide: {
    width: CAMERA_SIZE * 0.68, height: CAMERA_SIZE * 0.68, borderRadius: CAMERA_SIZE * 0.34,
    borderWidth: 1.5, borderStyle: 'dashed',
  },
  overlay: {
    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  countdownText: { fontSize: 80, fontWeight: '900', color: '#ffc107' },
  overlayText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  captureBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 30, paddingVertical: 14, borderRadius: 30,
    elevation: 4,
  },
  captureBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default FaceEnrolmentScreen;
