import {
  Box, Typography, Button, Alert, Paper, TextField, Grid, MenuItem,
  Stepper, Step, StepLabel, StepConnector, stepConnectorClasses,
  Avatar, Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCreateUserMutation } from '../../api/api';
import { faceRecognitionService } from '../../services/faceRecognitionService';
import FaceCaptureDialog from '../../components/FaceCaptureDialog';
import {
  Face, BusinessCenter, Person, Email, Lock, Phone,
  LocationOn, Work, Badge, ArrowForward, ArrowBack, CameraAlt,
  CheckCircle, PersonAdd, CorporateFare,
} from '@mui/icons-material';

interface RegistrationForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  department: string;
  designation: string;
  role: string;
  address: string;
  city: string;
  state: string;
  employeeId: string;
  reportingManager: string;
}

const steps = ['Personal Info', 'Professional Details', 'Face Registration'];

const ColorConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 22 },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: { background: '#667eea' },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: '#e0e0e0',
    borderRadius: 1,
  },
}));

const StepIconRoot = styled('div')<{ ownerState: { active?: boolean; completed?: boolean } }>(
  ({ ownerState }) => ({
    display: 'flex',
    height: 44,
    alignItems: 'center',
    ...(ownerState.active && {
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      boxShadow: '0 4px 12px rgba(102,126,234,0.4)',
      borderRadius: '50%',
      width: 44,
      justifyContent: 'center',
    }),
    ...(ownerState.completed && {
      background: '#667eea',
      borderRadius: '50%',
      width: 44,
      height: 44,
      justifyContent: 'center',
    }),
  }),
);

function StepIcon(props: { active?: boolean; completed?: boolean; icon: React.ReactNode }) {
  const { active, completed, icon } = props;
  return (
    <StepIconRoot ownerState={{ active, completed }}>
      {completed ? <CheckCircle sx={{ color: 'white' }} /> : icon}
    </StepIconRoot>
  );
}

