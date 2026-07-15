import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, clearError } from '../../store/slices/authSlice';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) return;
    dispatch(clearError());
    await dispatch(login({ email, password }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />

      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SafeAreaView>
            <Animated.View
              style={[
                styles.content,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* Logo / Brand */}
              <View style={styles.logoWrap}>
                <View style={styles.logoCircle}>
                  <Icon name="briefcase" size={32} color="#fff" />
                </View>
                <Text style={styles.logoText}>SBLMS</Text>
                <Text style={styles.logoSub}>Smart Business Lead Management</Text>
              </View>

              {/* Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Welcome back</Text>
                <Text style={styles.cardSub}>Sign in to your account</Text>

                {/* Error */}
                {error && (
                  <View style={styles.errorBox}>
                    <Icon name="alert-circle-outline" size={16} color="#ff6b6b" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Email field */}
                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Email address</Text>
                  <View style={[styles.inputRow, emailFocused && styles.inputRowFocused]}>
                    <Icon
                      name="mail-outline"
                      size={18}
                      color={emailFocused ? '#667eea' : 'rgba(255,255,255,0.35)'}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                    />
                  </View>
                </View>

                {/* Password field */}
                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Password</Text>
                  <View style={[styles.inputRow, passwordFocused && styles.inputRowFocused]}>
                    <Icon
                      name="lock-closed-outline"
                      size={18}
                      color={passwordFocused ? '#667eea' : 'rgba(255,255,255,0.35)'}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="••••••••"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((v) => !v)}
                      style={styles.eyeBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="rgba(255,255,255,0.4)"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Sign in button */}
                <TouchableOpacity
                  style={[styles.signInBtn, (!email || !password || loading) && styles.signInBtnDisabled]}
                  onPress={handleLogin}
                  disabled={loading || !email || !password}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.signInBtnText}>Sign In</Text>
                      <Icon name="arrow-forward" size={18} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Face ID button */}
                <TouchableOpacity
                  style={styles.faceBtn}
                  onPress={() => navigation.navigate('FaceLogin')}
                  activeOpacity={0.8}
                >
                  <View style={styles.faceBtnInner}>
                    <Icon name="scan-outline" size={20} color="#667eea" />
                    <Text style={styles.faceBtnText}>Login with Face ID</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <Text style={styles.footer}>
                Secure authentication powered by AI face recognition
              </Text>
            </Animated.View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },

  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },

  // ─── Blobs ───────────────────────────────────────────────────────────────────
  blob: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    opacity: 0.09,
  },
  blobTop: {
    backgroundColor: '#667eea',
    top: -120,
    right: -80,
  },
  blobBottom: {
    backgroundColor: '#764ba2',
    bottom: -120,
    left: -80,
  },

  // ─── Layout ──────────────────────────────────────────────────────────────────
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  // ─── Logo ────────────────────────────────────────────────────────────────────
  logoWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#667eea',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 8,
  },
  logoText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  logoSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
    letterSpacing: 0.3,
  },

  // ─── Card ────────────────────────────────────────────────────────────────────
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 22,
  },

  // ─── Error ───────────────────────────────────────────────────────────────────
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.25)',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },

  // ─── Fields ──────────────────────────────────────────────────────────────────
  fieldWrap: {
    marginBottom: 16,
  },
  label: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    height: 50,
  },
  inputRowFocused: {
    borderColor: '#667eea',
    backgroundColor: 'rgba(102,126,234,0.08)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
  },

  // ─── Sign in button ──────────────────────────────────────────────────────────
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 14,
    height: 52,
    marginTop: 6,
    shadowColor: '#667eea',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  signInBtnDisabled: {
    opacity: 0.5,
  },
  signInBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },

  // ─── Divider ─────────────────────────────────────────────────────────────────
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginHorizontal: 12,
  },

  // ─── Face button ─────────────────────────────────────────────────────────────
  faceBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(102,126,234,0.4)',
    overflow: 'hidden',
  },
  faceBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: 'rgba(102,126,234,0.08)',
  },
  faceBtnText: {
    color: '#667eea',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },

  // ─── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
});

export default LoginScreen;
