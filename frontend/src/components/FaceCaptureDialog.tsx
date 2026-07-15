import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Alert, CircularProgress, LinearProgress, Chip } from '@mui/material';
import { useRef, useEffect, useState, useCallback } from 'react';
import { CameraAlt, CheckCircle, Face, RadioButtonUnchecked } from '@mui/icons-material';
import { faceRecognitionService, FaceDetectionResult } from '../services/faceRecognitionService';

interface FaceCaptureDialogProps {
  open: boolean;
  onClose: () => void;
  onCapture: (descriptor: number[]) => void;
  title?: string;
  subtitle?: string;
  autoCapture?: boolean;
  autoCaptureDelay?: number;
}

export default function FaceCaptureDialog({
  open,
  onClose,
  onCapture,
  title = 'Face Registration',
  subtitle = 'Position your face in the center of the frame',
  autoCapture = true,
  autoCaptureDelay = 3000,
}: FaceCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<FaceDetectionResult | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [autoCaptureProgress, setAutoCaptureProgress] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const autoCaptureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open) {
      setError('');
      setDetectionResult(null);
      setAutoCaptureProgress(0);
      setCameraReady(false);
      setRetryCount(0);
      const timer = setTimeout(() => initCamera(), 300);
      faceRecognitionService.loadModels().then(setModelsLoaded);
      return () => { clearTimeout(timer); cleanup(); };
    } else {
      cleanup();
    }
  }, [open]);

  useEffect(() => {
    if (cameraReady && modelsLoaded && videoRef.current && canvasRef.current) {
      faceRecognitionService.startAutoDetection(
        videoRef.current,
        canvasRef.current,
        (result) => {
          setDetectionResult(result);
          if (autoCapture && result.quality.isGood) {
            startAutoCaptureTimer();
          }
        },
        () => {
          setDetectionResult(null);
          clearAutoCaptureTimer();
        }
      );
    }
    return () => {
      faceRecognitionService.stopAutoDetection();
      clearAutoCaptureTimer();
    };
  }, [cameraReady, modelsLoaded, autoCapture]);

  const initCamera = async () => {
    try {
      if (!videoRef.current) return;

      const stream = await faceRecognitionService.startCamera(videoRef.current);
      if (stream) {
        setCameraReady(true);
      } else {
        setError('Camera access denied. Please allow camera permissions in your browser settings.');
      }
    } catch (err) {
      console.error('Camera init error:', err);
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => initCamera(), 1000);
      } else {
        setError('Camera access denied. Please allow camera permissions in your browser settings.');
      }
    }
  };

  const cleanup = () => {
    faceRecognitionService.stopAutoDetection();
    clearAutoCaptureTimer();
    if (videoRef.current) {
      faceRecognitionService.stopCamera(videoRef.current);
    }
    setCameraReady(false);
    setDetectionResult(null);
    setAutoCaptureProgress(0);
  };

  const startAutoCaptureTimer = useCallback(() => {
    if (autoCaptureTimer.current) return;

    setAutoCaptureProgress(0);
    const startTime = Date.now();

    autoCaptureTimer.current = setTimeout(() => {
      handleCapture();
    }, autoCaptureDelay);

    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / autoCaptureDelay) * 100, 100);
      setAutoCaptureProgress(progress);

      if (progress >= 100) {
        clearAutoCaptureTimer();
      }
    }, 50);
  }, [autoCaptureDelay]);

  const clearAutoCaptureTimer = useCallback(() => {
    if (autoCaptureTimer.current) {
      clearTimeout(autoCaptureTimer.current);
      autoCaptureTimer.current = null;
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);
    setError('');
    clearAutoCaptureTimer();

    try {
      let descriptor: number[] | null | undefined = detectionResult?.descriptor;
      if (!descriptor) {
        descriptor = await faceRecognitionService.captureFaceDescriptor(videoRef.current);
      }

      if (descriptor && descriptor.length > 0) {
        onCapture(descriptor as number[]);
        onClose();
      } else {
        setError('No face detected. Please position your face clearly in the frame.');
      }
    } catch (err) {
      setError('Capture failed. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 70) return 'success';
    if (quality >= 40) return 'warning';
    return 'error';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #0c0c1d 0%, #1a1a3e 100%)',
          m: { xs: 1, sm: 2 },
          maxHeight: { xs: '95vh', sm: '90vh' },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Face sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="700" color="white">{title}</Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.6)">{subtitle}</Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2, borderRadius: '12px' }}>{error}</Alert>
        )}

        <Box sx={{ position: 'relative', bgcolor: '#000' }}>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              display: 'block',
              minHeight: 200,
              maxHeight: '50vh',
              objectFit: 'cover',
            }}
            autoPlay
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          />

          {!cameraReady && (
            <Box sx={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.8)',
            }}>
              <CircularProgress size={48} sx={{ color: '#667eea', mb: 2 }} />
              <Typography color="white" variant="body2">Initializing camera...</Typography>
              {retryCount > 0 && (
                <Typography color="rgba(255,255,255,0.6)" variant="caption" sx={{ mt: 1 }}>
                  Retry attempt {retryCount}...
                </Typography>
              )}
            </Box>
          )}

          {detectionResult && !detectionResult.quality.isGood && (
            <Box sx={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
              p: { xs: 1.5, sm: 2 }, pt: { xs: 3, sm: 4 },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <RadioButtonUnchecked sx={{ fontSize: 16, color: '#ffc107' }} />
                <Typography variant="body2" color="white" fontWeight="500">
                  {detectionResult.quality.message}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={detectionResult.quality.score}
                color={getQualityColor(detectionResult.quality.score)}
                sx={{ height: 4, borderRadius: 2 }}
              />
            </Box>
          )}

          {detectionResult && detectionResult.quality.isGood && (
            <Box sx={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,201,167,0.3))',
              p: { xs: 1.5, sm: 2 }, pt: { xs: 3, sm: 4 },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ fontSize: 18, color: '#00c9a7' }} />
                <Typography variant="body2" color="white" fontWeight="600">
                  {autoCapture ? 'Auto-capturing...' : 'Face detected - Ready to capture'}
                </Typography>
              </Box>
              {autoCapture && autoCaptureProgress > 0 && (
                <LinearProgress
                  variant="determinate"
                  value={autoCaptureProgress}
                  sx={{
                    height: 4, borderRadius: 2, mt: 1,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #00c9a7, #4facfe)',
                    },
                  }}
                />
              )}
            </Box>
          )}
        </Box>

        <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Chip
            icon={<CameraAlt sx={{ fontSize: 14 }} />}
            label={detectionResult ? 'Face Detected' : 'Searching...'}
            color={detectionResult ? 'success' : 'default'}
            size="small"
            variant="outlined"
            sx={{ borderColor: detectionResult ? '#00c9a7' : 'rgba(255,255,255,0.3)', color: detectionResult ? '#00c9a7' : 'rgba(255,255,255,0.6)' }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.5)' }}>
        <Button
          onClick={onClose}
          sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCapture}
          disabled={isCapturing || !cameraReady}
          startIcon={isCapturing ? <CircularProgress size={18} /> : <CameraAlt />}
          sx={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            textTransform: 'none',
            px: 3,
            borderRadius: '10px',
            '&:hover': { background: 'linear-gradient(135deg, #5a6fd4, #6a3f96)' },
          }}
        >
          {isCapturing ? 'Capturing...' : 'Capture Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
