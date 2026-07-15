import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Paper, Card, CardContent, Button, Divider, Avatar, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Snackbar, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { ArrowBack, Business, Email, Phone, LocationOn, Language, Add, Folder } from '@mui/icons-material';
import { useGetClientByIdQuery, useCreateClientProjectMutation } from '../../api/api';

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projectDialog, setProjectDialog] = useState(false);
  const [projectForm, setProjectForm] = useState({ projectName: '', description: '', budget: '', startDate: '', endDate: '', notes: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: clientResponse, isLoading } = useGetClientByIdQuery(id);
  const [createProject] = useCreateClientProjectMutation();

  const client = clientResponse;

  const handleAddProject = async () => {
    try {
      await createProject({
        clientId: id,
        projectName: projectForm.projectName,
        description: projectForm.description,
        budget: projectForm.budget ? parseFloat(projectForm.budget) : null,
        startDate: projectForm.startDate || null,
        endDate: projectForm.endDate || null,
        notes: projectForm.notes,
      }).unwrap();
      setSnackbar({ open: true, message: 'Project added', severity: 'success' });
      setProjectDialog(false);
      setProjectForm({ projectName: '', description: '', budget: '', startDate: '', endDate: '', notes: '' });
    } catch { setSnackbar({ open: true, message: 'Failed', severity: 'error' }); }
  };

  if (isLoading) return <CircularProgress />;
  if (!client) return <Typography>Client not found</Typography>;

  const infoItems = [
    { icon: <Email />, label: 'Email', value: client.emailAddress },
    { icon: <Phone />, label: 'Phone', value: client.phone },
    { icon: <Phone />, label: 'Mobile', value: client.mobile },
    { icon: <LocationOn />, label: 'Address', value: [client.address, client.city, client.state, client.country].filter(Boolean).join(', ') },
    { icon: <Language />, label: 'Website', value: client.website },
    { icon: <Business />, label: 'Industry', value: client.industry },
  ];

  return (
    <Box className="animate-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/clients')}>Back</Button>
          <Avatar sx={{ width: 48, height: 48, background: 'linear-gradient(135deg, #00c9a7, #4facfe)', fontSize: '1.2rem', fontWeight: 700 }}>
            {client.companyName[0]}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="800">{client.companyName}</Typography>
            <Typography variant="body2" color="text.secondary">{client.clientNumber} | {client.contactPerson}</Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="700" sx={{ color: '#667eea' }} gutterBottom>Contact Information</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {infoItems.map((item) => (
                <Grid item xs={12} sm={6} key={item.label}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Avatar sx={{ width: 28, height: 28, background: 'rgba(102,126,234,0.1)', color: '#667eea' }}>{item.icon}</Avatar>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">{item.label}</Typography>
                  </Box>
                  <Typography fontWeight="500" sx={{ ml: 4.5 }}>{item.value || '-'}</Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="700" sx={{ color: '#764ba2' }}>Projects ({client.projects?.length || 0})</Typography>
              <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setProjectDialog(true)}>Add Project</Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {client.projects?.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Project</TableCell>
                      <TableCell>Budget</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Start Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {client.projects.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell sx={{ fontWeight: 500 }}>{p.projectName}</TableCell>
                        <TableCell>{p.budget ? `$${p.budget.toLocaleString()}` : '-'}</TableCell>
                        <TableCell><Chip label={p.status} size="small" /></TableCell>
                        <TableCell>{p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Folder sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                <Typography color="text.secondary" variant="body2">No projects yet</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="700" gutterBottom sx={{ color: '#00c9a7' }}>Details</Typography>
              <Divider sx={{ mb: 2 }} />
              {[
                { label: 'Status', value: client.status },
                { label: 'Priority', value: client.customerPriority || '-' },
                { label: 'Rating', value: client.rating || '-' },
                { label: 'Lifetime Value', value: client.lifetimeValue ? `$${client.lifetimeValue.toLocaleString()}` : '-' },
                { label: 'Source', value: client.sourceLeadNumber ? `Lead ${client.sourceLeadNumber}` : '-' },
                { label: 'Added By', value: client.userName },
                { label: 'Created', value: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-' },
                { label: 'Updated', value: client.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : '-' },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="body2" fontWeight="600">{item.value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="700" gutterBottom sx={{ color: '#667eea' }}>Company Details</Typography>
              <Divider sx={{ mb: 2 }} />
              {[
                { label: 'Reg. Number', value: client.businessRegistrationNumber || '-' },
                { label: 'Tax ID', value: client.taxIdentificationNumber || '-' },
                { label: 'GST Number', value: client.gstNumber || '-' },
                { label: 'Annual Revenue', value: client.annualRevenue || '-' },
                { label: 'Year Established', value: client.yearEstablished || '-' },
                { label: 'Industry', value: client.industry || '-' },
                { label: 'Company Size', value: client.companySize || '-' },
                { label: 'Nature', value: client.natureOfBusiness || '-' },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="body2" fontWeight="600">{item.value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="700" gutterBottom sx={{ color: '#764ba2' }}>Business & Payment</Typography>
              <Divider sx={{ mb: 2 }} />
              {[
                { label: 'Payment Terms', value: client.paymentTerms || '-' },
                { label: 'Credit Limit', value: client.creditLimit || '-' },
                { label: 'Currency', value: client.currency || '-' },
                { label: 'Preferred Comm.', value: client.preferredCommunication || '-' },
                { label: 'Contract Start', value: client.contractStartDate || '-' },
                { label: 'Contract End', value: client.contractEndDate || '-' },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="body2" fontWeight="600">{item.value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          {client.notes && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="700" gutterBottom>Notes</Typography>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="body2">{client.notes}</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Dialog open={projectDialog} onClose={() => setProjectDialog(false)} PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle fontWeight="700">Add Project</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Project Name" size="small" value={projectForm.projectName} onChange={(e) => setProjectForm({ ...projectForm, projectName: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Description" size="small" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Budget" type="number" size="small" value={projectForm.budget} onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Start Date" size="small" InputLabelProps={{ shrink: true }} value={projectForm.startDate} onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Notes" size="small" value={projectForm.notes} onChange={(e) => setProjectForm({ ...projectForm, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddProject} disabled={!projectForm.projectName}>Add Project</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
