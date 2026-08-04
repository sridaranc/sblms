import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Chip, TextField, Avatar, Card, CardContent, Grid, Alert, Snackbar, CircularProgress,
} from '@mui/material';
import { Add, Visibility, Search, People, Folder } from '@mui/icons-material';
import { useGetClientsQuery, useGetClientStatsQuery } from '../../api/api';
import { Can } from '../../components/Can';

interface Client {
  id: string;
  clientNumber: string;
  companyName: string;
  contactPerson: string;
  emailAddress: string;
  phone: string;
  mobile: string;
  city: string;
  country: string;
  industry: string;
  natureOfBusiness: string;
  status: string;
  customerPriority: string;
  lifetimeValue: number;
  projectCount: number;
  userName: string;
  sourceLeadNumber: string;
  createdAt: string;
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  totalProjects: number;
  activeProjects: number;
}

export default function ClientsListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: clientsResponse, isLoading } = useGetClientsQuery({});
  const { data: statsResponse } = useGetClientStatsQuery({});

  const clients: Client[] = Array.isArray(clientsResponse) ? clientsResponse : [];
  const stats: ClientStats | null = statsResponse || null;

  const filtered = clients.filter(c =>
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.emailAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusGradients: Record<string, string> = {
    Active: 'linear-gradient(135deg, #00c9a7, #4facfe)', Inactive: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
  };

  return (
    <Box className="animate-in">
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="800" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' }, background: 'linear-gradient(135deg, #1a1a3e, #00c9a7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Clients
          </Typography>
          <Typography variant="body2" color="text.secondary">Manage confirmed clients and their projects</Typography>
        </Box>
        <Can permission="clients-create">
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/clients/new')} size="small" sx={{ px: 2, alignSelf: { xs: 'stretch', sm: 'auto' } }}>
            Add Client
          </Button>
        </Can>
      </Box>

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Clients', value: stats.totalClients, color: '#667eea' },
            { label: 'Active Clients', value: stats.activeClients, color: '#00c9a7' },
            { label: 'Total Projects', value: stats.totalProjects, color: '#764ba2' },
            { label: 'Active Projects', value: stats.activeProjects, color: '#fa709a' },
          ].map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Card sx={{ background: `linear-gradient(135deg, ${stat.color}08, ${stat.color}04)`, border: `1px solid ${stat.color}15` }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600">{stat.label}</Typography>
                  <Typography variant="h5" fontWeight="800" sx={{ color: stat.color }}>{stat.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField fullWidth size="small" placeholder="Search clients by name, contact, or email..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }} />
      </Paper>

      <TableContainer component={Paper} sx={{ overflow: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Industry</TableCell>
              <TableCell>Projects</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} align="center"><CircularProgress /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                <People sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                <Typography color="text.secondary">No clients found</Typography>
              </TableCell></TableRow>
            ) : (
              filtered.map((client) => (
                <TableRow key={client.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, background: 'linear-gradient(135deg, #00c9a7, #4facfe)', fontSize: '0.8rem', fontWeight: 700 }}>
                        {client.companyName[0]}
                      </Avatar>
                      <Box>
                        <Typography fontWeight="500">{client.companyName}</Typography>
                        <Typography variant="caption" color="text.secondary">{client.clientNumber}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{client.contactPerson}</TableCell>
                  <TableCell>{client.emailAddress || '-'}</TableCell>
                  <TableCell>{client.city ? `${client.city}, ` : ''}{client.country || '-'}</TableCell>
                  <TableCell><Chip label={client.industry || '-'} size="small" /></TableCell>
                  <TableCell>
                    <Chip icon={<Folder />} label={client.projectCount} size="small" color={client.projectCount > 0 ? 'primary' : 'default'} />
                  </TableCell>
                  <TableCell>
                    <Chip label={client.status} size="small"
                      sx={{ fontWeight: 600, background: statusGradients[client.status] || statusGradients.Active, color: 'white' }} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => navigate(`/clients/${client.id}`)} sx={{ color: '#667eea' }}>
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
