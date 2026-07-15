import { Box, Typography, Button, Grid, TextField, MenuItem, Paper, Alert, Snackbar, CircularProgress, Divider } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCreateFollowUpMutation, useGetFollowUpByIdQuery, useUpdateFollowUpMutation, useGetLeadsQuery } from '../../api/api';
import { Save, ArrowBack } from '@mui/icons-material';

const schema = yup.object({
  leadId: yup.string().required('Lead is required'),
  scheduledDate: yup.string().required('Date is required'),
  scheduledTime: yup.string().nullable().defined(),
  notes: yup.string().nullable().defined(),
}).required();

type FormData = yup.InferType<typeof schema>;

export default function FollowUpFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedLeadId = searchParams.get('leadId');
  const isEdit = !!id;
  const navigate = useNavigate();
  const { data: existing, isLoading: loading } = useGetFollowUpByIdQuery(id!, { skip: !isEdit });
  const [createFollowUp, { isLoading: creating }] = useCreateFollowUpMutation();
  const [updateFollowUp, { isLoading: updating }] = useUpdateFollowUpMutation();
  const { data: leadsData } = useGetLeadsQuery({ pageSize: 100 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ resolver: yupResolver(schema) });

  useEffect(() => {
    if (existing) {
      reset({ leadId: existing.leadId, scheduledDate: existing.scheduledDate?.split('T')[0], scheduledTime: existing.scheduledTime, notes: existing.notes });
    } else if (preselectedLeadId) {
      reset({ leadId: preselectedLeadId });
    }
  }, [existing, preselectedLeadId, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        await updateFollowUp({ id, ...data }).unwrap();
        setSnackbar({ open: true, message: 'Follow-up updated', severity: 'success' });
      } else {
        await createFollowUp(data).unwrap();
        setSnackbar({ open: true, message: 'Follow-up created', severity: 'success' });
        setTimeout(() => navigate('/follow-ups'), 1000);
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.data?.message || 'Operation failed', severity: 'error' });
    }
  };

  if (isEdit && loading) return <CircularProgress />;

  return (
    <Box className="animate-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/follow-ups')} sx={{ minWidth: 'auto' }}>Back</Button>
        <Typography variant="h4" fontWeight="800" sx={{ background: 'linear-gradient(135deg, #1a1a3e, #fa709a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {isEdit ? 'Edit Follow-up' : 'New Follow-up'}
        </Typography>
      </Box>
      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}><TextField fullWidth select label="Lead *" {...register('leadId')} error={!!errors.leadId} helperText={errors.leadId?.message} size="small">{leadsData?.data?.map((l: any) => <MenuItem key={l.id} value={l.id}>{l.customerName} ({l.leadNumber})</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth type="date" label="Scheduled Date *" {...register('scheduledDate')} InputLabelProps={{ shrink: true }} error={!!errors.scheduledDate} helperText={errors.scheduledDate?.message} size="small" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth type="time" label="Scheduled Time" {...register('scheduledTime')} InputLabelProps={{ shrink: true }} size="small" /></Grid>
            <Grid item xs={12}><Divider sx={{ my: 1 }} /><TextField fullWidth multiline rows={3} label="Notes" {...register('notes')} size="small" /></Grid>
          </Grid>
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button type="submit" variant="contained" disabled={creating || updating} startIcon={<Save />} sx={{ px: 4 }}>
              {creating || updating ? <CircularProgress size={20} /> : isEdit ? 'Update' : 'Create'}
            </Button>
            <Button variant="outlined" onClick={() => navigate('/follow-ups')}>Cancel</Button>
          </Box>
        </form>
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
