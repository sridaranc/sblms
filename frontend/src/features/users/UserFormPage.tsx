import {
  Box, Typography, Button, Grid, TextField, MenuItem, Paper, Alert, Snackbar,
  CircularProgress, Divider, FormControlLabel, Switch, Avatar, Chip,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateUserMutation, useGetUserByIdQuery, useUpdateUserMutation } from '../../api/api';
import {
  Save, ArrowBack, Face, Person, Email, Lock, Phone, Work,
  Badge, LocationOn, CheckCircle,
} from '@mui/icons-material';
import FaceCaptureDialog from '../../components/FaceCaptureDialog';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').optional(),
  role: yup.string().required('Role is required'),
  phone: yup.string().nullable().defined(),
  department: yup.string().nullable().defined(),
  designation: yup.string().nullable().defined(),
  employeeId: yup.string().nullable().defined(),
  address: yup.string().nullable().defined(),
  city: yup.string().nullable().defined(),
  state: yup.string().nullable().defined(),
  reportingManager: yup.string().nullable().defined(),
  isActive: yup.boolean().defined(),
}).required();

type FormData = yup.InferType<typeof schema>;
const roles = ['Admin', 'Manager', 'Employee'];
const departments = ['Sales', 'Marketing', 'Engineering', 'Human Resources', 'Finance', 'Operations', 'Customer Support', 'Management'];

