import { Box, Typography, Button, Alert, CircularProgress, Paper, Backdrop } from '@mui/material';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setCredentials } from '../../store/slices/authSlice';
import { useFaceLoginMutation } from '../../api/api';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { faceRecognitionService } from '../../services/faceRecognitionService';

export default function FaceLogin() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const [faceLogin, { error }] = useFaceLoginMutation();
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState<'camera' | 'capturing'>('camera');
  const { startCamera, stopCamera } = useFaceDetection();
  const { captureFaceDescriptor } = faceRecognitionService;

  useEffect(() => {
    if (isAuthenticated) {
      stopCamera();
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleCapture = async () => {
    if (!videoRef.current) return;

    setStep('capturing');
    setErrorMsg('');

    try {
      const descriptor = await captureFaceDescriptor(videoRef.current);
      
      if (!descriptor) {
        setErrorMsg('No face detected. Please try again.');
        setStep('camera');
        return;
      }

      const result = await faceLogin({ faceDescriptor: descriptor }).unwrap();
      const payload = result?.data ?? result;
      const userData = {
        ...payload.user,
        role: payload.user.roles?.[0]?.toLowerCase() || 'employee',
      };
      dispatch(setCredentials({
        user: userData,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
      }));
      stopCamera();
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Face login failed');
      setStep('camera');
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      startCamera(videoRef.current);
    }
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 30%, #2d1b69 60%, #4a1a7a 100%)',
    }}>
      <Paper elevation={0} sx={{
        p: 5,
        width: '100%',
        maxWidth: 400,
        borderRadius: '24px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        <Typography variant="h5" fontWeight="800" sx={{ mb: 3, textAlign: 'center' }}>
          Face Login
        </Typography>

        <Typography sx={{ mb: 3, color: 'text.secondary', textAlign: 'center' }}>
          Look at the camera to authenticate
        </Typography>

        {(errorMsg || error) && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {errorMsg || 'Login failed'}
          </Alert>
        )}

        <Box sx={{ position: 'relative' }}>
          <video ref={videoRef} style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
          
          <Backdrop open={step === 'capturing'} sx={{ borderRadius: '12px' }}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={48} color="inherit" />
              <Typography sx={{ mt: 2 }}>Verifying face...</Typography>
            </Box>
          </Backdrop>
        </Box>

        <Button
          onClick={handleCapture}
          variant="contained"
          fullWidth
          sx={{ mt: 3, py: 1.5, borderRadius: '12px' }}
        >
          Login with Face
        </Button>
      </Paper>
    </Box>
  );
}