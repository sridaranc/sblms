import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Chip, TextField, MenuItem, TablePagination, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Snackbar, Grid, Avatar,
} from '@mui/material';
import { Edit, Delete, PersonAdd, Search, Person } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetUsersQuery, useDeleteUserMutation } from '../../api/api';
import { Can } from '../../components/Can';

const roleColors: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  SuperAdmin: 'error', Admin: 'warning', Manager: 'info', Employee: 'default',
};

const roleGradients: Record<string, string> = {
  SuperAdmin: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)', Admin: 'linear-gradient(135deg, #ffc107, #ffcd38)',
  Manager: 'linear-gradient(135deg, #4facfe, #00f2fe)', Employee: 'linear-gradient(135deg, #6b7280, #9ca3af)',
};

export default function UsersListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data } = useGetUsersQuery({ pageNumber: page + 1, pageSize: rowsPerPage, searchTerm, role: roleFilter });
  const [deleteUser] = useDeleteUserMutation();

  const users = data?.items || [];
  const totalCount = data?.totalCount || 0;

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id).unwrap();
      setSnackbar({ open: true, message: 'User deleted', severity: 'success' });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' });
    }
  };

  return (
    <Box className="animate-in">
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="800" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' }, background: 'linear-gradient(135deg, #1a1a3e, #00c9a7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Users
          </Typography>
          <Typography variant="body2" color="text.secondary">Manage team members and their roles</Typography>
        </Box>
        <Can permission="users-create">
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => navigate('/users/new')} size="small" sx={{ px: 2, alignSelf: { xs: 'stretch', sm: 'auto' } }}>
            New User
          </Button>
        </Can>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField fullWidth size="small" placeholder="Search users..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" select label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <MenuItem value="">All Roles</MenuItem>
              {Object.keys(roleColors).map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ overflow: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Person sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                  <Typography color="text.secondary">No users found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: any) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, background: roleGradients[user.roles?.[0]] || roleGradients.Employee, fontSize: '0.8rem', fontWeight: 700 }}>
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography fontWeight="500">{user.firstName} {user.lastName}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip label={user.roles?.[0] || 'N/A'} size="small" sx={{ fontWeight: 600, background: roleGradients[user.roles?.[0]], color: 'white' }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={user.isActive ? 'Active' : 'Inactive'} size="small" color={user.isActive ? 'success' : 'default'} variant="outlined" />
                  </TableCell>
                  <TableCell>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => navigate(`/users/${user.id}/edit`)} sx={{ color: '#ffc107' }}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => { setUserToDelete(user); setDeleteDialogOpen(true); }}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination component="div" count={totalCount} page={page}
          onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} />
      </TableContainer>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle fontWeight="700">Delete User</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete user &quot;{userToDelete?.firstName} {userToDelete?.lastName}&quot;?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
