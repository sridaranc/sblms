import React, { useEffect } from 'react';
import { Box, Typography, Button, Grid, TextField, MenuItem, Paper, Alert, Snackbar, CircularProgress, Divider, IconButton, Card, CardContent } from '@mui/material';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateLeadMutation, useGetLeadByIdQuery, useUpdateLeadMutation } from '../../api/api';
import { Save, ArrowBack, Add, Delete, ExpandMore, ExpandLess, LocationOn, Person } from '@mui/icons-material';

const addressSchema = yup.object({
  label: yup.string().required(),
  addressLine1: yup.string().nullable(),
  addressLine2: yup.string().nullable(),
  city: yup.string().nullable(),
  state: yup.string().nullable(),
  postalCode: yup.string().nullable(),
  country: yup.string().nullable(),
});

const contactSchema = yup.object({
  sortOrder: yup.number().required(),
  name: yup.string().nullable(),
  designation: yup.string().nullable(),
  phone: yup.string().nullable(),
  mobile: yup.string().nullable(),
  email: yup.string().nullable().test('is-email', 'Invalid email', (v) => !v || v === '' || yup.string().email().isValidSync(v)),
});

const schema = yup.object({
  customerName: yup.string().required('Customer name is required'),
  companyName: yup.string().nullable(),
  emailAddress: yup.string().email('Invalid email').nullable(),
  mobileNumber: yup.string().nullable(),
  alternativeNumber: yup.string().nullable(),
  website: yup.string().nullable().test('is-url', 'Invalid URL', (v) => !v || v === '' || yup.string().url().isValidSync(v)),
  source: yup.string().required('Source is required'),
  value: yup.number().nullable().min(0, 'Value must be positive'),
  address: yup.string().nullable(),
  city: yup.string().nullable(),
  state: yup.string().nullable(),
  postalCode: yup.string().nullable(),
  country: yup.string().nullable(),
  industryType: yup.string().nullable(),
  businessCategory: yup.string().nullable(),
  companySize: yup.string().nullable(),
  expectedBudget: yup.number().nullable().min(0, 'Budget must be positive'),
  requirements: yup.string().nullable(),
  notes: yup.string().nullable(),
  customerPriority: yup.string().nullable(),
  taxId: yup.string().nullable(),
  annualRevenue: yup.number().nullable().min(0),
  employeeCount: yup.number().nullable().integer().min(0),
  fax: yup.string().nullable(),
  linkedInUrl: yup.string().nullable().test('is-url', 'Invalid URL', (v) => !v || v === '' || yup.string().url().isValidSync(v)),
  skypeId: yup.string().nullable(),
  campaignSource: yup.string().nullable(),
  leadSourceDetails: yup.string().nullable(),
  addresses: yup.array().of(addressSchema).max(3).required(),
  contactPersons: yup.array().of(contactSchema).max(3).required(),
}).required();

type FormData = yup.InferType<typeof schema>;
const manualSources = ['Website', 'Referral', 'SocialMedia', 'ColdCall', 'Advertisement', 'Email', 'Other'];
const aiSources = ['AI_OpenAI', 'AI_GoogleGemini', 'AI_Claude', 'AI_Groq', 'AI_HuggingFace'];
const sourceLabels: Record<string, string> = {
  Website: 'Website', Referral: 'Referral', SocialMedia: 'Social Media', ColdCall: 'Cold Call',
  Advertisement: 'Advertisement', Email: 'Email', Other: 'Other',
  AI_OpenAI: 'AI - ChatGPT', AI_GoogleGemini: 'AI - Gemini', AI_Claude: 'AI - Claude',
  AI_Groq: 'AI - Groq', AI_HuggingFace: 'AI - HuggingFace',
};

