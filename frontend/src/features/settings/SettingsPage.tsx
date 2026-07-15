import { useState } from 'react';
import { Box, Typography, Paper, Grid, Switch, FormControlLabel, Button, Divider, Avatar, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { Person, Security, NotificationsActive, Face, AccessTime, Shield } from '@mui/icons-material';
import { Can } from '../../components/Can';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    followUpReminders: true,
    meetingReminders: true,
    leadAssignmentAlerts: false,
  });

  const handleToggle = (field: keyof typeof settings) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [field]: event.target.checked });
  };

  return (
    <Box className="animate-in">
      <Typography variant="h4" fontWeight="800" gutterBottom sx={{ background: 'linear-gradient(135deg, #1a1a3e, #6b7280)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Settings</Typography>

      <Can any={['roles-read', 'face-enrolment-read', 'settings-read']}>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Can permission="roles-read">
            <Grid item xs={12} md={4}>
              <Card sx={{ cursor: 'pointer', background: 'linear-gradient(135deg, #667eea10, #764ba210)', border: '1px solid #667eea20', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(102,126,234,0.15)' } }} onClick={() => navigate('/settings/roles')}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: '#667eea20', color: '#667eea', mx: 'auto', mb: 2 }}><Shield /></Avatar>
                  <Typography variant="h6" fontWeight="700">Roles & Permissions</Typography>
                  <Typography variant="body2" color="text.secondary">Configure roles and access control</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Can>
          <Can permission="face-enrolment-read">
            <Grid item xs={12} md={4}>
              <Card sx={{ cursor: 'pointer', background: 'linear-gradient(135deg, #00c9a710, #4facfe10)', border: '1px solid #00c9a720', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,201,167,0.15)' } }} onClick={() => navigate('/face-enrolment')}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: '#00c9a720', color: '#00c9a7', mx: 'auto', mb: 2 }}><Face /></Avatar>
                  <Typography variant="h6" fontWeight="700">Face Enrolment</Typography>
                  <Typography variant="body2" color="text.secondary">Manage face recognition enrolment</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Can>
          <Can permission="settings-read">
            <Grid item xs={12} md={4}>
              <Card sx={{ cursor: 'pointer', background: 'linear-gradient(135deg, #ffc10710, #ff8e5310)', border: '1px solid #ffc10720', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(255,193,7,0.15)' } }} onClick={() => navigate('/settings/system')}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: '#ffc10720', color: '#ffc107', mx: 'auto', mb: 2 }}><AccessTime /></Avatar>
                  <Typography variant="h6" fontWeight="700">System Config</Typography>
                  <Typography variant="body2" color="text.secondary">Configure system settings</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Can>
        </Grid>
      </Can>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Person sx={{ color: '#667eea' }} />
              <Typography variant="h6" fontWeight="700">Profile</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ width: 64, height: 64, background: 'linear-gradient(135deg, #667eea, #764ba2)', fontSize: '1.5rem', fontWeight: 700 }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="700">{user?.firstName} {user?.lastName}</Typography>
                <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Role</Typography><Typography fontWeight="600">{user?.role}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Department</Typography><Typography fontWeight="600">{user?.department || '-'}</Typography></Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <NotificationsActive sx={{ color: '#fa709a' }} />
              <Typography variant="h6" fontWeight="700">Notifications</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <FormControlLabel control={<Switch checked={settings.emailNotifications} onChange={handleToggle('emailNotifications')} color="primary" />} label="Email Notifications" sx={{ mb: 1 }} />
            <FormControlLabel control={<Switch checked={settings.followUpReminders} onChange={handleToggle('followUpReminders')} color="primary" />} label="Follow-up Reminders" sx={{ mb: 1 }} />
            <FormControlLabel control={<Switch checked={settings.meetingReminders} onChange={handleToggle('meetingReminders')} color="primary" />} label="Meeting Reminders" sx={{ mb: 1 }} />
            <FormControlLabel control={<Switch checked={settings.leadAssignmentAlerts} onChange={handleToggle('leadAssignmentAlerts')} color="primary" />} label="Lead Assignment Alerts" />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Security sx={{ color: '#00c9a7' }} />
              <Typography variant="h6" fontWeight="700">Security</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Button variant="outlined" sx={{ borderColor: '#00c9a7', color: '#00c9a7' }}>Change Password</Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
