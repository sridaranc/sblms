import {
  Box, Typography, Button, Paper, Avatar, Chip, IconButton, Alert, Snackbar,
  Grid, Card, CardContent, TextField, MenuItem, InputAdornment, Badge,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress,
} from '@mui/material';
import {
  Face, FaceRetouchingOff, PersonAdd, Refresh, Search, CheckCircle, Cancel,
  Groups, PersonSearch, Security, VerifiedUser, AdminPanelSettings, ArrowBack,
} from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetUsersQuery, useGetFaceEnrolmentsQuery, useEnrolFaceMutation,
  useUpdateFaceEnrolmentMutation, useRemoveFaceEnrolmentMutation,
} from '../../api/api';
import FaceCaptureDialog from '../../components/FaceCaptureDialog';

export default function FaceEnrolmentPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enrolled' | 'not-enrolled'>('all');
  const [enrolDialogOpen, setEnrolDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; userId: string; action: string; userFullName: string }>({
    open: false, userId: '', action: '', userFullName: '',
  });

  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery({ pageNumber: 1, pageSize: 200, searchTerm, role: roleFilter });
  const { data: faceEnrolmentsData, isLoading: enrolmentsLoading } = useGetFaceEnrolmentsQuery(undefined);
  const [enrolFace, { isLoading: enrolling }] = useEnrolFaceMutation();
  const [updateFaceEnrolment, { isLoading: updating }] = useUpdateFaceEnrolmentMutation();
  const [removeFaceEnrolment, { isLoading: removing }] = useRemoveFaceEnrolmentMutation();

  const users = useMemo(() => usersData?.items || usersData?.data || [], [usersData]);
  const faceEnrolments = useMemo(() => {
    const data = (faceEnrolmentsData as any)?.data || faceEnrolmentsData || [];
    return Array.isArray(data) ? data : [];
  }, [faceEnrolmentsData]);

  const getEnrolmentForUser = (userId: string) => {
    return faceEnrolments.find((e: any) => e.userId === userId && e.isActive);
  };

  const handleEnrol = (user: any) => {
    const existing = getEnrolmentForUser(user.id);
    if (existing) {
      setConfirmDialog({
        open: true,
        userId: user.id,
        action: 'update',
        userFullName: `${user.firstName} ${user.lastName}`,
      });
    } else {
      setSelectedUser(user);
      setEnrolDialogOpen(true);
    }
  };

  const handleCapture = async (descriptor: number[]) => {
    if (!selectedUser) return;

    try {
      const existing = getEnrolmentForUser(selectedUser.id);
      if (existing) {
        await updateFaceEnrolment({ userId: selectedUser.id, faceDescriptor: descriptor }).unwrap();
        setSnackbar({
          open: true,
          message: `Face updated successfully for ${selectedUser.firstName} ${selectedUser.lastName}`,
          severity: 'success',
        });
      } else {
        await enrolFace({ userId: selectedUser.id, faceDescriptor: descriptor }).unwrap();
        setSnackbar({
          open: true,
          message: `Face enrolled successfully for ${selectedUser.firstName} ${selectedUser.lastName}`,
          severity: 'success',
        });
      }
      setEnrolDialogOpen(false);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.data?.message || 'Failed to enrol face',
        severity: 'error',
      });
    }
  };

  const handleRemove = (userId: string, userFullName: string) => {
    setConfirmDialog({
      open: true,
      userId,
      action: 'remove',
      userFullName,
    });
  };

  const confirmAction = async () => {
    try {
      if (confirmDialog.action === 'remove') {
        await removeFaceEnrolment(confirmDialog.userId).unwrap();
        setSnackbar({ open: true, message: 'Face enrolment removed successfully', severity: 'success' });
      } else if (confirmDialog.action === 'update') {
        const user = users.find((u: any) => u.id === confirmDialog.userId);
        if (user) {
          setSelectedUser(user);
          setEnrolDialogOpen(true);
        }
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.data?.message || 'Operation failed',
        severity: 'error',
      });
    }
    setConfirmDialog({ open: false, userId: '', action: '', userFullName: '' });
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user: any) => {
      const matchesSearch = !searchTerm ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !roleFilter || user.roles?.[0]?.toLowerCase() === roleFilter.toLowerCase();
      const isEnrolled = !!getEnrolmentForUser(user.id);
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'enrolled' && isEnrolled) ||
        (statusFilter === 'not-enrolled' && !isEnrolled);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter, faceEnrolments]);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const enrolled = users.filter((u: any) => !!getEnrolmentForUser(u.id)).length;
    const notEnrolled = totalUsers - enrolled;
    const rate = totalUsers > 0 ? Math.round((enrolled / totalUsers) * 100) : 0;
    return { totalUsers, enrolled, notEnrolled, rate };
  }, [users, faceEnrolments]);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: <Groups />, color: '#667eea', bg: 'rgba(102,126,234,0.08)' },
    { label: 'Enrolled', value: stats.enrolled, icon: <VerifiedUser />, color: '#00c9a7', bg: 'rgba(0,201,167,0.08)' },
    { label: 'Not Enrolled', value: stats.notEnrolled, icon: <PersonSearch />, color: '#ff6b6b', bg: 'rgba(255,107,107,0.08)' },
    { label: 'Enrolment Rate', value: `${stats.rate}%`, icon: <Security />, color: '#ffc107', bg: 'rgba(255,193,7,0.08)' },
  ];

  return (
    <Box className="animate-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'center', sm: 'flex-start' }, mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography variant="h4" fontWeight="800" sx={{
            background: 'linear-gradient(135deg, #1a1a3e, #667eea)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1.5rem', sm: '2.125rem' },
          }}>
            Face Enrolment Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Admin panel - Manage face recognition enrolment for all users
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Chip
            icon={<AdminPanelSettings sx={{ fontSize: 16 }} />}
            label="Admin Access"
            color="primary"
            variant="outlined"
            size="small"
          />
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/settings')}
            sx={{ textTransform: 'none' }}
          >
            Back
          </Button>
        </Box>
      </Box>

      <Grid container spacing={{ xs: 1.5, sm: 2.5 }} sx={{ mb: 4 }}>
        {statCards.map((stat) => (
          <Grid item xs={6} sm={6} md={3} key={stat.label}>
            <Card sx={{
              background: stat.bg,
              border: `1px solid ${stat.color}15`,
              borderRadius: '16px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${stat.color}20` },
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Avatar sx={{ width: 44, height: 44, bgcolor: `${stat.color}15`, color: stat.color }}>
                    {stat.icon}
                  </Avatar>
                  {stat.label === 'Enrolment Rate' && (
                    <Box sx={{ width: 60 }}>
                      <LinearProgress
                        variant="determinate"
                        value={stats.rate}
                        sx={{
                          height: 6, borderRadius: 3,
                          bgcolor: `${stat.color}15`,
                          '& .MuiLinearProgress-bar': { bgcolor: stat.color, borderRadius: 3 },
                        }}
                      />
                    </Box>
                  )}
                </Box>
                <Typography variant="h4" fontWeight="800" sx={{ color: stat.color }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="500">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 2, mb: 3, borderRadius: '16px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth size="small" placeholder="Search users..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth size="small" select label="Role"
              value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="employee">Employee</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth size="small" select label="Status"
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="enrolled">Enrolled</MenuItem>
              <MenuItem value="not-enrolled">Not Enrolled</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Chip
                label={`${filteredUsers.length} users`}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Button
                size="small"
                variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('grid')}
                sx={{ textTransform: 'none', borderRadius: '8px' }}
              >
                Grid
              </Button>
              <Button
                size="small"
                variant={viewMode === 'table' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('table')}
                sx={{ textTransform: 'none', borderRadius: '8px' }}
              >
                Table
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {usersLoading || enrolmentsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : viewMode === 'grid' ? (
        <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
          {filteredUsers.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: { xs: 3, sm: 6 }, textAlign: 'center', borderRadius: '16px' }}>
                <Face sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No users found</Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search or filters
                </Typography>
              </Paper>
            </Grid>
          ) : (
            filteredUsers.map((user: any) => {
              const enrolment = getEnrolmentForUser(user.id);
              const isEnrolled = !!enrolment;
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
                  <Card sx={{
                    borderRadius: '16px',
                    border: isEnrolled ? '2px solid #00c9a730' : '1px solid #eee',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' },
                    overflow: 'visible',
                    position: 'relative',
                  }}>
                    {isEnrolled && (
                      <Box sx={{
                        position: 'absolute', top: -8, right: -8,
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00c9a7, #4facfe)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,201,167,0.4)',
                      }}>
                        <CheckCircle sx={{ fontSize: 18, color: 'white' }} />
                      </Box>
                    )}
                    <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          isEnrolled ? (
                            <Box sx={{
                              width: 20, height: 20, borderRadius: '50%',
                              bgcolor: '#00c9a7', border: '2px solid white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Face sx={{ fontSize: 12, color: 'white' }} />
                            </Box>
                          ) : null
                        }
                      >
                        <Avatar sx={{
                          width: 72, height: 72, mx: 'auto', mb: 1.5,
                          background: isEnrolled
                            ? 'linear-gradient(135deg, #00c9a7, #4facfe)'
                            : 'linear-gradient(135deg, #667eea, #764ba2)',
                          fontSize: '1.5rem', fontWeight: 700,
                          boxShadow: isEnrolled
                            ? '0 4px 16px rgba(0,201,167,0.3)'
                            : '0 4px 16px rgba(102,126,234,0.3)',
                        }}>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </Avatar>
                      </Badge>
                      <Typography variant="subtitle1" fontWeight="700" noWrap>
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mb: 1 }}>
                        {user.email}
                      </Typography>
                      <Chip
                        label={user.roles?.[0] || 'Employee'}
                        size="small"
                        sx={{
                          fontWeight: 600, mb: 1.5,
                          bgcolor: user.roles?.[0] === 'Admin' ? '#667eea15' : user.roles?.[0] === 'Manager' ? '#ffc10715' : '#f5f5f5',
                          color: user.roles?.[0] === 'Admin' ? '#667eea' : user.roles?.[0] === 'Manager' ? '#ffc107' : '#666',
                        }}
                      />
                      {enrolment?.enrolledAt && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Enrolled: {new Date(enrolment.enrolledAt).toLocaleDateString()}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1 }}>
                        {isEnrolled ? (
                          <>
                            <Button
                              size="small" variant="outlined"
                              startIcon={<Refresh sx={{ fontSize: 14 }} />}
                              onClick={() => handleEnrol(user)}
                              disabled={enrolling || updating}
                              sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '0.75rem' }}
                            >
                              Re-enrol
                            </Button>
                            <IconButton
                              size="small" color="error"
                              onClick={() => handleRemove(user.id, `${user.firstName} ${user.lastName}`)}
                              disabled={removing}
                              sx={{ bgcolor: '#ff6b6b10' }}
                            >
                              <FaceRetouchingOff sx={{ fontSize: 18 }} />
                            </IconButton>
                          </>
                        ) : (
                          <Button
                            size="small" variant="contained"
                            startIcon={<PersonAdd sx={{ fontSize: 14 }} />}
                            onClick={() => handleEnrol(user)}
                            disabled={enrolling}
                            sx={{
                              textTransform: 'none', borderRadius: '8px',
                              background: 'linear-gradient(135deg, #667eea, #764ba2)',
                              '&:hover': { background: 'linear-gradient(135deg, #5a6fd4, #6a3f96)' },
                            }}
                          >
                            Enrol Face
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Face Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Enrolled Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Face sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                    <Typography color="text.secondary">No users found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user: any) => {
                  const enrolment = getEnrolmentForUser(user.id);
                  const isEnrolled = !!enrolment;
                  return (
                    <TableRow key={user.id} hover sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{
                            width: 38, height: 38,
                            background: isEnrolled
                              ? 'linear-gradient(135deg, #00c9a7, #4facfe)'
                              : 'linear-gradient(135deg, #667eea, #764ba2)',
                            fontSize: '0.8rem', fontWeight: 700,
                          }}>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography fontWeight="600" variant="body2">
                              {user.firstName} {user.lastName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.roles?.[0] || 'Employee'}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            bgcolor: user.roles?.[0] === 'Admin' ? '#667eea15' : user.roles?.[0] === 'Manager' ? '#ffc10715' : '#f5f5f5',
                            color: user.roles?.[0] === 'Admin' ? '#667eea' : user.roles?.[0] === 'Manager' ? '#ffc107' : '#666',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {isEnrolled ? (
                          <Chip icon={<CheckCircle sx={{ fontSize: 14 }} />} label="Enrolled" size="small" color="success" sx={{ fontWeight: 600 }} />
                        ) : (
                          <Chip icon={<Cancel sx={{ fontSize: 14 }} />} label="Not Enrolled" size="small" color="default" sx={{ fontWeight: 600 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {enrolment?.enrolledAt ? new Date(enrolment.enrolledAt).toLocaleDateString() : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {isEnrolled ? (
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            <Tooltip title="Re-enrol">
                              <IconButton size="small" onClick={() => handleEnrol(user)} disabled={enrolling || updating} sx={{ bgcolor: '#667eea10' }}>
                                <Refresh sx={{ fontSize: 18, color: '#667eea' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove enrolment">
                              <IconButton size="small" color="error" onClick={() => handleRemove(user.id, `${user.firstName} ${user.lastName}`)} disabled={removing} sx={{ bgcolor: '#ff6b6b10' }}>
                                <FaceRetouchingOff sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Button
                            size="small" variant="contained"
                            startIcon={<PersonAdd sx={{ fontSize: 14 }} />}
                            onClick={() => handleEnrol(user)}
                            disabled={enrolling}
                            sx={{
                              textTransform: 'none', borderRadius: '8px',
                              background: 'linear-gradient(135deg, #667eea, #764ba2)',
                              '&:hover': { background: 'linear-gradient(135deg, #5a6fd4, #6a3f96)' },
                            }}
                          >
                            Enrol
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <FaceCaptureDialog
        open={enrolDialogOpen}
        onClose={() => setEnrolDialogOpen(false)}
        onCapture={handleCapture}
        title={`Enrol Face - ${selectedUser?.firstName} ${selectedUser?.lastName || ''}`}
        subtitle="Ensure good lighting and face the camera directly"
        autoCapture={true}
        autoCaptureDelay={3000}
      />

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, userId: '', action: '', userFullName: '' })}
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle fontWeight="700">Confirm {confirmDialog.action === 'remove' ? 'Removal' : 'Update'}</DialogTitle>
        <DialogContent>
          {confirmDialog.action === 'remove' ? (
            <Typography>Are you sure you want to remove face enrolment for {confirmDialog.userFullName}?</Typography>
          ) : (
            <Typography>Are you sure you want to update face enrolment for {confirmDialog.userFullName}?</Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {confirmDialog.action === 'remove'
              ? 'The user will need to re-enrol their face to use face recognition features.'
              : 'This will replace the existing face data with a new capture.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, userId: '', action: '', userFullName: '' })} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirmDialog.action === 'remove' ? 'error' : 'primary'}
            onClick={confirmAction}
            disabled={enrolling || updating || removing}
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            {enrolling || updating || removing ? <CircularProgress size={20} /> : confirmDialog.action === 'remove' ? 'Remove' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

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