export default function LeadFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { data: existingLead, isLoading: loadingLead } = useGetLeadByIdQuery(id!, { skip: !isEdit });
  const [createLead, { isLoading: creating }] = useCreateLeadMutation();
  const [updateLead, { isLoading: updating }] = useUpdateLeadMutation();
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' as any });
  const [expandedAddress, setExpandedAddress] = React.useState<number | null>(0);
  const [expandedContact, setExpandedContact] = React.useState<number | null>(0);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      addresses: [{ label: 'Address1', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: '' }],
      contactPersons: [{ sortOrder: 1, name: '', designation: '', phone: '', mobile: '', email: '' }],
    }
  });

  const { fields: addressFields, append: addAddress, remove: removeAddress } = useFieldArray({ control, name: 'addresses' });
  const { fields: contactFields, append: addContact, remove: removeContact } = useFieldArray({ control, name: 'contactPersons' });

  useEffect(() => {
    if (existingLead) {
      reset({
        customerName: existingLead.customerName, companyName: existingLead.companyName,
        emailAddress: existingLead.emailAddress, mobileNumber: existingLead.mobileNumber,
        alternativeNumber: existingLead.alternativeNumber, website: existingLead.website,
        source: existingLead.source, value: existingLead.value, address: existingLead.address,
        city: existingLead.city, state: existingLead.state, postalCode: existingLead.postalCode,
        country: existingLead.country, industryType: existingLead.industryType,
        businessCategory: existingLead.businessCategory, companySize: existingLead.companySize,
        expectedBudget: existingLead.expectedBudget, requirements: existingLead.requirements,
        notes: existingLead.notes, customerPriority: existingLead.customerPriority,
        taxId: existingLead.taxId, annualRevenue: existingLead.annualRevenue,
        employeeCount: existingLead.employeeCount, fax: existingLead.fax,
        linkedInUrl: existingLead.linkedInUrl, skypeId: existingLead.skypeId,
        campaignSource: existingLead.campaignSource, leadSourceDetails: existingLead.leadSourceDetails,
        addresses: existingLead.addresses?.length > 0 ? existingLead.addresses.map((a: any) => ({
          label: a.label || 'Address1', addressLine1: a.addressLine1 || '', addressLine2: a.addressLine2 || '',
          city: a.city || '', state: a.state || '', postalCode: a.postalCode || '', country: a.country || '',
        })) : [{ label: 'Address1', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: '' }],
        contactPersons: existingLead.contactPersons?.length > 0 ? existingLead.contactPersons.map((cp: any) => ({
          sortOrder: cp.sortOrder, name: cp.name || '', designation: cp.designation || '',
          phone: cp.phone || '', mobile: cp.mobile || '', email: cp.email || '',
        })) : [{ sortOrder: 1, name: '', designation: '', phone: '', mobile: '', email: '' }],
      });
    }
  }, [existingLead, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        addresses: data.addresses.filter((a: any) => a.addressLine1 || a.city || a.country),
        contactPersons: data.contactPersons.filter((cp: any) => cp.name),
      };
      if (isEdit) {
        await updateLead({ id, ...payload }).unwrap();
        setSnackbar({ open: true, message: 'Lead updated successfully', severity: 'success' });
      } else {
        await createLead(payload).unwrap();
        setSnackbar({ open: true, message: 'Lead created successfully', severity: 'success' });
        setTimeout(() => navigate('/leads'), 1000);
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.data?.message || 'Operation failed', severity: 'error' });
    }
  };

  if (isEdit && loadingLead) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box className="animate-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/leads')} sx={{ minWidth: 'auto' }}>Back</Button>
        <Typography variant="h4" fontWeight="800" sx={{ background: 'linear-gradient(135deg, #1a1a3e, #667eea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {isEdit ? 'Edit Lead' : 'New Lead'}
        </Typography>
      </Box>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6" fontWeight="700" sx={{ color: '#667eea' }}>Contact Information</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}><TextField fullWidth label="Customer Name *" {...register('customerName')} error={!!errors.customerName} helperText={errors.customerName?.message} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Company" {...register('companyName')} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Email" type="email" {...register('emailAddress')} error={!!errors.emailAddress} helperText={errors.emailAddress?.message} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Mobile" {...register('mobileNumber')} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Alternative Number" {...register('alternativeNumber')} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Website" {...register('website')} error={!!errors.website} helperText={errors.website?.message} size="small" /></Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6" fontWeight="700" sx={{ color: '#764ba2' }}>Deal Details</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}><TextField fullWidth select label="Source *" {...register('source')} error={!!errors.source} helperText={errors.source?.message} size="small">
              <MenuItem value="" disabled><em>Select source</em></MenuItem>
              {aiSources.map((s) => <MenuItem key={s} value={s}>{sourceLabels[s]}</MenuItem>)}
              {manualSources.map((s) => <MenuItem key={s} value={s}>{sourceLabels[s]}</MenuItem>)}
            </TextField></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Value" type="number" {...register('value')} error={!!errors.value} helperText={errors.value?.message} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Expected Budget" type="number" {...register('expectedBudget')} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Priority" {...register('customerPriority')} size="small" /></Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" fontWeight="700" sx={{ color: '#00c9a7' }}>
              <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />Addresses ({addressFields.length}/3)
            </Typography>
            {addressFields.length < 3 && (
              <Button size="small" startIcon={<Add />} onClick={() => { addAddress({ label: `Address${addressFields.length + 1}`, addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: '' }); setExpandedAddress(addressFields.length); }}>
                Add Address
              </Button>
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />
          {addressFields.map((field, index) => (
            <Card key={field.id} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: expandedAddress === index ? 2 : 0, cursor: 'pointer' }} onClick={() => setExpandedAddress(expandedAddress === index ? null : index)}>
                  <Typography fontWeight="600" sx={{ color: '#00c9a7' }}>{`Address ${index + 1}`}</Typography>
                  <Box>
                    {addressFields.length > 1 && <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); removeAddress(index); }}><Delete fontSize="small" /></IconButton>}
                    {expandedAddress === index ? <ExpandLess /> : <ExpandMore />}
                  </Box>
                </Box>
                {expandedAddress === index && (
                  <Grid container spacing={2}>
                    <input type="hidden" {...register(`addresses.${index}.label`)} value={`Address${index + 1}`} />
                    <Grid item xs={12}><TextField fullWidth label="Address Line 1" size="small" {...register(`addresses.${index}.addressLine1`)} /></Grid>
                    <Grid item xs={12}><TextField fullWidth label="Address Line 2" size="small" {...register(`addresses.${index}.addressLine2`)} /></Grid>
                    <Grid item xs={12} md={3}><TextField fullWidth label="City" size="small" {...register(`addresses.${index}.city`)} /></Grid>
                    <Grid item xs={12} md={3}><TextField fullWidth label="State" size="small" {...register(`addresses.${index}.state`)} /></Grid>
                    <Grid item xs={12} md={3}><TextField fullWidth label="Postal Code" size="small" {...register(`addresses.${index}.postalCode`)} /></Grid>
                    <Grid item xs={12} md={3}><TextField fullWidth label="Country" size="small" {...register(`addresses.${index}.country`)} /></Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          ))}
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" fontWeight="700" sx={{ color: '#fa709a' }}>
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} />Contact Persons ({contactFields.length}/3)
            </Typography>
            {contactFields.length < 3 && (
              <Button size="small" startIcon={<Add />} onClick={() => { addContact({ sortOrder: contactFields.length + 1, name: '', designation: '', phone: '', mobile: '', email: '' }); setExpandedContact(contactFields.length); }}>
                Add Contact
              </Button>
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />
          {contactFields.map((field, index) => (
            <Card key={field.id} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: expandedContact === index ? 2 : 0, cursor: 'pointer' }} onClick={() => setExpandedContact(expandedContact === index ? null : index)}>
                  <Typography fontWeight="600" sx={{ color: '#fa709a' }}>{`Contact Person ${index + 1}`}</Typography>
                  <Box>
                    {contactFields.length > 1 && <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); removeContact(index); }}><Delete fontSize="small" /></IconButton>}
                    {expandedContact === index ? <ExpandLess /> : <ExpandMore />}
                  </Box>
                </Box>
                {expandedContact === index && (
                  <Grid container spacing={2}>
                    <input type="hidden" {...register(`contactPersons.${index}.sortOrder`)} value={index + 1} />
                    <Grid item xs={12} md={4}><TextField fullWidth label="Name" size="small" {...register(`contactPersons.${index}.name`)} /></Grid>
                    <Grid item xs={12} md={4}><TextField fullWidth label="Designation" size="small" {...register(`contactPersons.${index}.designation`)} /></Grid>
                    <Grid item xs={12} md={4}><TextField fullWidth label="Email" size="small" {...register(`contactPersons.${index}.email`)} error={!!errors.contactPersons?.[index]?.email} helperText={errors.contactPersons?.[index]?.email?.message} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth label="Phone" size="small" {...register(`contactPersons.${index}.phone`)} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth label="Mobile" size="small" {...register(`contactPersons.${index}.mobile`)} /></Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          ))}
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6" fontWeight="700" sx={{ color: '#fa709a' }}>Additional Details</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}><TextField fullWidth label="Industry Type" {...register('industryType')} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Business Category" {...register('businessCategory')} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Company Size" {...register('companySize')} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Tax ID / GST" {...register('taxId')} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Annual Revenue" type="number" {...register('annualRevenue')} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Employee Count" type="number" {...register('employeeCount')} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Fax" {...register('fax')} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="LinkedIn URL" {...register('linkedInUrl')} error={!!errors.linkedInUrl} helperText={errors.linkedInUrl?.message} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Skype ID" {...register('skypeId')} size="small" /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Campaign Source" {...register('campaignSource')} size="small" /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Lead Source Details" {...register('leadSourceDetails')} size="small" /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Requirements" {...register('requirements')} size="small" /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Notes" {...register('notes')} size="small" /></Grid>
          </Grid>
        </Paper>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" disabled={creating || updating} startIcon={<Save />} sx={{ px: 4 }}>
            {creating || updating ? <CircularProgress size={20} /> : isEdit ? 'Update Lead' : 'Create Lead'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/leads')}>Cancel</Button>
        </Box>
      </form>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
