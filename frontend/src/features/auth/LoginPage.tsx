import { Box, Typography, TextField, Button, Paper, Alert, CircularProgress, Tabs, Tab, LinearProgress, Chip } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoginMutation, useFaceLoginMutation } from '../../api/api';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../store/slices/authSlice';
import { BusinessCenter, Face, Lock, Email, CameraAlt, CheckCircle, RadioButtonUnchecked, Cancel } from '@mui/icons-material';
import { faceRecognitionService, FaceDetectionResult } from '../../services/faceRecognitionService';

interface LoginForm {
  email: string;
  password: string;
}

async function fetchUserPermissions(token: string, roleName: string): Promise<string[]> {
  const headers = { Authorization: `Bearer ${token}` };
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5080/api';

  try {
    const [rolesRes, permissionsRes] = await Promise.all([
      fetch(`${baseUrl}/roles`, { headers }),
      fetch(`${baseUrl}/permissions`, { headers }),
    ]);
    const rolesData = await rolesRes.json();
    const permissionsData = await permissionsRes.json();

    const roles = rolesData?.data || rolesData;
    const allPermissions = permissionsData?.data || permissionsData;

    const matchedRole = Array.isArray(roles)
      ? roles.find((r: any) => r.name?.toLowerCase() === roleName?.toLowerCase())
      : null;

    if (!matchedRole) return [];

    const rolePermsRes = await fetch(`${baseUrl}/roles/${matchedRole.id}/permissions`, { headers });
    const rolePermsData = await rolePermsRes.json();
    const rolePerms = rolePermsData?.data || rolePermsData;

    const assignedPermIds: string[] = rolePerms?.permissionIds || [];
    const permIdToName = new Map<string, string>();
    if (Array.isArray(allPermissions)) {
      allPermissions.forEach((p: any) => permIdToName.set(p.id, p.name));
    }

    return assignedPermIds.map((id) => permIdToName.get(id)).filter(Boolean) as string[];
  } catch {
    return [];
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const registrationSuccess = (location.state as any)?.registered === true;
  const registeredEmail = (location.state as any)?.email || '';
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [login, { isLoading, error }] = useLoginMutation();
  const [faceLogin] = useFaceLoginMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [loginError, setLoginError] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [faceStep, setFaceStep] = useState<'idle' | 'detecting' | 'capturing' | 'success' | 'error'>('idle');
  const [detectionResult, setDetectionResult] = useState<FaceDetectionResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const autoLoginTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const faceStepRef = useRef(faceStep);
  useEffect(() => {
    faceStepRef.current = faceStep;
  }, [faceStep]);

  useEffect(() => {
    faceRecognitionService.loadModels().then(setModelsLoaded);
  }, []);

  useEffect(() => {
    if (activeTab === 1 && modelsLoaded) {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [activeTab, modelsLoaded]);

  useEffect(() => {
    if (cameraActive && videoRef.current && canvasRef.current) {
      faceRecognitionService.startAutoDetection(
        videoRef.current,
        canvasRef.current,
        (result) => {
          setDetectionResult(result);
          setFaceStep(prev => {
            if (prev === 'capturing' || prev === 'success' || prev === 'error') return prev;
            return 'detecting';
          });
          if (result.quality.isGood && faceStepRef.current !== 'capturing' && faceStepRef.current !== 'success' && faceStepRef.current !== 'error') {
            startAutoLogin();
          }
        },
        () => {
          setDetectionResult(null);
          setFaceStep(prev => (prev === 'capturing' || prev === 'success' || prev === 'error') ? prev : 'idle');
          clearAutoLoginTimer();
        }
      );
    }
    return () => {
      faceRecognitionService.stopAutoDetection();
      clearAutoLoginTimer();
    };
  }, [cameraActive]);

  const startCamera = async () => {
    try {
      if (!videoRef.current) return;
      const stream = await faceRecognitionService.startCamera(videoRef.current);
      if (stream) {
        streamRef.current = stream;
        setCameraActive(true);
      } else {
        setLoginError('Camera access denied. Please allow camera permissions.');
        setFaceStep('error');
      }
    } catch {
      setLoginError('Camera access denied. Please allow camera permissions.');
      setFaceStep('error');
    }
  };

  const stopCamera = () => {
    faceRecognitionService.stopAutoDetection();
    clearAutoLoginTimer();
    if (videoRef.current) {
      faceRecognitionService.stopCamera(videoRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setDetectionResult(null);
  };

  const startAutoLogin = useCallback(() => {
    if (autoLoginTimer.current || faceStepRef.current === 'capturing' || faceStepRef.current === 'success' || faceStepRef.current === 'error') return;
    autoLoginTimer.current = setTimeout(() => {
      handleFaceLogin();
    }, 2000);
  }, []);

  const clearAutoLoginTimer = useCallback(() => {
    if (autoLoginTimer.current) {
      clearTimeout(autoLoginTimer.current);
      autoLoginTimer.current = null;
    }
  }, []);

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoginError('');
      const result = await login(data).unwrap();
      const payload = result?.data ?? result;
      const roleName = payload.user.roles?.[0]?.toLowerCase() || 'employee';
      const userData = {
        ...payload.user,
        role: roleName,
      };
      const permissions = await fetchUserPermissions(payload.accessToken, roleName);
      dispatch(setCredentials({ user: userData, accessToken: payload.accessToken, refreshToken: payload.refreshToken, permissions }));
      navigate('/dashboard');
    } catch {
      setLoginError('Invalid email or password');
    }
  };

  const handleFaceLogin = async () => {
    if (!videoRef.current || faceStepRef.current === 'capturing' || faceStepRef.current === 'success') return;
    setFaceStep('capturing');
    setLoginError('');
    clearAutoLoginTimer();

    try {
      let descriptor = detectionResult?.descriptor;
      if (!descriptor) {
        descriptor = (await faceRecognitionService.captureFaceDescriptor(videoRef.current)) ?? undefined;
      }
      if (!descriptor) {
        setLoginError('No face detected. Please position your face in the frame.');
        setFaceStep('error');
        setTimeout(() => {
          setFaceStep('detecting');
          setLoginError('');
        }, 3000);
        return;
      }
      const result = await faceLogin({ faceDescriptor: descriptor }).unwrap();
      const payload = result?.data ?? result;
      const roleName = payload.user.roles?.[0]?.toLowerCase() || 'employee';
      const userData = {
        ...payload.user,
        role: roleName,
      };
      setFaceStep('success');
      const permissions = await fetchUserPermissions(payload.accessToken, roleName);
      dispatch(setCredentials({ user: userData, accessToken: payload.accessToken, refreshToken: payload.refreshToken, permissions }));
      stopCamera();
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err: any) {
      setLoginError(err?.data?.message || 'Face login failed. Please try again.');
      setFaceStep('error');
      setTimeout(() => {
        setFaceStep('detecting');
        setLoginError('');
      }, 3000);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 70) return '#00c9a7';
    if (score >= 40) return '#ffc107';
    return '#ff6b6b';
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 30%, #2d1b69 60%, #4a1a7a 100%)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '-50%', left: '-50%',
        width: '200%', height: '200%',
        background: 'radial-gradient(circle at 30% 40%, rgba(102,126,234,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(118,75,162,0.15) 0%, transparent 50%)',
        animation: 'pulse 8s ease-in-out infinite',
      },
    }}>
      <Paper elevation={0} sx={{
        p: { xs: 3, sm: 5 },
        width: '100%',
        maxWidth: 440,
        borderRadius: '24px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 1,
        mx: 2,
      }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            width: 64, height: 64,
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2,
            boxShadow: '0 8px 24px rgba(102,126,234,0.4)',
          }}>
            <BusinessCenter sx={{ color: 'white', fontSize: 32 }} />
          </Box>
          <Typography variant="h4" fontWeight="800" sx={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            mb: 0.5,
          }}>
            SBLMS
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Smart Business Lead Management System
          </Typography>
        </Box>

        {registrationSuccess && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>
            Account created successfully! Please sign in{registeredEmail ? ` with ${registeredEmail}` : ''}.
          </Alert>
        )}

        {(error || loginError) && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{loginError || 'Login failed'}</Alert>
        )}

        <Tabs
          value={activeTab}
          onChange={(_, v) => { setActiveTab(v); setLoginError(''); setFaceStep('idle'); }}
          sx={{
            mb: 3,
            '& .MuiTabs-indicator': { background: 'linear-gradient(135deg, #667eea, #764ba2)', height: 3 },
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
          }}
        >
          <Tab icon={<Lock />} iconPosition="start" label="Password" sx={{ flex: 1 }} />
          <Tab icon={<Face />} iconPosition="start" label="Face ID" disabled={!modelsLoaded} sx={{ flex: 1 }} />
        </Tabs>

        {activeTab === 0 ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth label="Email Address" type="email" margin="normal" size="small"
              {...register('email', { required: 'Email is required' })}
              error={!!errors.email} helperText={errors.email?.message}
              InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="Password" type="password" margin="normal" size="small"
              {...register('password', { required: 'Password is required' })}
              error={!!errors.password} helperText={errors.password?.message}
              InputProps={{ startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth variant="contained" type="submit" size="large" disabled={isLoading}
              sx={{
                py: 1.5, fontSize: '1rem', borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 24px rgba(102,126,234,0.4)',
                '&:hover': { background: 'linear-gradient(135deg, #5a6fd4 0%, #6a3f96 100%)' },
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>
        ) : (
          <Box>
            <Box sx={{ position: 'relative', mb: 2, borderRadius: '16px', overflow: 'hidden', bgcolor: '#000' }}>
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  borderRadius: '16px',
                  display: 'block',
                  minHeight: 200,
                  maxHeight: '40vh',
                  objectFit: 'cover',
                }}
                autoPlay playsInline muted
              />
              <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />

              {faceStep === 'idle' && !detectionResult && (
                <Box sx={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.6)',
                }}>
                  <CameraAlt sx={{ fontSize: { xs: 36, sm: 48 }, color: 'rgba(255,255,255,0.5)', mb: 1 }} />
                  <Typography color="white" variant="body2">Initializing camera...</Typography>
                </Box>
              )}

              {faceStep === 'capturing' && (
                <Box sx={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.7)',
                }}>
                  <CircularProgress size={48} sx={{ color: '#667eea', mb: 2 }} />
                  <Typography color="white" fontWeight="600">Verifying face...</Typography>
                </Box>
              )}

              {faceStep === 'success' && (
                <Box sx={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,201,167,0.3)',
                }}>
                  <CheckCircle sx={{ fontSize: { xs: 48, sm: 64 }, color: '#00c9a7', mb: 1 }} />
                  <Typography color="white" fontWeight="700" variant="h6">Face Verified!</Typography>
                  <Typography color="rgba(255,255,255,0.8)" variant="body2">Redirecting to dashboard...</Typography>
                </Box>
              )}

              {faceStep === 'error' && (
                <Box sx={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,107,107,0.3)',
                  backdropFilter: 'blur(4px)',
                }}>
                  <Cancel sx={{ fontSize: { xs: 48, sm: 64 }, color: '#ff6b6b', mb: 1 }} />
                  <Typography color="white" fontWeight="700" variant="h6">Verification Failed</Typography>
                  <Typography color="rgba(255,255,255,0.9)" variant="body2">{loginError || 'Please try again'}</Typography>
                </Box>
              )}

              {detectionResult && faceStep !== 'capturing' && faceStep !== 'success' && faceStep !== 'error' && (
                <Box sx={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                  p: { xs: 1.5, sm: 2 }, pt: { xs: 3, sm: 4 },
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    {detectionResult.quality.isGood ? (
                      <CheckCircle sx={{ fontSize: 16, color: '#00c9a7' }} />
                    ) : (
                      <RadioButtonUnchecked sx={{ fontSize: 16, color: getQualityColor(detectionResult.quality.score) }} />
                    )}
                    <Typography variant="body2" color="white" fontWeight="500">
                      {detectionResult.quality.message}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={detectionResult.quality.score}
                    sx={{
                      height: 4, borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getQualityColor(detectionResult.quality.score),
                        borderRadius: 2,
                      },
                    }}
                  />
                  {detectionResult.quality.isGood && (
                    <Typography variant="caption" color="#00c9a7" sx={{ display: 'block', mt: 0.5 }}>
                      Auto-login in 2 seconds...
                    </Typography>
                  )}
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
              <Chip
                icon={<CameraAlt sx={{ fontSize: 14 }} />}
                label={detectionResult ? (detectionResult.quality.isGood ? 'Face Ready' : 'Face Detected') : 'Searching...'}
                size="small"
                color={detectionResult?.quality.isGood ? 'success' : 'default'}
                variant="outlined"
              />
            </Box>

            <Button
              fullWidth variant="contained" size="large"
              onClick={handleFaceLogin}
              disabled={!modelsLoaded || faceStep === 'capturing' || faceStep === 'success'}
              startIcon={faceStep === 'capturing' ? <CircularProgress size={20} /> : <Face />}
              sx={{
                py: 1.5, fontSize: '1rem', borderRadius: '12px',
                background: 'linear-gradient(135deg, #00c9a7 0%, #4facfe 100%)',
                boxShadow: '0 8px 24px rgba(0,201,167,0.4)',
                '&:hover': { background: 'linear-gradient(135deg, #00b894 0%, #3d9edf 100%)' },
              }}
            >
              {faceStep === 'capturing' ? 'Verifying...' : faceStep === 'success' ? 'Verified!' : 'Login with Face ID'}
            </Button>
          </Box>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
          Don't have an account?{' '}
          <Typography
            component="span" variant="body2" color="primary"
            sx={{ cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/register')}
          >
            Register with Face ID
          </Typography>
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
          Demo: sri@sblms.com / Sri@123
        </Typography>
      </Paper>
    </Box>
  );
}