export default function FaceRegistration() {
  const navigate = useNavigate();
  const [registerUser, { isLoading, error }] = useCreateUserMutation();
  const [errorMsg, setErrorMsg] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [showFaceDialog, setShowFaceDialog] = useState(false);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const {
    register, handleSubmit, watch, trigger, formState: { errors },
  } = useForm<RegistrationForm>({
    defaultValues: {
      department: '',
      designation: '',
      role: 'employee',
      city: '',
      state: '',
    },
  });

  const password = watch('password', '');

  useEffect(() => {
    faceRecognitionService.loadModels().then(setModelsLoaded);
  }, []);

  const handleNext = async () => {
    let fieldsToValidate: (keyof RegistrationForm)[] = [];
    if (activeStep === 0) fieldsToValidate = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phone'];
    if (activeStep === 1) fieldsToValidate = ['department', 'role'];

    const valid = await trigger(fieldsToValidate);
    if (valid) setActiveStep(prev => prev + 1);
  };

  const handleBack = () => setActiveStep(prev => prev - 1);

  const handleFaceCapture = (descriptor: number[]) => {
    setCapturedDescriptor(descriptor);
    setShowFaceDialog(false);
  };

  const handleSkipFace = () => {
    setActiveStep(prev => prev + 1);
  };

  const onSubmit = async (data: RegistrationForm) => {
    setErrorMsg('');
    try {
      const userData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phone,        // ← fixed: was 'phone'
        department: data.department,
        designation: data.designation,
        roles: [data.role.charAt(0).toUpperCase() + data.role.slice(1)], // capitalize to match DB: Employee/Manager/Admin
        address: data.address,
        city: data.city,
        state: data.state,
        employeeId: data.employeeId,
        reportingManager: data.reportingManager,
      };
      if (capturedDescriptor) userData.faceDescriptor = capturedDescriptor;

      await registerUser(userData).unwrap();
      // Registration returns a UserDto (no token). Redirect to login with a success message.
      navigate('/login', { state: { registered: true, email: data.email } });
    } catch (err: any) {
      setErrorMsg(err?.data?.message || err?.data?.errors?.[0] || 'Registration failed. Please try again.');
    }
  };

  const renderPersonalInfo = () => (
    <Grid container spacing={2.5}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth label="First Name" size="small"
          {...register('firstName', { required: 'First name is required' })}
          error={!!errors.firstName} helperText={errors.firstName?.message}
          InputProps={{ startAdornment: <Person sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth label="Last Name" size="small"
          {...register('lastName', { required: 'Last name is required' })}
          error={!!errors.lastName} helperText={errors.lastName?.message}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth label="Email Address" type="email" size="small"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email format' },
          })}
          error={!!errors.email} helperText={errors.email?.message}
          InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth label="Password" type="password" size="small"
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Min 8 characters' },
            pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Must include uppercase, lowercase, and number' },
          })}
          error={!!errors.password} helperText={errors.password?.message}
          InputProps={{ startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth label="Confirm Password" type="password" size="small"
          {...register('confirmPassword', {
            required: 'Confirm password',
            validate: v => v === password || 'Passwords do not match',
          })}
          error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth label="Phone Number" size="small"
          {...register('phone', { required: 'Phone number is required' })}
          error={!!errors.phone} helperText={errors.phone?.message}
          InputProps={{ startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
        />
      </Grid>
    </Grid>
  );

  const renderProfessionalDetails = () => (
    <Grid container spacing={2.5}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth label="Employee ID" size="small"
          {...register('employeeId')}
          InputProps={{ startAdornment: <Badge sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth select label="Department" size="small"
          {...register('department', { required: 'Department is required' })}
          error={!!errors.department} helperText={errors.department?.message}
          InputProps={{ startAdornment: <CorporateFare sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
        >
          <MenuItem value="">Select Department</MenuItem>
          <MenuItem value="sales">Sales</MenuItem>
          <MenuItem value="marketing">Marketing</MenuItem>
          <MenuItem value="engineering">Engineering</MenuItem>
          <MenuItem value="hr">Human Resources</MenuItem>
          <MenuItem value="finance">Finance</MenuItem>
          <MenuItem value="operations">Operations</MenuItem>
          <MenuItem value="support">Customer Support</MenuItem>
          <MenuItem value="management">Management</MenuItem>
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth label="Designation" size="small"
          {...register('designation')}
          placeholder="e.g. Senior Developer"
          InputProps={{ startAdornment: <Work sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth select label="Role" size="small"
          {...register('role', { required: 'Role is required' })}
          error={!!errors.role} helperText={errors.role?.message}
        >
          <MenuItem value="employee">Employee</MenuItem>
          <MenuItem value="manager">Manager</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
        </TextField>
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
  );

  const renderFaceRegistration = () => (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      {capturedDescriptor ? (
        <Box>
          <Avatar sx={{
            width: 120, height: 120, mx: 'auto', mb: 2,
            background: 'linear-gradient(135deg, #00c9a7, #4facfe)',
            boxShadow: '0 8px 32px rgba(0,201,167,0.4)',
          }}>
            <CheckCircle sx={{ fontSize: 60 }} />
          </Avatar>
          <Typography variant="h6" fontWeight="700" gutterBottom>
            Face Registered Successfully
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your face has been captured and will be used for login and attendance verification.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => { setCapturedDescriptor(null); setShowFaceDialog(true); }}
              startIcon={<CameraAlt />}
              sx={{ borderRadius: '10px', textTransform: 'none' }}
            >
              Re-capture
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit(onSubmit)}
              disabled={isLoading}
              startIcon={<PersonAdd />}
              sx={{
                borderRadius: '10px', textTransform: 'none',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                '&:hover': { background: 'linear-gradient(135deg, #5a6fd4, #6a3f96)' },
              }}
            >
              {isLoading ? 'Creating Account...' : 'Complete Registration'}
            </Button>
          </Box>
        </Box>
      ) : (
        <Box>
          <Box sx={{
            width: 120, height: 120, mx: 'auto', mb: 2,
            borderRadius: '24px',
            border: '3px dashed rgba(102,126,234,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'rgba(102,126,234,0.05)',
            cursor: 'pointer',
          }} onClick={() => setShowFaceDialog(true)}>
            <CameraAlt sx={{ fontSize: 48, color: '#667eea', opacity: 0.6 }} />
          </Box>
          <Typography variant="h6" fontWeight="700" gutterBottom>
            Register Your Face
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Face recognition enables quick login and attendance verification.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
            The system will auto-capture when your face is properly positioned.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={handleSkipFace}
              sx={{ borderRadius: '10px', textTransform: 'none' }}
            >
              Skip for Now
            </Button>
            <Button
              variant="contained"
              onClick={() => setShowFaceDialog(true)}
              disabled={!modelsLoaded}
              startIcon={<CameraAlt />}
              sx={{
                borderRadius: '10px', textTransform: 'none',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                '&:hover': { background: 'linear-gradient(135deg, #5a6fd4, #6a3f96)' },
              }}
            >
              {modelsLoaded ? 'Capture Face' : 'Loading Models...'}
            </Button>
          </Box>
        </Box>
      )}

      <FaceCaptureDialog
        open={showFaceDialog}
        onClose={() => setShowFaceDialog(false)}
        onCapture={handleFaceCapture}
        title="Register Your Face"
        subtitle="Look straight at the camera for best results"
        autoCapture={true}
        autoCaptureDelay={3000}
      />
    </Box>
  );

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 30%, #2d1b69 60%, #4a1a7a 100%)',
      py: 4,
    }}>
      <Paper elevation={0} sx={{
        p: { xs: 3, sm: 5 },
        width: '100%',
        maxWidth: 680,
        borderRadius: '24px',
        background: 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        mx: 2,
      }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '20px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2,
            boxShadow: '0 8px 24px rgba(102,126,234,0.4)',
          }}>
            <BusinessCenter sx={{ color: 'white', fontSize: 32 }} />
          </Box>
          <Typography variant="h5" fontWeight="800" sx={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Join SBLMS
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your account with face recognition
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} connector={<ColorConnector />} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel StepIconComponent={(props) => (
                <StepIcon {...props} icon={
                  index === 0 ? <Person sx={{ fontSize: 18 }} /> :
                  index === 1 ? <Work sx={{ fontSize: 18 }} /> :
                  <Face sx={{ fontSize: 18 }} />
                } />
              )}>
                <Typography variant="caption" fontWeight="600">{label}</Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {(errorMsg || error) && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {errorMsg || 'Registration failed'}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {activeStep === 0 && renderPersonalInfo()}
          {activeStep === 1 && renderProfessionalDetails()}
          {activeStep === 2 && renderFaceRegistration()}

          {activeStep < 2 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBack />}
                sx={{ textTransform: 'none', borderRadius: '10px' }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
                sx={{
                  textTransform: 'none', borderRadius: '10px', px: 3,
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  '&:hover': { background: 'linear-gradient(135deg, #5a6fd4, #6a3f96)' },
                }}
              >
                {activeStep === 1 ? 'Continue to Face Registration' : 'Next'}
              </Button>
            </Box>
          )}
        </form>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Already have an account?{' '}
          <Typography
            component="span" variant="body2" color="primary"
            sx={{ cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/login')}
          >
            Sign In
          </Typography>
        </Typography>
      </Paper>
    </Box>
  );
}
