import { Box, Typography, Button, Grid, TextField, MenuItem, Paper, Alert, Snackbar, CircularProgress, Divider, Chip, Avatar, Card, CardContent } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useGetLeadsQuery, useSetupMeetingMutation, useSendMeetingToClientMutation, useGetMeetingByIdQuery } from '../../api/api';
import { ArrowBack, Videocam, Phone, Event, CheckCircle, Send, Person, Business, Email, Language } from '@mui/icons-material';

const meetingTypes = [
  { value: 0, label: 'Google Meet', icon: '🟢', color: '#34a853', defaultDuration: 30 },
  { value: 1, label: 'Microsoft Teams', icon: '🟣', color: '#6264a7', defaultDuration: 30 },
  { value: 2, label: 'Zoom', icon: '🔵', color: '#2d8cff', defaultDuration: 30 },
  { value: 3, label: 'Webex', icon: '🟢', color: '#00bceb', defaultDuration: 30 },
  { value: 4, label: 'Phone Call', icon: '📞', color: '#f59e0b', defaultDuration: 15 },
  { value: 5, label: 'In-Person', icon: '🤝', color: '#10b981', defaultDuration: 60 },
];

const schema = yup.object({
  leadId: yup.string().required('Lead is required'),
  title: yup.string().required('Title is required'),
  description: yup.string().nullable().defined(),
  scheduledDate: yup.string().required('Date is required'),
  scheduledTime: yup.string().required('Time is required'),
  duration: yup.number().nullable().defined().min(1, 'Duration must be positive'),
  meetingType: yup.number().required('Meeting type is required'),
  clientEmail: yup.string().email('Invalid email').nullable().defined(),
  location: yup.string().nullable().defined(),
}).required();

type FormData = yup.InferType<typeof schema>;

