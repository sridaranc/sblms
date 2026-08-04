import {
  Box, Typography, Button, Grid, Card, CardContent, Paper, Avatar, Chip, Alert, Snackbar,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, TablePagination,
  CircularProgress, TextField, Tabs, Tab
} from '@mui/material';
import {
  AccessTime, CheckCircle, Cancel, LocationOn, Timer, TrendingUp,
  CameraAlt,
} from '@mui/icons-material';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from '../../store/hooks';
import { useCheckInMutation, useCheckOutMutation, useGetAttendanceQuery, useGetTeamAttendanceQuery } from '../../api/api';
import { faceRecognitionService, FaceDetectionResult } from '../../services/faceRecognitionService';
import { attendanceService } from '../../services/attendanceService';
import { ManualAttendanceDialog } from './ManualAttendanceDialog';

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  checkInLocation?: string;
  checkOutLocation?: string;
  hoursWorked?: number;
  status: string;
  faceVerifiedCheckIn: boolean;
  faceDistanceCheckIn?: number;
}

export default function AttendancePage() {
  const { user } = useAppSelector((state) => state.auth);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [selectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [faceStep, setFaceStep] = useState<'idle' | 'detecting' | 'capturing' | 'verified' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [detectionResult, setDetectionResult] = useState<FaceDetectionResult | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const autoVerifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canManualEntry = user?.roles?.includes('Admin') || user?.roles?.includes('Manager') || user?.roles?.includes('SuperAdmin');

  const faceStepRef = useRef(faceStep);
  useEffect(() => {
    faceStepRef.current = faceStep;
  }, [faceStep]);

  const today = new Date().toISOString().split('T')[0];
  const { data: attendanceData } = useGetAttendanceQuery({ userId: user?.id, startDate: selectedMonth + '-01', endDate: selectedMonth + '-31' });
  const { data: todayAttendanceData, refetch: refetchToday } = useGetAttendanceQuery(
    { userId: user?.id, startDate: today, endDate: today },
    { pollingInterval: 30000 } // Poll every 30s to stay in sync with web/mobile
  );
  const { data: teamAttendanceData, isLoading: teamLoading } = useGetTeamAttendanceQuery({ date: today }, { skip: !canManualEntry || tabIndex !== 1 });
  const [checkIn] = useCheckInMutation();
  const [checkOut] = useCheckOutMutation();

  const records: AttendanceRecord[] = Array.isArray(attendanceData) ? attendanceData : (attendanceData as any)?.data || [];

  // Keep a ref so startAutoVerify always reads the latest todayRecord (avoids stale closure)
  const todayRecordRef = useRef<AttendanceRecord | null>(null);
  useEffect(() => {
    todayRecordRef.current = todayRecord;
  }, [todayRecord]);

  useEffect(() => {
    faceRecognitionService.loadModels().then(setModelsLoaded);
    loadTodayRecord();
    getCurrentLocation();
  }, [attendanceData]);

  // Sync todayRecord from the today-specific polling query
  useEffect(() => {
    if (todayAttendanceData) {
      const data = Array.isArray(todayAttendanceData) ? todayAttendanceData : (todayAttendanceData as any)?.data || [];
      const todayRec = data.length > 0 ? data[0] : null;
      setTodayRecord(todayRec);
    }
  }, [todayAttendanceData]);

  useEffect(() => {
    if (cameraActive && videoRef.current && canvasRef.current && modelsLoaded) {
      faceRecognitionService.startAutoDetection(
        videoRef.current,
        canvasRef.current,
        (result) => {
          setDetectionResult(result);
          setFaceStep(prev => {
            if (prev === 'capturing' || prev === 'verified' || prev === 'error') return prev;
            return 'detecting';
          });
          if (result.quality.isGood && faceStepRef.current !== 'capturing' && faceStepRef.current !== 'verified' && faceStepRef.current !== 'error') {
            startAutoVerify();
          }
        },
        () => {
          setDetectionResult(null);
          setFaceStep(prev => (prev === 'capturing' || prev === 'verified' || prev === 'error') ? prev : 'idle');
          clearAutoVerifyTimer();
        }
      );
    }
    return () => {
      faceRecognitionService.stopAutoDetection();
      clearAutoVerifyTimer();
    };
  }, [cameraActive, modelsLoaded]);

  const loadTodayRecord = () => {
    if (attendanceData) {
      const data = Array.isArray(attendanceData) ? attendanceData : (attendanceData as any)?.data || [];
      const todayRec = data.find((r: AttendanceRecord) => r.date && r.date.split('T')[0] === today);
      setTodayRecord(todayRec || null);
    }
  };

  const getCurrentLocation = async () => {
    if (useManualLocation && locationInput.trim()) {
      setCurrentLocation(locationInput.trim());
      return;
    }
    try {
      const loc = await attendanceService.getCurrentPosition();
      setCurrentLocation(loc.address || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
    } catch {
      setCurrentLocation('Location unavailable - please enter manually below');
    }
  };

  const startCamera = async () => {
    try {
      setCameraActive(true);
      setFaceStep('idle');
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!videoRef.current) return;

      const stream = await faceRecognitionService.startCamera(videoRef.current);
      if (!stream) {
        setCameraActive(false);
        setSnackbar({ open: true, message: 'Camera access denied', severity: 'error' });
      }
    } catch {
      setCameraActive(false);
      setSnackbar({ open: true, message: 'Camera access denied', severity: 'error' });
    }
  };

  const stopCamera = () => {
    faceRecognitionService.stopAutoDetection();
    clearAutoVerifyTimer();
    if (videoRef.current) {
      faceRecognitionService.stopCamera(videoRef.current);
    }
    setCameraActive(false);
    setDetectionResult(null);
    setFaceStep('idle');
  };

  const startAutoVerify = useCallback(() => {
    if (autoVerifyTimer.current || faceStepRef.current === 'capturing' || faceStepRef.current === 'verified' || faceStepRef.current === 'error') return;
    autoVerifyTimer.current = setTimeout(async () => {
      // Re-fetch fresh state from server before deciding action — prevents cross-device conflicts
      const result = await refetchToday();
      const freshData = (result as any)?.data;
      const freshArray = Array.isArray(freshData) ? freshData : (freshData as any)?.data || [];
      const freshRecord = freshArray.length > 0 ? freshArray[0] : null;
      // Also update the ref for other code that reads it
      todayRecordRef.current = freshRecord;
      if (!freshRecord?.checkIn || freshRecord?.checkOut) {
        handleCheckIn();
      } else {
        handleCheckOut();
      }
    }, 2500);
  }, []);

  const clearAutoVerifyTimer = useCallback(() => {
    if (autoVerifyTimer.current) {
      clearTimeout(autoVerifyTimer.current);
      autoVerifyTimer.current = null;
    }
  }, []);


  const verifyFace = async (): Promise<{ verified: boolean; faceDescriptor?: number[]; error?: string }> => {
    if (!videoRef.current) return { verified: false, error: 'Camera not ready' };

    const descriptor = await faceRecognitionService.captureFaceDescriptor(videoRef.current);
    if (!descriptor) return { verified: false, error: 'Failed to capture face descriptor.' };

    return { verified: true, faceDescriptor: Array.from(descriptor) };
  };

  const handleCheckIn = async () => {
    setIsChecking(true);
    setFaceStep('capturing');
    setCameraActive(true);
    clearAutoVerifyTimer();

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const faceResult = await verifyFace();
      if (!faceResult.verified) {
        setErrorMessage(faceResult.error || 'Face verification failed');
        setSnackbar({ open: true, message: faceResult.error || 'Face verification failed', severity: 'error' });
        setIsChecking(false);
        setFaceStep('error');
        setTimeout(() => setFaceStep('detecting'), 2000);
        return;
      }

      const loc = useManualLocation && locationInput.trim()
        ? { latitude: 0, longitude: 0, accuracy: 0, address: locationInput.trim() }
        : await attendanceService.getCurrentPosition();
      await checkIn({
        faceDescriptor: faceResult.faceDescriptor,
        location: loc.address,
        latitude: loc.latitude,
        longitude: loc.longitude,
        faceVerified: true,
      }).unwrap();

      const now = new Date();
      setTodayRecord({
        id: Date.now().toString(),
        userId: user?.id || '',
        date: today,
        checkIn: now.toISOString(),
        checkInLocation: loc.address,
        status: attendanceService.getStatus(now.toISOString()) === 'late' ? 'late' : 'present',
        faceVerifiedCheckIn: true,
      });

      setFaceStep('verified');
      setSnackbar({ open: true, message: `Checked in at ${attendanceService.formatTime(now)}`, severity: 'success' });
      setTimeout(() => stopCamera(), 1500);
    } catch (err: any) {
      const msg = err?.data?.message || 'Check-in failed';
      setErrorMessage(msg);
      setSnackbar({ open: true, message: msg, severity: 'error' });
      setFaceStep('error');
      setTimeout(() => setFaceStep('detecting'), 2000);
    }
    setIsChecking(false);
  };

  const handleCheckOut = async () => {
    setIsChecking(true);
    setFaceStep('capturing');
    setCameraActive(true);
    clearAutoVerifyTimer();

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const faceResult = await verifyFace();
      if (!faceResult.verified) {
        setErrorMessage(faceResult.error || 'Face verification failed');
        setSnackbar({ open: true, message: faceResult.error || 'Face verification failed', severity: 'error' });
        setIsChecking(false);
        setFaceStep('error');
        setTimeout(() => setFaceStep('detecting'), 2000);
        return;
      }

      const loc = useManualLocation && locationInput.trim()
        ? { latitude: 0, longitude: 0, accuracy: 0, address: locationInput.trim() }
        : await attendanceService.getCurrentPosition();
      await checkOut({
        faceDescriptor: faceResult.faceDescriptor,
        location: loc.address,
        latitude: loc.latitude,
        longitude: loc.longitude,
        faceVerified: true,
      }).unwrap();

      const now = new Date();
      setTodayRecord(prev => prev ? {
        ...prev,
        checkOut: now.toISOString(),
        checkOutLocation: loc.address,
        hours: attendanceService.calculateHours(prev.checkIn!, now.toISOString()),
      } : null);

      setFaceStep('verified');
      setSnackbar({ open: true, message: `Checked out at ${attendanceService.formatTime(now)}`, severity: 'success' });
      setTimeout(() => stopCamera(), 1500);
    } catch (err: any) {
      const msg = err?.data?.message || 'Check-out failed';
      setErrorMessage(msg);
      setSnackbar({ open: true, message: msg, severity: 'error' });
      setFaceStep('error');
      setTimeout(() => setFaceStep('detecting'), 2000);
    }
    setIsChecking(false);
  };

  const stats = {
    totalPresent: records.filter(r => r.status?.toLowerCase() === 'present' || r.status?.toLowerCase() === 'late').length,
    totalLate: records.filter(r => r.status?.toLowerCase() === 'late').length,
    avgHours: records.filter((r: any) => r.hours).reduce((acc: number, r: any) => acc + (r.hours || 0), 0) / (records.filter((r: any) => r.hours).length || 1),
    attendanceRate: records.length > 0 ? Math.round((records.filter(r => r.status?.toLowerCase() !== 'absent').length / records.length) * 100) : 0,
  };

  const statCards = [
    { label: 'Days Present', value: stats.totalPresent, icon: <CheckCircle />, color: '#00c9a7', bg: 'rgba(0,201,167,0.08)' },
    { label: 'Late Arrivals', value: stats.totalLate, icon: <AccessTime />, color: '#ffc107', bg: 'rgba(255,193,7,0.08)' },
    { label: 'Avg Hours', value: `${stats.avgHours.toFixed(1)}h`, icon: <Timer />, color: '#667eea', bg: 'rgba(102,126,234,0.08)' },
    { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: <TrendingUp />, color: '#ff6b6b', bg: 'rgba(255,107,107,0.08)' },
  ];

  const getQualityColor = (score: number) => {
    if (score >= 70) return '#00c9a7';
    if (score >= 40) return '#ffc107';
    return '#ff6b6b';
  };

  return (
    <Box className="animate-in">
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'flex-start' }, gap: 2, mb: { xs: 3, md: 4 } }}>
        <Box>
          <Typography variant="h5" fontWeight="800" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' },
            background: 'linear-gradient(135deg, #1a1a3e, #00c9a7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Attendance
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Check in/out with face verification and geolocation
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {canManualEntry && (
            <Button variant="contained" color="secondary" size="small"
              onClick={() => setManualEntryOpen(true)} sx={{ textTransform: 'none', borderRadius: '8px' }}>
              Manual Entry
            </Button>
          )}
          <Button variant={viewMode === 'grid' ? 'contained' : 'outlined'} size="small"
            onClick={() => setViewMode('grid')} sx={{ textTransform: 'none', borderRadius: '8px' }}>
            Grid View
          </Button>
          <Button variant={viewMode === 'calendar' ? 'contained' : 'outlined'} size="small"
            onClick={() => setViewMode('calendar')} sx={{ textTransform: 'none', borderRadius: '8px' }}>
            Calendar
          </Button>
        </Box>
      </Box>

      {canManualEntry && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)}>
            <Tab label="My Attendance" />
            <Tab label="Team Attendance" />
          </Tabs>
        </Box>
      )}

      {manualEntryOpen && (
        <ManualAttendanceDialog open={manualEntryOpen} onClose={() => setManualEntryOpen(false)} />
      )}

      {tabIndex === 0 && (
        <>
          <Grid container spacing={{ xs: 1.5, md: 2.5 }} sx={{ mb: { xs: 2, md: 4 } }}>
                  {statCards.map((stat) => (
                    <Grid item xs={12} sm={6} md={3} key={stat.label}>
                      <Card sx={{
                        background: stat.bg,
                        border: `1px solid ${stat.color}15`,
                        borderRadius: '16px',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${stat.color}20` },
                      }}>
                        <CardContent sx={{ p: 2.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 48, height: 48, bgcolor: `${stat.color}15`, color: stat.color }}>
                              {stat.icon}
                            </Avatar>
                            <Box>
                              <Typography variant="h4" fontWeight="800" sx={{ color: stat.color }}>
                                {stat.value}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" fontWeight="500">
                                {stat.label}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
          
                <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 3, borderRadius: '16px' }}>
                      <Typography variant="h6" fontWeight="700" sx={{ mb: 2, color: '#1a1a3e' }}>
                        Today's Status
                      </Typography>
          
                      {cameraActive && (
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', bgcolor: '#000' }}>
                            <video
                              ref={videoRef}
                              style={{
                                width: '100%',
                                display: 'block',
                                minHeight: 180,
                                maxHeight: '35vh',
                                borderRadius: '16px',
                                objectFit: 'cover',
                              }}
                              autoPlay playsInline muted
                            />
                            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
          
                            {faceStep === 'capturing' && (
                              <Box sx={{
                                position: 'absolute', inset: 0,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(0,0,0,0.7)',
                              }}>
                                <CircularProgress size={40} sx={{ color: '#667eea', mb: 1 }} />
                                <Typography color="white" fontWeight="600" variant="body2">Verifying face...</Typography>
                              </Box>
                            )}
          
                            {faceStep === 'verified' && (
                              <Box sx={{
                                position: 'absolute', inset: 0,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(0,201,167,0.3)',
                              }}>
                                <CheckCircle sx={{ fontSize: { xs: 36, sm: 48 }, color: '#00c9a7', mb: 1 }} />
                                <Typography color="white" fontWeight="700">Face Verified!</Typography>
                              </Box>
                            )}
          
                            {faceStep === 'error' && (
                              <Box sx={{
                                position: 'absolute', inset: 0,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(255,107,107,0.3)',
                                backdropFilter: 'blur(4px)',
                                p: 2, textAlign: 'center'
                              }}>
                                <Cancel sx={{ fontSize: { xs: 36, sm: 48 }, color: '#ff6b6b', mb: 1 }} />
                                <Typography color="white" fontWeight="700">{errorMessage || 'Verification Failed'}</Typography>
                              </Box>
                            )}
          
                            {detectionResult && faceStep !== 'capturing' && faceStep !== 'verified' && faceStep !== 'error' && (
                              <Box sx={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                                p: { xs: 1, sm: 1.5 }, pt: { xs: 2.5, sm: 3 },
                              }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 0.5, sm: 1 } }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{
                                      width: { xs: 8, sm: 10 }, height: { xs: 8, sm: 10 }, borderRadius: '50%',
                                      bgcolor: getQualityColor(detectionResult.quality.score),
                                      boxShadow: `0 0 10px ${getQualityColor(detectionResult.quality.score)}`
                                    }} />
                                    <Typography color="white" variant="body2" fontWeight="600" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                      {detectionResult.quality.message}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      )}
          
                      <Box sx={{ p: 2, bgcolor: 'rgba(102,126,234,0.05)', borderRadius: '12px', mb: 3 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary" fontWeight="500">Check In</Typography>
                            <Typography variant="h6" fontWeight="700" color="#1a1a3e">
                              {todayRecord?.checkIn ? attendanceService.formatTime(new Date(todayRecord.checkIn)) : '--:--'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary" fontWeight="500">Check Out</Typography>
                            <Typography variant="h6" fontWeight="700" color="#1a1a3e">
                              {todayRecord?.checkOut ? attendanceService.formatTime(new Date(todayRecord.checkOut)) : '--:--'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
          
                      {!cameraActive ? (
                        <Button fullWidth variant="contained" onClick={startCamera} startIcon={<CameraAlt />} sx={{
                          py: 1.5, borderRadius: '12px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          textTransform: 'none', fontSize: '1rem', fontWeight: '600'
                        }}>
                          Open Camera
                        </Button>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button fullWidth variant="outlined" color="inherit" onClick={stopCamera} sx={{ py: 1.5, borderRadius: '12px', textTransform: 'none', fontWeight: '600' }}>
                            Cancel
                          </Button>
                          <Button
                            fullWidth variant="contained"
                            onClick={(!todayRecord?.checkIn || todayRecord?.checkOut) ? handleCheckIn : handleCheckOut}
                            disabled={isChecking || faceStep === 'capturing' || faceStep === 'verified' || !detectionResult?.quality.isGood}
                            startIcon={isChecking ? <CircularProgress size={20} color="inherit" /> : <CameraAlt />}
                            sx={{
                              py: 1.5, borderRadius: '12px', textTransform: 'none', fontWeight: '600',
                              background: ((!todayRecord?.checkIn || todayRecord?.checkOut) ? 'linear-gradient(135deg, #00c9a7, #00a88a)' : 'linear-gradient(135deg, #ffc107, #ff9800)'),
                              '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' }
                            }}
                          >
                            {(!todayRecord?.checkIn || todayRecord?.checkOut) ? 'Check In' : 'Check Out'}
                          </Button>
                        </Box>
                      )}
                      
                      <Box sx={{ mt: 3, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <LocationOn sx={{ color: '#94a3b8', fontSize: 20, mt: 0.5 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Current Location
                          </Typography>
                          {useManualLocation ? (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <TextField size="small" fullWidth placeholder="Enter your current location..." value={locationInput} onChange={(e) => setLocationInput(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.875rem' } }}
                              />
                              <Button variant="outlined" size="small" onClick={() => { setUseManualLocation(false); getCurrentLocation(); }} sx={{ minWidth: 'auto', p: 1, borderRadius: '8px' }}>
                                <LocationOn />
                              </Button>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography variant="body2" fontWeight="500" color="#1e293b">
                                {currentLocation || 'Detecting...'}
                              </Typography>
                              <Button size="small" onClick={() => setUseManualLocation(true)} sx={{ textTransform: 'none' }}>
                                Edit
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
          
                  <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 0, borderRadius: '16px', overflow: 'hidden' }}>
                      <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
                        <Typography variant="h6" fontWeight="700" color="#1a1a3e">
                          Recent History
                        </Typography>
                      </Box>
                      
                      <TableContainer>
                        <Table sx={{ minWidth: 500 }}>
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                              <TableCell sx={{ fontWeight: '600', color: '#64748b' }}>Date</TableCell>
                              <TableCell sx={{ fontWeight: '600', color: '#64748b' }}>Check In</TableCell>
                              <TableCell sx={{ fontWeight: '600', color: '#64748b' }}>Check Out</TableCell>
                              <TableCell sx={{ fontWeight: '600', color: '#64748b' }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {records.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                                  No attendance records found for this period
                                </TableCell>
                              </TableRow>
                            ) : (
                              records.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((record) => (
                                <TableRow key={record.id} hover>
                                  <TableCell sx={{ fontWeight: '500' }}>
                                    {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </TableCell>
                                  <TableCell>
                                    {record.checkIn ? attendanceService.formatTime(new Date(record.checkIn)) : '--:--'}
                                  </TableCell>
                                  <TableCell>
                                    {record.checkOut ? attendanceService.formatTime(new Date(record.checkOut)) : '--:--'}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={record.status?.toUpperCase()}
                                      size="small"
                                      sx={{
                                        fontWeight: '700',
                                        fontSize: '0.7rem',
                                        bgcolor: record.status?.toLowerCase() === 'present' ? 'rgba(0,201,167,0.1)' : 
                                                record.status?.toLowerCase() === 'late' ? 'rgba(255,193,7,0.1)' : 'rgba(255,107,107,0.1)',
                                        color: record.status?.toLowerCase() === 'present' ? '#00c9a7' : 
                                              record.status?.toLowerCase() === 'late' ? '#ff9800' : '#ff6b6b',
                                      }}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <TablePagination
                        component="div"
                        count={records.length}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                          setRowsPerPage(parseInt(e.target.value, 10));
                          setPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25]}
                      />
                    </Paper>
                  </Grid>
                </Grid>
          
                
        </>
      )}

      {tabIndex === 1 && (
        <Paper sx={{ p: 3, borderRadius: '16px' }}>
          <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>
            Team Attendance - {new Date().toLocaleDateString()}
          </Typography>
          {teamLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: '600', color: '#64748b' }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: '#64748b' }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: '#64748b' }}>Check In</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: '#64748b' }}>Check Out</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: '#64748b' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {((teamAttendanceData as any)?.data || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                        No team attendance records found today
                      </TableCell>
                    </TableRow>
                  ) : (
                    ((teamAttendanceData as any)?.data || []).map((record: any) => (
                      <TableRow key={record.userId} hover>
                        <TableCell sx={{ fontWeight: '500' }}>{record.userFullName}</TableCell>
                        <TableCell>{record.role}</TableCell>
                        <TableCell>
                          {record.checkInTime ? attendanceService.formatTime(new Date(record.checkInTime)) : '--:--'}
                        </TableCell>
                        <TableCell>
                          {record.checkOutTime ? attendanceService.formatTime(new Date(record.checkOutTime)) : '--:--'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={record.status?.toUpperCase() || 'ABSENT'}
                            size="small"
                            sx={{
                              fontWeight: '700', fontSize: '0.7rem',
                              bgcolor: record.status?.toLowerCase() === 'present' ? 'rgba(0,201,167,0.1)' : 
                                      record.status?.toLowerCase() === 'late' ? 'rgba(255,193,7,0.1)' : 'rgba(255,107,107,0.1)',
                              color: record.status?.toLowerCase() === 'present' ? '#00c9a7' : 
                                    record.status?.toLowerCase() === 'late' ? '#ff9800' : '#ff6b6b',
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
