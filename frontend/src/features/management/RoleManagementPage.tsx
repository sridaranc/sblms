import {
  Box, Typography, Button, IconButton, Menu, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, Card, CardContent, Alert, Snackbar,
  Chip, Avatar, FormControlLabel, Switch, List, ListItem, ListItemText,
  ListItemIcon, Checkbox, CircularProgress,
} from '@mui/material';
import {
  Add, Edit, Delete, MoreVert, Security, AdminPanelSettings,
  Group, Settings, ArrowBack,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetRolesQuery, useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation,
  useGetRolePermissionsQuery, useAssignPermissionToRoleMutation, useRemovePermissionFromRoleMutation,
  useGetPermissionsQuery,
} from '../../api/api';

interface Role {
  id: string;
  name: string;
  description: string;
  hierarchy: number;
  isSystemRole: boolean;
  permissions?: string[];
}

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export default function RoleManagementPage() {
  const navigate = useNavigate();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Role | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [formData, setFormData] = useState({ name: '', description: '', hierarchy: 1, isSystemRole: false });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery(undefined);
  const { data: permissionsData } = useGetPermissionsQuery(undefined);
  const { data: rolePermissionsData } = useGetRolePermissionsQuery(selectedRoleForPermissions?.id, {
    skip: !selectedRoleForPermissions,
  });

  const [createRole, { isLoading: creating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: updating }] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();
  const [assignPermission] = useAssignPermissionToRoleMutation();
  const [removePermission] = useRemovePermissionFromRoleMutation();

  const roles: Role[] = rolesData || [
    { id: '1', name: 'Super Admin', description: 'Full system access', hierarchy: 1, isSystemRole: true, permissions: [] },
    { id: '2', name: 'Admin', description: 'Administrative access', hierarchy: 2, isSystemRole: true, permissions: [] },
    { id: '3', name: 'Manager', description: 'Team management access', hierarchy: 3, isSystemRole: false, permissions: [] },
    { id: '4', name: 'Employee', description: 'Standard employee access', hierarchy: 4, isSystemRole: false, permissions: [] },
  ];

  const permissions: Permission[] = permissionsData || [
    { id: '1', name: 'leads-create', resource: 'leads', action: 'create', description: 'Create leads' },
    { id: '2', name: 'leads-read', resource: 'leads', action: 'read', description: 'View leads' },
    { id: '3', name: 'leads-update', resource: 'leads', action: 'update', description: 'Edit leads' },
    { id: '4', name: 'leads-delete', resource: 'leads', action: 'delete', description: 'Delete leads' },
    { id: '5', name: 'clients-create', resource: 'clients', action: 'create', description: 'Create clients' },
    { id: '6', name: 'clients-read', resource: 'clients', action: 'read', description: 'View clients' },
    { id: '7', name: 'users-manage', resource: 'users', action: 'manage', description: 'Manage users' },
    { id: '8', name: 'settings-edit', resource: 'settings', action: 'edit', description: 'Edit settings' },
  ];

  const rolePermissions: Record<string, string[]> = rolePermissionsData || {};

  const handleRoleClick = (role: Role) => {
    setSelectedRoleForPermissions(role);
    setPermissionDialogOpen(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, role: Role) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRole(role);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCreateRole = () => {
    setFormData({ name: '', description: '', hierarchy: roles.length + 1, isSystemRole: false });
    setSelectedRole(null);
    setRoleDialogOpen(true);
    handleMenuClose();
  };

  const handleEditRole = () => {
    if (selectedRole) {
      setFormData({
        name: selectedRole.name,
        description: selectedRole.description,
        hierarchy: selectedRole.hierarchy,
        isSystemRole: selectedRole.isSystemRole,
      });
      setRoleDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteRole = () => {
    if (selectedRole) {
      setDeleteConfirm(selectedRole.id);
    }
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteRole(deleteConfirm).unwrap();
        setSnackbar({ open: true, message: 'Role deleted successfully', severity: 'success' });
      } catch (err: any) {
        setSnackbar({ open: true, message: err?.data?.message || 'Failed to delete role', severity: 'error' });
      }
      setDeleteConfirm(null);
    }
  };

  const handleSaveRole = async () => {
    try {
      if (selectedRole) {
        await updateRole({ id: selectedRole.id, ...formData }).unwrap();
        setSnackbar({ open: true, message: 'Role updated successfully', severity: 'success' });
      } else {
        await createRole(formData).unwrap();
        setSnackbar({ open: true, message: 'Role created successfully', severity: 'success' });
      }
      setRoleDialogOpen(false);
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.data?.message || 'Failed to save role', severity: 'error' });
    }
  };

  const handlePermissionToggle = async (permissionId: string) => {
    if (!selectedRoleForPermissions) return;

    const currentPermissions = rolePermissions[selectedRoleForPermissions.id] || [];
    const hasPermission = currentPermissions.includes(permissionId);

    try {
      if (hasPermission) {
        await removePermission({ roleId: selectedRoleForPermissions.id, permissionId }).unwrap();
      } else {
        await assignPermission({ roleId: selectedRoleForPermissions.id, permissionId }).unwrap();
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.data?.message || 'Failed to update permission', severity: 'error' });
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'super admin': return <AdminPanelSettings />;
      case 'admin': return <Security />;
      case 'manager': return <Group />;
      default: return <Settings />;
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'super admin': return '#667eea';
      case 'admin': return '#764ba2';
      case 'manager': return '#00c9a7';
      default: return '#ffc107';
    }
  };

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
            Role & Permission Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage roles, permissions, and access controls
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateRole}
          sx={{
            textTransform: 'none', borderRadius: '10px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            '&:hover': { background: 'linear-gradient(135deg, #5a6fd4, #6a3f96)' },
          }}
        >
          Create Role
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea10, #764ba210)', border: '1px solid #667eea20', borderRadius: '16px' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: '#667eea15', color: '#667eea', mx: 'auto', mb: 1 }}>
                <Group sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" fontWeight="800" sx={{ color: '#667eea' }}>{roles.length}</Typography>
              <Typography color="text.secondary" variant="body2">Total Roles</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #00c9a710, #4facfe10)', border: '1px solid #00c9a720', borderRadius: '16px' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: '#00c9a715', color: '#00c9a7', mx: 'auto', mb: 1 }}>
                <Security sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" fontWeight="800" sx={{ color: '#00c9a7' }}>{permissions.length}</Typography>
              <Typography color="text.secondary" variant="body2">Total Permissions</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #ffc10710, #ffcd3810)', border: '1px solid #ffc10720', borderRadius: '16px' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: '#ffc10715', color: '#ffc107', mx: 'auto', mb: 1 }}>
                <Settings sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" fontWeight="800" sx={{ color: '#ffc107' }}>
                {roles.filter(r => r.isSystemRole).length}
              </Typography>
              <Typography color="text.secondary" variant="body2">System Roles</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {rolesLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {roles.map((role) => {
            const rolePerms = rolePermissions[role.id] || [];
            return (
              <Grid item xs={12} sm={6} md={3} key={role.id}>
                <Card
                  sx={{
                    borderRadius: '16px',
                    cursor: 'pointer',
                    border: '1px solid #eee',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' },
                  }}
                  onClick={() => handleRoleClick(role)}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar sx={{
                        width: 48, height: 48,
                        bgcolor: `${getRoleColor(role.name)}15`,
                        color: getRoleColor(role.name),
                      }}>
                        {getRoleIcon(role.name)}
                      </Avatar>
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, role)}>
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 0.5 }}>
                      {role.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: 36 }}>
                      {role.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={`Level ${role.hierarchy}`}
                        size="small"
                        sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}
                      />
                      {role.isSystemRole && (
                        <Chip
                          label="System"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {rolePerms.length} permissions assigned
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleRoleClick(selectedRole!); handleMenuClose(); }}>
          <ListItemIcon><Security fontSize="small" /></ListItemIcon>
          <ListItemText>Manage Permissions</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEditRole}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit Role</ListItemText>
        </MenuItem>
        {!selectedRole?.isSystemRole && (
          <MenuItem onClick={handleDeleteRole}>
            <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Delete Role</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight="700">
          {selectedRole ? 'Edit Role' : 'Create New Role'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Role Name" size="small"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Description" size="small" multiline rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth label="Hierarchy Level" type="number" size="small"
                value={formData.hierarchy}
                onChange={(e) => setFormData({ ...formData, hierarchy: parseInt(e.target.value) || 1 })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isSystemRole}
                    onChange={(e) => setFormData({ ...formData, isSystemRole: e.target.checked })}
                  />
                }
                label="System Role"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained" onClick={handleSaveRole}
            disabled={creating || updating || !formData.name}
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            {creating || updating ? <CircularProgress size={20} /> : selectedRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={permissionDialogOpen}
        onClose={() => setPermissionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Security sx={{ color: '#667eea' }} />
            <Box>
              <Typography variant="h6" fontWeight="700">Manage Permissions</Typography>
              <Typography variant="body2" color="text.secondary">
                Role: {selectedRoleForPermissions?.name}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
            Select permissions to assign to this role
          </Typography>
          <List>
            {permissions.map((permission) => {
              const currentPermissions = rolePermissions[selectedRoleForPermissions?.id || ''] || [];
              const isChecked = currentPermissions.includes(permission.id);
              return (
                <ListItem
                  key={permission.id}
                  sx={{
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    mb: 1,
                    '&:hover': { bgcolor: '#f8f9fa' },
                  }}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={isChecked}
                      onChange={() => handlePermissionToggle(permission.id)}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={permission.name}
                    secondary={permission.description}
                  />
                  <Chip
                    label={permission.resource}
                    size="small"
                    sx={{ fontWeight: 600, bgcolor: '#667eea15', color: '#667eea' }}
                  />
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle fontWeight="700">Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this role? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained" color="error"
            onClick={confirmDelete}
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            Delete
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
