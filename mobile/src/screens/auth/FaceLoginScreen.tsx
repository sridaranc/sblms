import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import Icon from '@expo/vector-icons/Ionicons';
import { useAppDispatch } from '../../store/hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../../config';
import { loginSuccess } from '../../store/slices/authSlice';

const { width, height } = Dimensions.get('window');

type FaceStep = 'idle' | 'countdown' | 'capturing' | 'success' | 'error';

const CAMERA_SIZE = Math.min(width * 0.72, 280);

const FaceLoginScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [faceStep, setFaceStep] = useState<FaceStep>('idle');
  const [countdown, setCountdown] = useState(3);
  const [statusMessage, setStatusMessage] = useState('Position your face in the frame');
  const cameraRef = useRef<any>(null);
  const autoCapturTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const faceStepRef = useRef<FaceStep>('idle');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const ringRotation = useRef(new Animated.Value(0)).current;

  // Sync ref to state for async callbacks
  useEffect(() => {
    faceStepRef.current = faceStep;
  }, [faceStep]);

  // Fade in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  // Pulse animation for the face guide ring
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Spinning ring when capturing
  useEffect(() => {
    if (faceStep === 'capturing') {
      const spin = Animated.loop(
        Animated.timing(ringRotation, { toValue: 1, duration: 1200, useNativeDriver: true })
      );
      spin.start();
      return () => spin.stop();
    } else {
      ringRotation.setValue(0);
    }
  }, [faceStep]);

  // Start auto-capture countdown after camera is ready
  useEffect(() => {
    if (permission?.granted && faceStep === 'idle') {
      // Small delay to let camera warm up
      const timer = setTimeout(() => startAutoCountdown(), 800);
      return () => clearTimeout(timer);
    }
    return () => clearTimers();
  }, [permission?.granted]);

  const clearTimers = () => {
    if (autoCapturTimer.current) {
      clearTimeout(autoCapturTimer.current);
      autoCapturTimer.current = null;
    }
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
  };

  const startAutoCountdown = useCallback(() => {
    if (faceStepRef.current !== 'idle') return;
    setFaceStep('countdown');
    setCountdown(3);
    setStatusMessage('Auto-capturing in...');

    let count = 3;
    countdownInterval.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownInterval.current!);
        countdownInterval.current = null;
        if (faceStepRef.current === 'countdown') {
          captureAndLogin();
        }
      }
    }, 1000);
  }, []);

  const captureAndLogin = async () => {
    if (!cameraRef.current || faceStepRef.current === 'capturing' || faceStepRef.current === 'success') return;
    setFaceStep('capturing');
    setLoading(true);
    setStatusMessage('Recognizing your face...');
    clearTimers();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: false, // Don't get base64 yet, we'll resize first
        quality: 0.5,
        exif: false,
        skipProcessing: Platform.OS === 'android', // Speeds up capture on Android
      });

      // Resize image to max 640px width to reduce payload size
      const manipResult = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 640 } }],
        { compress: 0.7, format: SaveFormat.JPEG, base64: true }
      );

      let base64Data: string = manipResult.base64 || '';
      // Strip data URI prefix if present
      if (base64Data.startsWith('data:image')) {
        base64Data = base64Data.split(',')[1];
      }
      await performFaceLogin(base64Data);
    } catch (err) {
      setFaceStep('error');
      setStatusMessage('Failed to capture photo. Retrying...');
      setLoading(false);
      autoCapturTimer.current = setTimeout(() => {
        setFaceStep('idle');
        startAutoCountdown();
      }, 2500);
    }
  };

  const performFaceLogin = async (base64Image: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/face-login-image`, {
        imageBase64: base64Image,
        threshold: 0.6,
      }, { timeout: 30000 });

      const data = response.data.data;
      if (response.data.isSuccess && data) {
        setFaceStep('success');
        setStatusMessage(`Welcome, ${data.user?.firstName || 'User'}!`);
        Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
        await AsyncStorage.setItem('accessToken', data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
        dispatch(loginSuccess({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken }));
        setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        }, 1400);
      } else {
        const msg = response.data.message || 'Face not recognized. Please try again.';
        setFaceStep('error');
        setStatusMessage(msg);
        setLoading(false);
        autoCapturTimer.current = setTimeout(() => {
          setFaceStep('idle');
          setStatusMessage('Position your face in the frame');
          startAutoCountdown();
        }, 3000);
      }
    } catch (err: any) {
      let msg = 'Face login failed. Please try again.';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Request timed out. Check your network connection.';
      } else if (!err.response) {
        msg = 'Cannot reach server. Check your network.';
      } else {
        msg = err.response?.data?.message || msg;
      }
      setFaceStep('error');
      setStatusMessage(msg);
      setLoading(false);
      autoCapturTimer.current = setTimeout(() => {
        setFaceStep('idle');
        setStatusMessage('Position your face in the frame');
        startAutoCountdown();
      }, 3000);
    }
  };

  const getRingColor = () => {
    if (faceStep === 'success') return '#00c9a7';
    if (faceStep === 'error') return '#ff6b6b';
    if (faceStep === 'capturing') return '#667eea';
    if (faceStep === 'countdown') return '#ffc107';
    return 'rgba(255,255,255,0.55)';
  };

  const getStatusIcon = () => {
    if (faceStep === 'countdown') return 'timer-outline';
    if (faceStep === 'capturing') return 'cloud-upload-outline';
    if (faceStep === 'success') return 'checkmark-circle';
    if (faceStep === 'error') return 'warning-outline';
    return 'scan-outline';
  };

  const getStatusColor = () => {
    if (faceStep === 'success') return '#00c9a7';
    if (faceStep === 'error') return '#ff6b6b';
    if (faceStep === 'capturing') return '#667eea';
    if (faceStep === 'countdown') return '#ffc107';
    return '#aaa';
  };

  // ─── Permission screens ──────────────────────────────────────────────────────

  if (!permission) {
    return (
      <View style={styles.permissionScreen}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.permissionText}>Requesting camera access...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <View style={styles.permissionCard}>
          <View style={styles.permissionIconWrap}>
            <Icon name="camera" size={40} color="#667eea" />
          </View>
          <Text style={styles.permissionTitle}>Camera Required</Text>
          <Text style={styles.permissionSubtitle}>
            Face login needs camera access to verify your identity securely.
          </Text>
          <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
            <Icon name="camera-outline" size={18} color="#fff" />
            <Text style={styles.grantButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.textButton} onPress={() => navigation.goBack()}>
            <Text style={styles.textButtonLabel}>Back to Password Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main screen ─────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />

      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blobTopLeft]} />
      <View style={[styles.blob, styles.blobBottomRight]} />

      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        {/* Header */}
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => { clearTimers(); navigation.goBack(); }}
              style={styles.backIcon}
            >
              <Icon name="arrow-back" size={20} color="#667eea" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Face Login</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>

        {/* Status message */}
        <Text style={styles.subtitle}>{statusMessage}</Text>

        {/* Camera ring + preview */}
        <View style={styles.cameraWrapper}>
          {/* Outer glow ring */}
          <Animated.View
            style={[
              styles.ringOuter,
              {
                borderColor: getRingColor(),
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* Inner ring + camera */}
          <View style={[styles.cameraContainer, { borderColor: getRingColor() }]}>
            <CameraView
              style={styles.camera}
              ref={cameraRef}
              facing="front"
            >
              {/* Countdown overlay */}
              {faceStep === 'countdown' && (
                <View style={styles.overlay}>
                  <Text style={styles.countdownText}>{countdown}</Text>
                </View>
              )}

              {/* Capturing overlay */}
              {faceStep === 'capturing' && (
                <View style={[styles.overlay, styles.overlayDark]}>
                  <ActivityIndicator size="large" color="#667eea" />
                  <Text style={styles.overlayLabel}>Recognizing...</Text>
                </View>
              )}

              {/* Success overlay */}
              {faceStep === 'success' && (
                <View style={[styles.overlay, styles.overlaySuccess]}>
                  <Animated.View style={{ transform: [{ scale: successAnim }] }}>
                    <Icon name="checkmark-circle" size={72} color="#fff" />
                  </Animated.View>
                  <Text style={styles.overlayLabel}>Verified!</Text>
                </View>
              )}

              {/* Error overlay */}
              {faceStep === 'error' && (
                <View style={[styles.overlay, styles.overlayError]}>
                  <Icon name="close-circle" size={72} color="#fff" />
                  <Text style={styles.overlayLabel}>Not Recognized</Text>
                </View>
              )}

              {/* Face guide oval — solid border (dashed not supported on Android) */}
              <View style={styles.faceGuideWrap}>
                <View style={[styles.faceGuide, { borderColor: getRingColor() }]} />
              </View>
            </CameraView>
          </View>
        </View>

        {/* Status badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { borderColor: getStatusColor() + '40' }]}>
            <Icon name={getStatusIcon() as any} size={15} color={getStatusColor()} />
            <Text style={[styles.statusLabel, { color: getStatusColor() }]}>
              {faceStep === 'countdown'
                ? `Auto-capture in ${countdown}s`
                : faceStep === 'idle'
                ? 'Starting camera...'
                : faceStep === 'capturing'
                ? 'Verifying your face'
                : faceStep === 'success'
                ? 'Identity confirmed'
                : 'Retrying...'}
            </Text>
          </View>
        </View>

        {/* Manual capture button */}
        {(faceStep === 'idle' || faceStep === 'countdown') && (
          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => { clearTimers(); captureAndLogin(); }}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Icon name="camera" size={22} color="#fff" />
            <Text style={styles.captureButtonText}>Capture Now</Text>
          </TouchableOpacity>
        )}

        {/* Tips */}
        <View style={styles.tips}>
          <Icon name="information-circle-outline" size={14} color="rgba(255,255,255,0.3)" />
          <Text style={styles.tipsText}>Ensure good lighting and look directly at the camera</Text>
        </View>

        <TouchableOpacity
          style={styles.textButton}
          onPress={() => { clearTimers(); navigation.goBack(); }}
        >
          <Text style={styles.textButtonLabel}>Use Password Instead</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ─── Containers ──────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  // ─── Decorative blobs ────────────────────────────────────────────────────────
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.08,
  },
  blobTopLeft: {
    backgroundColor: '#667eea',
    top: -100,
    left: -100,
  },
  blobBottomRight: {
    backgroundColor: '#764ba2',
    bottom: -100,
    right: -100,
  },

  // ─── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: width - 40,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    marginBottom: 6,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(102,126,234,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Subtitle ────────────────────────────────────────────────────────────────
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // ─── Camera ──────────────────────────────────────────────────────────────────
  cameraWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  ringOuter: {
    position: 'absolute',
    width: CAMERA_SIZE + 28,
    height: CAMERA_SIZE + 28,
    borderRadius: (CAMERA_SIZE + 28) / 2,
    borderWidth: 2,
  },
  cameraContainer: {
    width: CAMERA_SIZE,
    height: CAMERA_SIZE,
    borderRadius: CAMERA_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 2,
  },
  camera: {
    flex: 1,
  },

  // ─── Overlays (use explicit positioning — `inset` is web-only) ───────────────
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayDark: {
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  overlaySuccess: {
    backgroundColor: 'rgba(0,201,167,0.45)',
  },
  overlayError: {
    backgroundColor: 'rgba(255,107,107,0.45)',
  },
  countdownText: {
    fontSize: 90,
    fontWeight: '900',
    color: '#ffc107',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  overlayLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // ─── Face guide ──────────────────────────────────────────────────────────────
  faceGuideWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceGuide: {
    width: CAMERA_SIZE * 0.68,
    height: CAMERA_SIZE * 0.68,
    borderRadius: (CAMERA_SIZE * 0.68) / 2,
    borderWidth: 1.5,
    // NOTE: borderStyle 'dashed' is not supported on Android, using solid
  },

  // ─── Status badge ────────────────────────────────────────────────────────────
  statusRow: {
    marginBottom: 20,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },

  // ─── Capture button ──────────────────────────────────────────────────────────
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 32,
    elevation: 6,
    shadowColor: '#667eea',
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    marginBottom: 18,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },

  // ─── Tips ────────────────────────────────────────────────────────────────────
  tips: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  tipsText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    marginLeft: 5,
    textAlign: 'center',
  },

  // ─── Text button ─────────────────────────────────────────────────────────────
  textButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  textButtonLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontWeight: '500',
  },

  // ─── Permission screens ──────────────────────────────────────────────────────
  permissionScreen: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 16,
  },
  permissionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  permissionIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(102,126,234,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  permissionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  grantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginBottom: 14,
    width: '100%',
    justifyContent: 'center',
  },
  grantButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default FaceLoginScreen;