export default function MeetingFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedLeadId = searchParams.get('leadId');
  const isEdit = !!id;
  const navigate = useNavigate();
  const { data: existing, isLoading: loadingMeeting } = useGetMeetingByIdQuery(id!, { skip: !isEdit });
  const { data: leadsData } = useGetLeadsQuery({ pageSize: 100 });
  const [setupMeeting, { isLoading: settingUp }] = useSetupMeetingMutation();
  const [sendInvite, { isLoading: sending }] = useSendMeetingToClientMutation();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [meetingSetupResult, setMeetingSetupResult] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { meetingType: 0, duration: 30, leadId: preselectedLeadId || '' },
  });

  const watchedMeetingType = watch('meetingType');
  const watchedLeadId = watch('leadId');
  const watchedDate = watch('scheduledDate');
  const watchedTime = watch('scheduledTime');

  useEffect(() => {
    const leads = leadsData?.data || leadsData?.items || [];
    const leadList = Array.isArray(leads) ? leads : [];
    const lead = leadList.find((l: any) => l.id === watchedLeadId);
    setSelectedLead(lead || null);
  }, [watchedLeadId, leadsData]);

  useEffect(() => {
    if (existing) {
      reset({
        leadId: existing.leadId, title: existing.title, description: existing.description,
        scheduledDate: existing.scheduledDate?.split('T')[0],
        scheduledTime: existing.scheduledDate?.split('T')[1]?.substring(0, 5),
        duration: existing.duration, meetingType: meetingTypes.find(t => t.label === existing.meetingType)?.value ?? 0,
        clientEmail: existing.clientEmail, location: existing.location,
      });
    } else if (preselectedLeadId) {
      reset({ leadId: preselectedLeadId });
    }
  }, [existing, preselectedLeadId, reset]);

  useEffect(() => {
    if (watchedMeetingType !== undefined) {
      const mt = meetingTypes.find(t => t.value === watchedMeetingType);
      if (mt) setValue('duration', mt.defaultDuration);
    }
  }, [watchedMeetingType, setValue]);

  useEffect(() => {
    if (selectedLead && !isEdit) {
      const meetingType = meetingTypes.find(t => t.value === watchedMeetingType);
      const title = `${meetingType?.label || 'Meeting'} with ${selectedLead.customerName}`;
      setValue('title', title);
      setValue('clientEmail', selectedLead.emailAddress || '');
    }
  }, [selectedLead, watchedMeetingType, isEdit, setValue]);

  const onSubmitSetup = async (data: FormData) => {
    setCurrentStep(1);
    try {
      const dateStr = `${data.scheduledDate}T${data.scheduledTime}:00`;
      const result = await setupMeeting({
        leadId: data.leadId,
        title: data.title,
        description: data.description || null,
        scheduledDate: dateStr,
        duration: data.duration || null,
        meetingType: data.meetingType,
        clientEmail: data.clientEmail || null,
        clientName: selectedLead?.customerName || null,
        location: data.location || null,
      }).unwrap();
      setMeetingSetupResult(result?.data || result);
      setCurrentStep(2);
      setSnackbar({ open: true, message: 'Meeting setup complete! Ready to send invitation.', severity: 'success' });
    } catch (err: any) {
      setCurrentStep(0);
      setSnackbar({ open: true, message: err?.data?.message || 'Setup failed', severity: 'error' });
    }
  };

  const handleSendInvite = async () => {
    if (!meetingSetupResult?.meetingId) return;
    try {
      await sendInvite(meetingSetupResult.meetingId).unwrap();
      setCurrentStep(3);
      setSnackbar({ open: true, message: 'Invitation sent to client!', severity: 'success' });
      setTimeout(() => navigate('/meetings'), 1500);
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.data?.message || 'Failed to send', severity: 'error' });
    }
  };

  const steps = ['Configure Meeting', 'Setup Meeting', 'Send Invitation', 'Complete'];
  const mt = meetingTypes.find(t => t.value === watchedMeetingType);

  if (isEdit && loadingMeeting) return <CircularProgress />;

  return (
    <Box className="animate-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/meetings')} sx={{ minWidth: 'auto' }}>Back</Button>
        <Typography variant="h4" fontWeight="800" sx={{ background: 'linear-gradient(135deg, #1a1a3e, #a18cd1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {isEdit ? 'Edit Meeting' : 'Schedule Meeting'}
        </Typography>
      </Box>

      {/* Progress Steps */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {steps.map((step, i) => (
          <Chip key={i} label={step} icon={i < currentStep ? <CheckCircle sx={{ fontSize: 14 }} /> : i === currentStep ? <Event sx={{ fontSize: 14 }} /> : undefined}
            sx={{
              fontWeight: 600, height: 32,
              background: i < currentStep ? '#10b981' : i === currentStep ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f1f5f9',
              color: i <= currentStep ? 'white' : '#94a3b8',
            }}
          />
        ))}
      </Box>

      <Grid container spacing={3}>
        {/* Left: Form */}
        <Grid item xs={12} md={8}>
          <form onSubmit={handleSubmit(onSubmitSetup)}>
            <Paper sx={{ p: 3, borderRadius: '16px' }}>
              {/* Lead Selection */}
              {!isEdit && !preselectedLeadId && (
                <Box sx={{ mb: 3 }}>
                  <Typography fontWeight="700" sx={{ mb: 1 }}>Select Lead *</Typography>
                  <TextField fullWidth select size="small" {...register('leadId')} error={!!errors.leadId} helperText={errors.leadId?.message}>
                    {(leadsData?.data || leadsData?.items || []).map((l: any) => (
                      <MenuItem key={l.id} value={l.id}>{l.customerName} ({l.leadNumber}) — {l.companyName || l.emailAddress}</MenuItem>
                    ))}
                  </TextField>
                </Box>
              )}

              {/* Lead Info Preview */}
              {selectedLead && (
                <Card sx={{ mb: 3, background: 'linear-gradient(135deg, rgba(102,126,234,0.04), rgba(118,75,162,0.04))', border: '1px solid rgba(102,126,234,0.1)' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}><Person /></Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight="700">{selectedLead.customerName}</Typography>
                        <Typography fontSize="0.8rem" color="text.secondary">{selectedLead.companyName}</Typography>
                      </Box>
                      <Chip label={selectedLead.status} size="small" color="primary" />
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {selectedLead.emailAddress && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Email sx={{ fontSize: 14, color: '#667eea' }} />
                          <Typography fontSize="0.8rem">{selectedLead.emailAddress}</Typography>
                        </Box>
                      )}
                      {selectedLead.mobileNumber && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Phone sx={{ fontSize: 14, color: '#667eea' }} />
                          <Typography fontSize="0.8rem">{selectedLead.mobileNumber}</Typography>
                        </Box>
                      )}
                      {selectedLead.website && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Language sx={{ fontSize: 14, color: '#667eea' }} />
                          <Typography fontSize="0.8rem">{selectedLead.website}</Typography>
                        </Box>
                      )}
                      {selectedLead.value && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Business sx={{ fontSize: 14, color: '#10b981' }} />
                          <Typography fontSize="0.8rem" fontWeight="600">${selectedLead.value.toLocaleString()}</Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Meeting Type Selection */}
              <Box sx={{ mb: 3 }}>
                <Typography fontWeight="700" sx={{ mb: 1.5 }}>Meeting Type *</Typography>
                <Grid container spacing={1.5}>
                  {meetingTypes.map((type) => (
                    <Grid item xs={4} sm={2} key={type.value}>
                      <Card
                        onClick={() => setValue('meetingType', type.value)}
                        sx={{
                          cursor: 'pointer', textAlign: 'center', p: 1.5,
                          border: watchedMeetingType === type.value ? `2px solid ${type.color}` : '2px solid #e2e8f0',
                          background: watchedMeetingType === type.value ? `${type.color}10` : 'white',
                          transition: 'all 0.2s',
                          '&:hover': { borderColor: type.color, transform: 'translateY(-2px)' },
                        }}
                      >
                        <Typography fontSize="1.5rem">{type.icon}</Typography>
                        <Typography fontSize="0.7rem" fontWeight="600" sx={{ mt: 0.5 }}>{type.label}</Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <input type="hidden" {...register('meetingType')} />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Meeting Details */}
              <Typography fontWeight="700" sx={{ mb: 1.5 }}>Meeting Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}><TextField fullWidth label="Meeting Title *" {...register('title')} error={!!errors.title} helperText={errors.title?.message} size="small" /></Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth type="date" label="Date *" {...register('scheduledDate')} InputLabelProps={{ shrink: true }} error={!!errors.scheduledDate} helperText={errors.scheduledDate?.message} size="small" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth type="time" label="Time *" {...register('scheduledTime')} InputLabelProps={{ shrink: true }} error={!!errors.scheduledTime} helperText={errors.scheduledTime?.message} size="small" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth type="number" label="Duration (min)" {...register('duration')} size="small" />
                </Grid>
                <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Description / Agenda" {...register('description')} size="small" /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Client Email" {...register('clientEmail')} error={!!errors.clientEmail} helperText={errors.clientEmail?.message} size="small" /></Grid>
                {(watchedMeetingType === 4 || watchedMeetingType === 5) && (
                  <Grid item xs={12} sm={6}><TextField fullWidth label="Location" {...register('location')} size="small" /></Grid>
                )}
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button type="submit" variant="contained" disabled={settingUp || currentStep >= 2} startIcon={settingUp ? <CircularProgress size={18} /> : <Videocam />} sx={{ px: 4, fontWeight: 700 }}>
                  {currentStep >= 2 ? 'Meeting Ready' : 'Setup Meeting'}
                </Button>
                <Button variant="outlined" onClick={() => navigate('/meetings')}>Cancel</Button>
              </Box>
            </Paper>
          </form>
        </Grid>

        {/* Right: Preview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '16px', position: 'sticky', top: 20 }}>
            <Typography fontWeight="700" sx={{ mb: 2 }}>Meeting Preview</Typography>

            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography fontSize="2rem">{mt?.icon || '📅'}</Typography>
              <Chip label={mt?.label || 'Select Type'} size="small" sx={{ mt: 1, fontWeight: 600, background: `${mt?.color || '#94a3b8'}20`, color: mt?.color || '#94a3b8' }} />
            </Box>

            <Divider sx={{ my: 2 }} />

            {selectedLead && (
              <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, background: '#f8fafc' }}>
                <Typography fontSize="0.75rem" color="text.secondary" fontWeight="600">CLIENT</Typography>
                <Typography fontWeight="600" fontSize="0.9rem">{selectedLead.customerName}</Typography>
                {selectedLead.emailAddress && <Typography fontSize="0.8rem" color="text.secondary">{selectedLead.emailAddress}</Typography>}
              </Box>
            )}

            {watchedDate && watchedTime && (
              <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, background: '#f8fafc' }}>
                <Typography fontSize="0.75rem" color="text.secondary" fontWeight="600">SCHEDULED</Typography>
                <Typography fontWeight="600" fontSize="0.9rem">
                  {new Date(`${watchedDate}T${watchedTime}`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Typography>
                <Typography fontSize="0.8rem" color="text.secondary">
                  {new Date(`${watchedDate}T${watchedTime}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  {watch(`duration`) ? ` • ${watch('duration')} min` : ''}
                </Typography>
              </Box>
            )}

            {meetingSetupResult && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ my: 2 }} />
                <Alert severity="success" sx={{ borderRadius: '8px', mb: 2 }}>
                  <Typography fontWeight="700" fontSize="0.85rem">Meeting URL Generated</Typography>
                  <Typography fontSize="0.75rem" sx={{ wordBreak: 'break-all', mt: 0.5 }}>{meetingSetupResult.meetingUrl}</Typography>
                </Alert>
                <Button fullWidth variant="contained" onClick={handleSendInvite} disabled={sending} startIcon={sending ? <CircularProgress size={18} /> : <Send />} sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  {sending ? 'Sending...' : 'Send Invitation to Client'}
                </Button>
              </Box>
            )}

            {currentStep >= 3 && (
              <Alert severity="success" sx={{ mt: 2, borderRadius: '8px' }}>
                <Typography fontWeight="700">Invitation Sent!</Typography>
                <Typography fontSize="0.8rem">The client will receive a professional email with meeting details.</Typography>
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
