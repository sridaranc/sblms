import {
  Box, Typography, Button, Grid, Card, CardContent, Alert, Snackbar,
  Avatar,
} from '@mui/material';
import {
  Security, Group, Settings, PersonAdd, Face, ArrowBack,
  AdminPanelSettings, ManageAccounts,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetRolesQuery, useGetPermissionsQuery, useGetUsersQuery } from '../../api/api';

export default function SystemConfigPage() {
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: rolesData } = useGetRolesQuery(undefined);
  const { data: permissionsData } = useGetPermissionsQuery(undefined);
  const { data: usersData } = useGetUsersQuery({ pageNumber: 1, pageSize: 100 });

  const roles = rolesData || [
    { id: '1', name: 'Super Admin' },
    { id: '2', name: 'Admin' },
    { id: '3', name: 'Manager' },
    { id: '4', name: 'Employee' },
  ];

  const permissions = permissionsData || [
    { id: '1', name: 'leads-create' },
    { id: '2', name: 'leads-read' },
    { id: '3', name: 'leads-update' },
    { id: '4', name: 'leads-delete' },
  ];

  const users = usersData?.items || usersData?.data || [];

  const statCards = [
    { label: 'Total Roles', value: roles.length, icon: <Group />, color: '#667eea', bg: 'rgba(102,126,234,0.08)' },
    { label: 'Permissions', value: permissions.length, icon: <Security />, color: '#00c9a7', bg: 'rgba(0,201,167,0.08)' },
    { label: 'Users', value: users.length, icon: <PersonAdd />, color: '#ffc107', bg: 'rgba(255,193,7,0.08)' },
    { label: 'System Status', value: 'Active', icon: <Settings />, color: '#ff6b6b', bg: 'rgba(255,107,107,0.08)' },
  ];

  const navCards = [
    {
      title: 'Role Management',
      description: 'Create, edit, and manage roles and their hierarchy levels',
      icon: <ManageAccounts sx={{ fontSize: 40 }} />,
      color: '#667eea',
      path: '/settings/roles',
    },
    {
      title: 'Permission Management',
      description: 'Configure permissions for each role and resource',
      icon: <Security sx={{ fontSize: 40 }} />,
      color: '#00c9a7',
      path: '/settings/roles',
    },
    {
      title: 'Face Enrolment',
      description: 'Manage face recognition enrolment for all users',
      icon: <Face sx={{ fontSize: 40 }} />,
      color: '#764ba2',
      path: '/face-enrolment',
    },
    {
      title: 'User Management',
      description: 'Create and manage user accounts and assignments',
      icon: <AdminPanelSettings sx={{ fontSize: 40 }} />,
      color: '#ffc107',
      path: '/users',
    },
  ];

  return (
    <Box className="animate-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/settings')}
          sx={{ minWidth: 'auto', textTransform: 'none' }}
        >
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="800" sx={{
            background: 'linear-gradient(135deg, #1a1a3e, #667eea)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            System Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage roles, permissions, and system settings
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
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

      <Typography variant="h6" fontWeight="700" sx={{ mb: 2, color: '#1a1a3e' }}>
        Quick Navigation
      </Typography>

      <Grid container spacing={2.5}>
        {navCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card
              sx={{
                cursor: 'pointer',
                borderRadius: '16px',
                border: '1px solid #eee',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 32px ${card.color}20`,
                  borderColor: `${card.color}40`,
                },
              }}
              onClick={() => navigate(card.path)}
            >
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Avatar sx={{
                  width: 64, height: 64,
                  bgcolor: `${card.color}15`,
                  color: card.color,
                  mx: 'auto', mb: 2,
                }}>
                  {card.icon}
                </Avatar>
                <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 0.5 }}>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
