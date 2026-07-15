import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, Modal, Animated, Dimensions, RefreshControl,
  AppState
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as Location from 'expo-location';
import Icon from '@expo/vector-icons/Ionicons';
import { useAppSelector } from '../../store/hooks';
import { attendanceAPI } from '../../api/api';
import { ManualAttendanceModal } from './ManualAttendanceModal';

const { width } = Dimensions.get('window');
const CAMERA_SIZE = width * 0.75;

type CameraStep = 'idle' | 'countdown' | 'capturing' | 'success' | 'error';
type ActionType = 'checkin' | 'checkout';

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  checkInLocation: string;
  checkOutLocation: string;
  hours: number;
  status: string;
  faceVerified: boolean;
}

const AttendanceScreen = ({ navigation }: any) => {
  const { user } = useAppSelector((state: any) => state.auth);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ totalPresent: 0, totalLate: 0, avgHours: 0 });
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Location state
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Camera modal state
  const [cameraVisible, setCameraVisible] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionType>('checkin');
  const [cameraStep, setCameraStep] = useState<CameraStep>('idle');
  const [countdown, setCountdown] = useState(3);
  const [statusMessage, setStatusMessage] = useState('');
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<any>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoCaptureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraStepRef = useRef<CameraStep>('idle');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    cameraStepRef.current = cameraStep;
  }, [cameraStep]);

  const canManualEntry = user?.roles?.includes('Admin') || user?.roles?.includes('Manager') || user?.roles?.includes('SuperAdmin');

  // Pulse animation for ring
  useEffect(() => {
    if (!cameraVisible) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 850, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 850, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [cameraVisible]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTodayRecord();
      fetchStats();
      fetchHistory();
      fetchCurrentLocation();
    }, [])
  );

  // Refresh data when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        fetchTodayRecord();
        fetchStats();
        fetchHistory();
        fetchCurrentLocation();
      }
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const fetchCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      const addr = geocode.length > 0
        ? `${geocode[0].name || ''} ${geocode[0].street || ''}, ${geocode[0].city || ''}, ${geocode[0].region || ''} ${geocode[0].postalCode || ''}`.trim()
        : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      setCurrentLocation({ latitude, longitude, address: addr });
    } catch (err) {
      console.log('Location fetch failed:', err);
    }
    setLocationLoading(false);
  };

  const fetchTodayRecord = async (): Promise<any> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('[Attendance] Fetching today record:', { userId: user?.id, startDate: today, endDate: today });
      const res = await attendanceAPI.getAttendance({ userId: user?.id, startDate: today, endDate: today });
      console.log('[Attendance] Today response:', JSON.stringify(res.data).substring(0, 500));
      const records = res.data.data || [];
      // Get the most recent record for today (sorted by checkIn time, latest first)
      const latest = records.length > 0 ? records[0] : null;
      setTodayRecord(latest);
      return latest;
    } catch (err: any) {
      console.log('[Attendance] Failed to fetch attendance:', err?.response?.data?.message || err?.message || err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const month = new Date().toISOString().slice(0, 7);
      console.log('[Attendance] Fetching stats:', { userId: user?.id, month });
      const res = await attendanceAPI.getStats({
        userId: user?.id,
        month: month,
      });
      console.log('[Attendance] Stats response:', JSON.stringify(res.data).substring(0, 500));
      const raw = res.data.data || {};
      // Backend returns camelCase: presentDays, lateDays, averageHours
      setStats({
        totalPresent: raw.presentDays ?? raw.totalPresent ?? 0,
        totalLate: raw.lateDays ?? raw.totalLate ?? 0,
        avgHours: Number(raw.averageHours ?? raw.avgHours ?? 0),
      });
    } catch (err: any) {
      console.log('[Attendance] Failed to fetch stats:', err?.response?.data?.message || err?.message || err);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      console.log('[Attendance] Fetching history:', { userId: user?.id, startDate, endDate });
      const res = await attendanceAPI.getAttendance({ userId: user?.id, startDate, endDate });
      console.log('[Attendance] History response:', JSON.stringify(res.data).substring(0, 500));
      const records = res.data.data || [];
      setHistory(records);
    } catch (err: any) {
      console.log('[Attendance] Failed to fetch history:', err?.response?.data?.message || err?.message || err);
    }
    setHistoryLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTodayRecord(), fetchStats(), fetchHistory(), fetchCurrentLocation()]);
    setRefreshing(false);
  };

  const clearTimers = () => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    if (autoCaptureTimer.current) {
      clearTimeout(autoCaptureTimer.current);
      autoCaptureTimer.current = null;
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required for face verification.');
        return;
      }
    }

    // ALWAYS re-fetch from server before opening camera to get true current state.
    // This prevents conflicts where check-in was done on web/another device.
    setLoading(true);
    const freshRecord = await fetchTodayRecord();
    await fetchCurrentLocation();

    // Determine correct action from fresh server data:
    // - No record OR last session is fully checked-out => Check In
    // - Record exists and has checkIn but no checkOut => Check Out
    let resolvedAction: ActionType;
    if (!freshRecord || (freshRecord.checkIn && freshRecord.checkOut)) {
      resolvedAction = 'checkin';
    } else if (freshRecord.checkIn && !freshRecord.checkOut) {
      resolvedAction = 'checkout';
    } else {
      resolvedAction = 'checkin';
    }

    console.log('[Attendance] OpenCamera resolved action:', resolvedAction, 'freshRecord:', freshRecord);

    setCurrentAction(resolvedAction);
    setCameraStep('idle');
    setCountdown(3);
    setStatusMessage(resolvedAction === 'checkin' ? 'Position your face to Check In' : 'Position your face to Check Out');
    setCameraVisible(true);
    autoCaptureTimer.current = setTimeout(() => startCountdown(), 1200);
  };

  const closeCamera = () => {
    clearTimers();
    setCameraVisible(false);
    setCameraStep('idle');
    setChecking(false);
  };

  const startCountdown = useCallback(() => {
    if (cameraStepRef.current !== 'idle') return;
    setCameraStep('countdown');
    setStatusMessage('Auto-capturing in...');
    let count = 3;
    setCountdown(count);
    countdownInterval.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownInterval.current!);
        countdownInterval.current = null;
        if (cameraStepRef.current === 'countdown') {
          capturePhoto();
        }
      }
    }, 1000);
  }, []);

  const capturePhoto = async () => {
    if (!cameraRef.current || cameraStepRef.current === 'capturing' || cameraStepRef.current === 'success') return;
    setCameraStep('capturing');
    setStatusMessage('Verifying your face...');
    setChecking(true);
    clearTimers();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: false,
        quality: 0.5,
      });

      const manipResult = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 640 } }],
        { compress: 0.7, format: SaveFormat.JPEG, base64: true }
      );

      let base64Data = manipResult.base64 || '';
      if (base64Data.startsWith('data:image')) {
        base64Data = base64Data.split(',')[1];
      }

      await submitAttendance(base64Data);
    } catch (err) {
      setCameraStep('error');
      setStatusMessage('Failed to capture. Retrying...');
      setChecking(false);
      autoCaptureTimer.current = setTimeout(() => {
        setCameraStep('idle');
        startCountdown();
      }, 2000);
    }
  };

  const submitAttendance = async (base64Image: string) => {
    try {
      const payload = {
        imageBase64: base64Image,
        location: currentLocation?.address || 'Unknown location',
        latitude: currentLocation?.latitude || 0,
        longitude: currentLocation?.longitude || 0,
        faceVerified: true,
      };

      if (currentAction === 'checkin') {
        await attendanceAPI.checkIn(payload);
      } else {
        await attendanceAPI.checkOut(payload);
      }

      setCameraStep('success');
      setStatusMessage(currentAction === 'checkin' ? 'Checked in successfully!' : 'Checked out successfully!');
      setChecking(false);

      autoCaptureTimer.current = setTimeout(() => {
        closeCamera();
        fetchTodayRecord();
        fetchStats();
        fetchHistory();
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || `${currentAction === 'checkin' ? 'Check-in' : 'Check-out'} failed`;
      setCameraStep('error');
      setStatusMessage(msg);
      setChecking(false);

      autoCaptureTimer.current = setTimeout(() => {
        setCameraStep('idle');
        setStatusMessage(currentAction === 'checkin' ? 'Position your face to Check In' : 'Position your face to Check Out');
        startCountdown();
      }, 3000);
    }
  };

  const getRingColor = () => {
    if (cameraStep === 'success') return '#00c9a7';
    if (cameraStep === 'error') return '#ff6b6b';
    if (cameraStep === 'capturing') return '#667eea';
    if (cameraStep === 'countdown') return '#ffc107';
    return 'rgba(255,255,255,0.5)';
  };

  const formatTime = (iso: string) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (iso: string) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present': return '#10b981';
      case 'late': return '#f59e0b';
      case 'absent': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={{ color: '#94a3b8', marginTop: 12 }}>Loading attendance...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667eea" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Attendance</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {canManualEntry && (
            <>
              <TouchableOpacity onPress={() => setManualVisible(true)} style={{ marginRight: 8, backgroundColor: '#667eea', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Manual Entry</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('TeamAttendance')} style={{ marginRight: 12, backgroundColor: '#00c9a7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Team Report</Text>
              </TouchableOpacity>
            </>
          )}
          <View style={styles.avatarBadge}>
            <Icon name="person" size={20} color="#667eea" />
          </View>
        </View>
      </View>

      {/* Location Status */}
      <View style={styles.locationBar}>
        <Icon name="location" size={14} color={currentLocation ? '#10b981' : '#94a3b8'} />
        <Text style={[styles.locationText, { color: currentLocation ? '#10b981' : '#94a3b8' }]} numberOfLines={1}>
          {locationLoading
            ? 'Getting location...'
            : currentLocation
              ? currentLocation.address
              : 'Location not available'}
        </Text>
        {!currentLocation && !locationLoading && (
          <TouchableOpacity onPress={fetchCurrentLocation}>
            <Icon name="refresh" size={14} color="#667eea" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: '#10b981' }]}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.totalPresent}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: '#f59e0b' }]}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.totalLate}</Text>
          <Text style={styles.statLabel}>Late</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: '#667eea' }]}>
          <Text style={[styles.statValue, { color: '#667eea' }]}>{stats.avgHours?.toFixed(1)}h</Text>
          <Text style={styles.statLabel}>Avg Hours</Text>
        </View>
      </View>

      {/* Today's Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusCardHeader}>
          <Icon name="today-outline" size={20} color="#667eea" />
          <Text style={styles.statusTitle}>Today's Status</Text>
        </View>

        {todayRecord ? (
          <View>
            <View style={[
              styles.statusBadge,
              todayRecord.status === 'late' ? styles.lateBadge :
                todayRecord.status === 'absent' ? styles.absentBadge : styles.presentBadge
            ]}>
              <Icon
                name={todayRecord.status === 'late' ? 'time-outline' : todayRecord.status === 'absent' ? 'close-circle-outline' : 'checkmark-circle-outline'}
                size={14}
                color={todayRecord.status === 'late' ? '#92400e' : todayRecord.status === 'absent' ? '#991b1b' : '#166534'}
              />
              <Text style={[
                styles.statusText,
                { color: todayRecord.status === 'late' ? '#92400e' : todayRecord.status === 'absent' ? '#991b1b' : '#166534' }
              ]}>
                {todayRecord.status === 'late' ? 'Late' : todayRecord.status === 'absent' ? 'Absent' : 'Present'}
              </Text>
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeItem}>
                <Icon name="log-in-outline" size={16} color="#667eea" />
                <Text style={styles.timeLabel}>Check In</Text>
                <Text style={styles.timeValue}>{formatTime(todayRecord.checkIn)}</Text>
                {todayRecord.checkInLocation ? (
                  <Text style={styles.locationDetail} numberOfLines={1}>{todayRecord.checkInLocation}</Text>
                ) : null}
              </View>
              <View style={styles.timeDivider} />
              <View style={styles.timeItem}>
                <Icon name="log-out-outline" size={16} color="#f59e0b" />
                <Text style={styles.timeLabel}>Check Out</Text>
                <Text style={styles.timeValue}>
                  {todayRecord.checkOut ? formatTime(todayRecord.checkOut) : 'In progress'}
                </Text>
                {todayRecord.checkOutLocation ? (
                  <Text style={styles.locationDetail} numberOfLines={1}>{todayRecord.checkOutLocation}</Text>
                ) : null}
              </View>
            </View>

            {todayRecord.faceVerified && (
              <View style={styles.verifiedBadge}>
                <Icon name="finger-print" size={14} color="#00c9a7" />
                <Text style={styles.verifiedText}>Face Verified</Text>
              </View>
            )}

            {todayRecord.hours > 0 && (
              <View style={styles.hoursBadge}>
                <Icon name="time" size={14} color="#667eea" />
                <Text style={styles.hoursText}>{todayRecord.hours?.toFixed(1)} hours worked</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.notCheckedInContainer}>
            <Icon name="person-circle-outline" size={60} color="#e2e8f0" />
            <Text style={styles.notCheckedIn}>You haven't checked in today</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {/* Single smart button — always re-checks server state before acting */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            todayRecord?.checkIn && !todayRecord?.checkOut
              ? styles.checkOutButton
              : styles.checkInButton
          ]}
          onPress={() => openCamera()}
          disabled={checking}
        >
          <Icon
            name={todayRecord?.checkIn && !todayRecord?.checkOut ? 'log-out-outline' : 'log-in-outline'}
            size={22}
            color="#fff"
          />
          <Text style={styles.actionButtonText}>
            {todayRecord?.checkIn && !todayRecord?.checkOut ? 'Check Out' : 'Check In'}
          </Text>
          <View style={styles.faceIconBadge}>
            <Icon name="scan-outline" size={12} color="rgba(255,255,255,0.8)" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Attendance History */}
      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <Icon name="time-outline" size={20} color="#667eea" />
          <Text style={styles.historyTitle}>Recent Records</Text>
          <Text style={styles.historyCount}>{history.length} days</Text>
        </View>

        {historyLoading ? (
          <View style={styles.historyLoading}>
            <ActivityIndicator size="small" color="#667eea" />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.historyEmpty}>
            <Icon name="document-text-outline" size={32} color="#e2e8f0" />
            <Text style={styles.historyEmptyText}>No attendance records yet</Text>
          </View>
        ) : (
          history.map((record) => (
            <View key={record.id} style={styles.historyRow}>
              <View style={styles.historyDateCol}>
                <Text style={styles.historyDate}>{formatDate(record.date)}</Text>
                <View style={[styles.historyStatusDot, { backgroundColor: getStatusColor(record.status) }]} />
                <Text style={[styles.historyStatus, { color: getStatusColor(record.status) }]}>
                  {record.status?.charAt(0).toUpperCase() + record.status?.slice(1)}
                </Text>
              </View>
              <View style={styles.historyTimesCol}>
                <View style={styles.historyTimeItem}>
                  <Icon name="log-in-outline" size={12} color="#667eea" />
                  <Text style={styles.historyTime}>{formatTime(record.checkIn)}</Text>
                </View>
                <View style={styles.historyTimeItem}>
                  <Icon name="log-out-outline" size={12} color="#f59e0b" />
                  <Text style={styles.historyTime}>{record.checkOut ? formatTime(record.checkOut) : '-'}</Text>
                </View>
              </View>
              <View style={styles.historyHoursCol}>
                <Text style={styles.historyHours}>{record.hours ? `${record.hours.toFixed(1)}h` : '-'}</Text>
                {record.faceVerified && (
                  <Icon name="finger-print" size={12} color="#00c9a7" />
                )}
              </View>
            </View>
          ))
        )}
      </View>

      <ManualAttendanceModal 
        visible={manualVisible} 
        onClose={() => setManualVisible(false)}
        onSuccess={() => {
          setManualVisible(false);
          fetchHistory();
          fetchTodayRecord();
          fetchStats();
        }}
      />

      {/* Face Camera Modal */}
      <Modal visible={cameraVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={closeCamera}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeCamera} style={styles.modalCloseBtn}>
              <Icon name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {currentAction === 'checkin' ? 'Face Check In' : 'Face Check Out'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Location info in modal */}
          <View style={styles.modalLocationBar}>
            <Icon name="location" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.modalLocationText} numberOfLines={1}>
              {currentLocation?.address || 'Getting location...'}
            </Text>
          </View>

          {/* Status text */}
          <Text style={styles.modalStatus}>{statusMessage}</Text>

          {/* Camera view */}
          <View style={styles.modalCameraWrapper}>
            <Animated.View style={[
              styles.modalRingOuter,
              { borderColor: getRingColor(), transform: [{ scale: pulseAnim }] }
            ]}>
              <View style={[styles.modalCameraContainer, { borderColor: getRingColor() }]}>
                <CameraView style={styles.modalCamera} ref={cameraRef} facing="front">
                  {/* Face guide */}
                  <View style={styles.modalFaceGuideContainer}>
                    <View style={[styles.modalFaceGuide, { borderColor: getRingColor() }]} />
                  </View>

                  {/* Countdown */}
                  {cameraStep === 'countdown' && (
                    <View style={styles.modalOverlay}>
                      <Text style={styles.modalCountdown}>{countdown}</Text>
                    </View>
                  )}

                  {/* Capturing */}
                  {cameraStep === 'capturing' && (
                    <View style={styles.modalOverlay}>
                      <ActivityIndicator size="large" color="#667eea" />
                      <Text style={styles.modalOverlayText}>Verifying...</Text>
                    </View>
                  )}

                  {/* Success */}
                  {cameraStep === 'success' && (
                    <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,201,167,0.5)' }]}>
                      <Icon name="checkmark-circle" size={72} color="#fff" />
                      <Text style={styles.modalOverlayText}>
                        {currentAction === 'checkin' ? 'Checked In!' : 'Checked Out!'}
                      </Text>
                    </View>
                  )}

                  {/* Error */}
                  {cameraStep === 'error' && (
                    <View style={[styles.modalOverlay, { backgroundColor: 'rgba(255,107,107,0.5)' }]}>
                      <Icon name="close-circle" size={72} color="#fff" />
                      <Text style={styles.modalOverlayText}>Verification Failed</Text>
                    </View>
                  )}
                </CameraView>
              </View>
            </Animated.View>
          </View>

          {/* Status badges */}
          <View style={styles.modalStatusRow}>
            {cameraStep === 'countdown' && (
              <View style={styles.modalStatusBadge}>
                <Icon name="timer-outline" size={15} color="#ffc107" />
                <Text style={[styles.modalStatusLabel, { color: '#ffc107' }]}>Auto-capture in {countdown}s</Text>
              </View>
            )}
            {cameraStep === 'capturing' && (
              <View style={styles.modalStatusBadge}>
                <Icon name="cloud-upload-outline" size={15} color="#667eea" />
                <Text style={[styles.modalStatusLabel, { color: '#667eea' }]}>Verifying face...</Text>
              </View>
            )}
            {cameraStep === 'error' && (
              <View style={styles.modalStatusBadge}>
                <Icon name="refresh-outline" size={15} color="#ff6b6b" />
                <Text style={[styles.modalStatusLabel, { color: '#ff6b6b' }]}>Retrying automatically...</Text>
              </View>
            )}
          </View>

          {/* Manual capture button */}
          {(cameraStep === 'idle' || cameraStep === 'countdown') && (
            <TouchableOpacity
              style={[
                styles.modalCaptureBtn,
                { backgroundColor: currentAction === 'checkin' ? '#10b981' : '#f59e0b' }
              ]}
              onPress={() => { clearTimers(); capturePhoto(); }}
            >
              <Icon name="camera" size={22} color="#fff" />
              <Text style={styles.modalCaptureBtnText}>Capture Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  date: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  avatarBadge: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(102,126,234,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  locationBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  locationText: { fontSize: 12, flex: 1 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
    borderTopWidth: 3,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  statusCard: {
    backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16,
    padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, marginBottom: 16,
  },
  statusCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  statusTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 16,
  },
  presentBadge: { backgroundColor: '#dcfce7' },
  lateBadge: { backgroundColor: '#fef3c7' },
  absentBadge: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 13, fontWeight: '600' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  timeItem: { alignItems: 'center', gap: 4, flex: 1 },
  timeDivider: { width: 1, height: 50, backgroundColor: '#e2e8f0' },
  timeLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  timeValue: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  locationDetail: { fontSize: 10, color: '#94a3b8', marginTop: 2, maxWidth: 120, textAlign: 'center' },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 14, backgroundColor: 'rgba(0,201,167,0.08)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center',
  },
  verifiedText: { fontSize: 12, color: '#00c9a7', fontWeight: '600' },
  hoursBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 8, backgroundColor: 'rgba(102,126,234,0.08)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center',
  },
  hoursText: { fontSize: 12, color: '#667eea', fontWeight: '600' },
  notCheckedInContainer: { alignItems: 'center', paddingVertical: 16 },
  notCheckedIn: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
  actionsRow: { paddingHorizontal: 16, gap: 12, paddingBottom: 16 },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 14, paddingVertical: 16, elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8,
    position: 'relative',
  },
  checkInButton: { backgroundColor: '#10b981' },
  checkOutButton: { backgroundColor: '#f59e0b' },
  actionButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  faceIconBadge: { position: 'absolute', right: 16, opacity: 0.8 },
  completedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: 'rgba(0,201,167,0.1)', borderRadius: 14, padding: 16,
  },
  completedText: { fontSize: 15, color: '#00c9a7', fontWeight: '600' },

  // History styles
  historyCard: {
    backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16,
    padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, marginBottom: 24,
  },
  historyHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
  },
  historyTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', flex: 1 },
  historyCount: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  historyLoading: { paddingVertical: 24, alignItems: 'center' },
  historyEmpty: { alignItems: 'center', paddingVertical: 24 },
  historyEmptyText: { fontSize: 13, color: '#94a3b8', marginTop: 8 },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  historyDateCol: { flex: 1.2, gap: 2 },
  historyDate: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  historyStatusDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  historyStatus: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  historyTimesCol: { flex: 1.5, gap: 4 },
  historyTimeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyTime: { fontSize: 12, color: '#475569' },
  historyHoursCol: { flex: 0.6, alignItems: 'flex-end', gap: 2 },
  historyHours: { fontSize: 13, fontWeight: '700', color: '#0f172a' },

  // Modal styles
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
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  modalLocationBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 90, marginBottom: 4, paddingHorizontal: 32,
  },
  modalLocationText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', flex: 1 },
  modalStatus: {
    fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center',
    marginBottom: 20, paddingHorizontal: 32,
  },
  modalCameraWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  modalRingOuter: {
    width: CAMERA_SIZE + 20, height: CAMERA_SIZE + 20, borderRadius: (CAMERA_SIZE + 20) / 2,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
  },
  modalCameraContainer: {
    width: CAMERA_SIZE, height: CAMERA_SIZE, borderRadius: CAMERA_SIZE / 2,
    overflow: 'hidden', borderWidth: 2,
  },
  modalCamera: { flex: 1 },
  modalFaceGuideContainer: {
    position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center',
  },
  modalFaceGuide: {
    width: CAMERA_SIZE * 0.68, height: CAMERA_SIZE * 0.68, borderRadius: CAMERA_SIZE * 0.34,
    borderWidth: 1.5, borderStyle: 'dashed',
  },
  modalOverlay: {
    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  modalCountdown: { fontSize: 90, fontWeight: '900', color: '#ffc107' },
  modalOverlayText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  modalStatusRow: { flexDirection: 'row', marginBottom: 24, height: 30 },
  modalStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  modalStatusLabel: { fontSize: 13, fontWeight: '500' },
  modalCaptureBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 30, paddingVertical: 14, borderRadius: 30,
    elevation: 4, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10,
  },
  modalCaptureBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default AttendanceScreen;