export default function UserFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { data: existing, isLoading: loading } = useGetUserByIdQuery(id!, { skip: !isEdit });
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [faceDialogOpen, setFaceDialogOpen] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { isActive: true },
  });

  useEffect(() => {
    if (existing) {
      reset({
        firstName: existing.firstName || '',
        lastName: existing.lastName || '',
        email: existing.email || '',
        role: existing.roles?.[0] || '',
        phone: existing.phoneNumber || existing.phone || '',
        department: existing.department || '',
        designation: existing.designation || '',
        employeeId: existing.employeeId || '',
        address: existing.address || '',
        city: existing.city || '',
        state: existing.state || '',
        reportingManager: existing.reportingManager || '',
        isActive: existing.isActive ?? true,
      });
    }
  }, [existing, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (!isEdit && (!data.password || data.password.length < 8)) {
        setSnackbar({ open: true, message: 'Password is required and must be at least 8 characters', severity: 'error' });
        return;
      }
      const userData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        roles: [data.role],
        phone: data.phone,
        department: data.department,
        designation: data.designation,
        employeeId: data.employeeId,
        address: data.address,
        city: data.city,
        state: data.state,
        reportingManager: data.reportingManager,
        isActive: data.isActive,
      };
      if (faceDescriptor) userData.faceDescriptor = faceDescriptor;
      if (!isEdit && data.password) userData.password = data.password;

      if (isEdit) {
        await updateUser({ id, ...userData }).unwrap();
        setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
      } else {
        await createUser(userData).unwrap();
        setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
        setTimeout(() => navigate('/users'), 1000);
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.data?.message || 'Operation failed', severity: 'error' });
    }
  };

  if (isEdit && loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="animate-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/users')}
          sx={{ minWidth: 'auto', textTransform: 'none' }}
        >
          Back
        </Button>
        <Typography variant="h4" fontWeight="800" sx={{
          background: 'linear-gradient(135deg, #1a1a3e, #00c9a7)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {isEdit ? 'Edit User' : 'Create New User'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, borderRadius: '16px' }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Person sx={{ color: '#667eea' }} />
                <Typography variant="h6" fontWeight="700" sx={{ color: '#667eea' }}>
                  Personal Information
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="First Name *" size="small"
                    {...register('firstName')}
                    error={!!errors.firstName} helperText={errors.firstName?.message}
                    InputProps={{ startAdornment: <Person sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Last Name *" size="small"
                    {...register('lastName')}
                    error={!!errors.lastName} helperText={errors.lastName?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Email *" type="email" size="small"
                    {...register('email')}
                    error={!!errors.email} helperText={errors.email?.message}
                    InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Phone" size="small"
                    {...register('phone')}
                    InputProps={{ startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
                  />
                </Grid>
                {!isEdit && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth label="Password *" type="password" size="small"
                      {...register('password')}
                      error={!!errors.password} helperText={errors.password?.message}
                      InputProps={{ startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
                    />
                  </Grid>
                )}
              </Grid>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 4 }}>
                <Work sx={{ color: '#667eea' }} />
                <Typography variant="h6" fontWeight="700" sx={{ color: '#667eea' }}>
                  Professional Details
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Employee ID" size="small"
                    {...register('employeeId')}
                    InputProps={{ startAdornment: <Badge sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth select label="Role *" size="small" {...register('role')} error={!!errors.role} helperText={errors.role?.message}>
                    {roles.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth select label="Department" size="small" {...register('department')}>
                    <MenuItem value="">Select Department</MenuItem>
                    {departments.map((d) => <MenuItem key={d} value={d.toLowerCase()}>{d}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Designation" size="small"
                    {...register('designation')}
                    placeholder="e.g. Senior Developer"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth label="Reporting Manager" size="small"
                    {...register('reportingManager')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth label="Address" size="small"
                    {...register('address')}
                    InputProps={{ startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="City" size="small" {...register('city')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="State" size="small" {...register('state')} />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 4 }}>
                <Face sx={{ color: '#667eea' }} />
                <Typography variant="h6" fontWeight="700" sx={{ color: '#667eea' }}>
                  Face Registration
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ textAlign: 'center', py: 3 }}>
                {faceDescriptor || existing?.hasFaceDescriptor ? (
                  <Box>
                    <Avatar sx={{
                      width: 80, height: 80, mx: 'auto', mb: 2,
                      background: 'linear-gradient(135deg, #00c9a7, #4facfe)',
                    }}>
                      <CheckCircle sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Typography fontWeight="600" color="success.main">Face Registered</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {faceDescriptor ? 'New face data captured' : 'Existing face data loaded'}
                      {existing?.faceEnrolledAt && ` (${new Date(existing.faceEnrolledAt).toLocaleDateString()})`}
                    </Typography>
                    <Button
                      variant="outlined" size="small"
                      onClick={() => setFaceDialogOpen(true)}
                      startIcon={<Face />}
                      sx={{ textTransform: 'none' }}
                    >
                      Re-capture Face
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Avatar sx={{
                      width: 80, height: 80, mx: 'auto', mb: 2,
                      bgcolor: '#667eea15', color: '#667eea',
                    }}>
                      <Face sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Typography fontWeight="600" sx={{ mb: 1 }}>Register Face</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Capture face for login and attendance verification
                    </Typography>
                    <Button
                      variant="contained" size="small"
                      startIcon={<Face />}
                      onClick={() => setFaceDialogOpen(true)}
                      sx={{
                        textTransform: 'none',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        '&:hover': { background: 'linear-gradient(135deg, #5a6fd4, #6a3f96)' },
                      }}
                    >
                      Capture Face
                    </Button>
                  </Box>
                )}
              </Box>

              <FormControlLabel
                control={<Switch {...register('isActive')} checked={watch('isActive')} />}
                label="Active Account"
                sx={{ mt: 2 }}
              />

              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                  type="submit" variant="contained"
                  disabled={creating || updating}
                  startIcon={creating || updating ? <CircularProgress size={20} /> : <Save />}
                  sx={{
                    px: 4, textTransform: 'none',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    '&:hover': { background: 'linear-gradient(135deg, #5a6fd4, #6a3f96)' },
                  }}
                >
                  {isEdit ? 'Update User' : 'Create User'}
                </Button>
                <Button variant="outlined" onClick={() => navigate('/users')} sx={{ textTransform: 'none' }}>
                  Cancel
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '16px', position: 'sticky', top: 20 }}>
            <Typography variant="h6" fontWeight="700" sx={{ mb: 2, color: '#1a1a3e' }}>
              User Preview
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Avatar sx={{
                width: 72, height: 72, mx: 'auto', mb: 1,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                fontSize: '1.5rem', fontWeight: 700,
              }}>
                {watch('firstName')?.[0] || ''}{watch('lastName')?.[0] || ''}
              </Avatar>
              <Typography fontWeight="600">
                {watch('firstName') || 'First'} {watch('lastName') || 'Last'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {watch('email') || 'email@example.com'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mb: 2 }}>
              <Chip label={watch('role') || 'Role'} size="small" sx={{ fontWeight: 600 }} />
              {watch('department') && (
                <Chip label={watch('department')} size="small" variant="outlined" />
              )}
            </Box>
            {watch('designation') && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {watch('designation')}
              </Typography>
            )}
            {isEdit && existing?.hasFaceDescriptor && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Chip
                  icon={<CheckCircle sx={{ fontSize: 14, color: '#00c9a7 !important' }} />}
                  label="Face Enrolled"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>

      <FaceCaptureDialog
        open={faceDialogOpen}
        onClose={() => setFaceDialogOpen(false)}
        onCapture={setFaceDescriptor}
        title="Register User Face"
        subtitle="Position the user's face in the center of the frame"
        autoCapture={true}
        autoCaptureDelay={3000}
      />
    </Box>
  );
}
