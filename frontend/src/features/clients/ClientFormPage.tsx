import { Box, Typography, Button, Grid, TextField, MenuItem, Paper, Alert, Snackbar, CircularProgress, Divider } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateClientMutation, useGetClientByIdQuery, useUpdateClientMutation } from '../../api/api';
import { Save, ArrowBack } from '@mui/icons-material';

const schema = yup.object({
  companyName: yup.string().required('Company name is required'),
  contactPerson: yup.string().required('Contact person is required'),
  emailAddress: yup.string().email('Invalid email').nullable(),
  contactPersonEmail: yup.string().email('Invalid email').nullable(),
  phone: yup.string().nullable(),
  mobile: yup.string().nullable(),
  alternativePhone: yup.string().nullable(),
  address: yup.string().nullable(),
  city: yup.string().nullable(),
  state: yup.string().nullable(),
  country: yup.string().nullable(),
  postalCode: yup.string().nullable(),
  website: yup.string().nullable(),
  natureOfBusiness: yup.string().nullable(),
  industry: yup.string().nullable(),
  companySize: yup.string().nullable(),
  businessRegistrationNumber: yup.string().nullable(),
  taxIdentificationNumber: yup.string().nullable(),
  gstNumber: yup.string().nullable(),
  annualRevenue: yup.string().nullable(),
  yearEstablished: yup.string().nullable(),
  contactPersonRole: yup.string().nullable(),
  contactPersonPhone: yup.string().nullable(),
  secondaryContactName: yup.string().nullable(),
  secondaryContactEmail: yup.string().nullable(),
  secondaryContactPhone: yup.string().nullable(),
  preferredCommunication: yup.string().nullable(),
  paymentTerms: yup.string().nullable(),
  creditLimit: yup.string().nullable(),
  currency: yup.string().nullable(),
  customerPriority: yup.string().nullable(),
  rating: yup.string().nullable(),
  notes: yup.string().nullable(),
}).required();

type FormData = yup.InferType<typeof schema>;

const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Real Estate', 'Telecommunications', 'Energy', 'Transportation', 'Hospitality', 'Media', 'Other'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];
const ratings = ['1', '2', '3', '4', '5'];

export default function ClientFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { data: existing, isLoading: loading } = useGetClientByIdQuery(id!, { skip: !isEdit });
  const [createClient, { isLoading: creating }] = useCreateClientMutation();
  const [updateClient, { isLoading: updating }] = useUpdateClientMutation();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ resolver: yupResolver(schema) });

  useEffect(() => {
    if (existing) {
      reset({
        companyName: existing.companyName, contactPerson: existing.contactPerson,
        emailAddress: existing.emailAddress, contactPersonEmail: existing.contactPersonEmail,
        phone: existing.phone, mobile: existing.mobile, alternativePhone: existing.alternativePhone,
        address: existing.address, city: existing.city, state: existing.state,
        country: existing.country, postalCode: existing.postalCode, website: existing.website,
        natureOfBusiness: existing.natureOfBusiness, industry: existing.industry,
        companySize: existing.companySize, businessRegistrationNumber: existing.businessRegistrationNumber,
        taxIdentificationNumber: existing.taxIdentificationNumber, gstNumber: existing.gstNumber,
        annualRevenue: existing.annualRevenue, yearEstablished: existing.yearEstablished,
        contactPersonRole: existing.contactPersonRole, contactPersonPhone: existing.contactPersonPhone,
        secondaryContactName: existing.secondaryContactName, secondaryContactEmail: existing.secondaryContactEmail,
        secondaryContactPhone: existing.secondaryContactPhone, preferredCommunication: existing.preferredCommunication,
        paymentTerms: existing.paymentTerms, creditLimit: existing.creditLimit, currency: existing.currency,
        customerPriority: existing.customerPriority, rating: existing.rating, notes: existing.notes,
      });
    }
  }, [existing, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        await updateClient({ id, ...data }).unwrap();
        setSnackbar({ open: true, message: 'Client updated', severity: 'success' });
      } else {
        await createClient(data).unwrap();
        setSnackbar({ open: true, message: 'Client created', severity: 'success' });
        setTimeout(() => navigate('/clients'), 1000);
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.data?.message || 'Operation failed', severity: 'error' });
    }
  };

  if (isEdit && loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box className="animate-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/clients')} sx={{ minWidth: 'auto' }}>Back</Button>
        <Typography variant="h4" fontWeight="800" sx={{ background: 'linear-gradient(135deg, #1a1a3e, #00c9a7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {isEdit ? 'Edit Client' : 'New Client'}
        </Typography>
      </Box>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6" fontWeight="700" sx={{ color: '#667eea' }}>Company Information</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}><TextField fullWidth label="Company Name *" {...register('companyName')} error={!!errors.companyName} helperText={errors.companyName?.message} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Website" {...register('website')} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth select label="Industry" {...register('industry')} size="small">{industries.map((i) => <MenuItem key={i} value={i}>{i}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Nature of Business" {...register('natureOfBusiness')} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Company Size" {...register('companySize')} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Year Established" {...register('yearEstablished')} size="small" /></Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6" fontWeight="700" sx={{ color: '#764ba2' }}>Primary Contact</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}><TextField fullWidth label="Contact Person *" {...register('contactPerson')} error={!!errors.contactPerson} helperText={errors.contactPerson?.message} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Role" {...register('contactPersonRole')} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Email" type="email" {...register('emailAddress')} error={!!errors.emailAddress} helperText={errors.emailAddress?.message} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Contact Person Email" type="email" {...register('contactPersonEmail')} size="small" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Phone" {...register('phone')} size="small" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Mobile" {...register('mobile')} size="small" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Alt Phone" {...register('alternativePhone')} size="small" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Contact Person Phone" {...register('contactPersonPhone')} size="small" /></Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6" fontWeight="700" sx={{ color: '#fa709a' }}>Secondary Contact</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}><TextField fullWidth label="Name" {...register('secondaryContactName')} size="small" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Email" type="email" {...register('secondaryContactEmail')} size="small" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Phone" {...register('secondaryContactPhone')} size="small" /></Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6" fontWeight="700" sx={{ color: '#00c9a7' }}>Address</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12}><TextField fullWidth label="Address" {...register('address')} size="small" /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="City" {...register('city')} size="small" /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="State" {...register('state')} size="small" /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Postal Code" {...register('postalCode')} size="small" /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Country" {...register('country')} size="small" /></Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6" fontWeight="700" sx={{ color: '#ffc107' }}>Business Details</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}><TextField fullWidth label="Business Reg. Number" {...register('businessRegistrationNumber')} size="small" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Tax ID" {...register('taxIdentificationNumber')} size="small" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="GST Number" {...register('gstNumber')} size="small" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Annual Revenue" {...register('annualRevenue')} size="small" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth select label="Priority" {...register('customerPriority')} size="small">{priorities.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth select label="Rating" {...register('rating')} size="small">{ratings.map((r) => <MenuItem key={r} value={r}>{r} Star{r !== '1' ? 's' : ''}</MenuItem>)}</TextField></Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6" fontWeight="700" sx={{ color: '#667eea' }}>Financial & Communication</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}><TextField fullWidth label="Preferred Communication" {...register('preferredCommunication')} size="small" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Payment Terms" {...register('paymentTerms')} size="small" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Credit Limit" {...register('creditLimit')} size="small" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Currency" {...register('currency')} size="small" /></Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6" fontWeight="700" sx={{ color: '#764ba2' }}>Notes</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Notes" {...register('notes')} size="small" /></Grid>
          </Grid>
        </Paper>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" disabled={creating || updating} startIcon={<Save />} sx={{ px: 4 }}>
            {creating || updating ? <CircularProgress size={20} /> : isEdit ? 'Update Client' : 'Create Client'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/clients')}>Cancel</Button>
        </Box>
      </form>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
