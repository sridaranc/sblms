import {
  Box, Typography, Button, IconButton, TextField, Grid, Card, CardContent, Alert, Snackbar,
  Chip, Avatar, FormControlLabel, Switch, Checkbox, CircularProgress, Tabs, Tab, Tooltip,
  Paper, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
} from '@mui/material';
import {
  Add, Edit, Delete, Security, AdminPanelSettings, Group, Settings, ArrowBack,
  People, Shield, GridOn, Search,
  Lock, Close, PersonAdd, VpnKey,
  SelectAll, Deselect, ExpandMore, ExpandLess,
} from '@mui/icons-material';
import { useState, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetRolesQuery, useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation,
  useGetRolePermissionsQuery, useAssignPermissionToRoleMutation, useRemovePermissionFromRoleMutation,
  useGetPermissionsQuery, useBulkAssignPermissionsMutation, useBulkRemovePermissionsMutation,
  useGetUsersQuery, useAssignRoleToUserMutation, useRemoveRoleFromUserMutation,
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

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  isActive: boolean;
}

const ACTION_COLORS: Record<string, string> = {
  create: '#2e7d32',
  read: '#0288d1',
  update: '#ed6c02',
  delete: '#d32f2f',
  execute: '#7b1fa2',
  manage: '#667eea',
};

const ACTION_BG: Record<string, string> = {
  create: '#e8f5e9',
  read: '#e3f2fd',
  update: '#fff3e0',
  delete: '#ffebee',
  execute: '#f3e5f5',
  manage: '#e8eaf6',
};

const RESOURCE_COLORS: Record<string, string> = {
  leads: '#667eea',
  clients: '#00c9a7',
  users: '#764ba2',
  meetings: '#a18cd1',
  followups: '#4facfe',
  settings: '#ffc107',
  reports: '#ff6b6b',
  dashboard: '#00bcd4',
  attendance: '#8bc34a',
  ai: '#e91e63',
  roles: '#ff5722',
  face: '#607d8b',
};

const RESOURCE_LABELS: Record<string, string> = {
  leads: 'Leads',
  clients: 'Clients',
  users: 'Users',
  meetings: 'Meetings',
  followups: 'Follow-ups',
  settings: 'Settings',
  reports: 'Reports',
  dashboard: 'Dashboard',
  attendance: 'Attendance',
  ai: 'AI Lead Gen',
  roles: 'Roles & Permissions',
  face: 'Face Recognition',
};

const ROLE_ICONS: Record<string, any> = {
  'super admin': AdminPanelSettings,
  admin: Security,
  manager: Group,
  employee: Settings,
  viewer: Lock,
};

const ROLE_COLORS: Record<string, string> = {
  'super admin': '#667eea',
  admin: '#764ba2',
  manager: '#00c9a7',
  employee: '#ffc107',
  viewer: '#90a4ae',
};

const ROLE_TEMPLATES: { name: string; description: string; permissions: string[] }[] = [
  {
    name: 'Viewer',
    description: 'Read-only access to all modules',
    permissions: ['leads-read', 'clients-read', 'users-read', 'meetings-read', 'followups-read', 'reports-read', 'dashboard-read'],
  },
  {
    name: 'Employee',
    description: 'Standard employee with limited access',
    permissions: ['leads-create', 'leads-read', 'leads-update', 'clients-create', 'clients-read', 'clients-update', 'meetings-create', 'meetings-read', 'followups-create', 'followups-read', 'dashboard-read'],
  },
  {
    name: 'Manager',
    description: 'Team management with full CRUD access',
    permissions: ['leads-create', 'leads-read', 'leads-update', 'leads-delete', 'clients-create', 'clients-read', 'clients-update', 'clients-delete', 'users-read', 'meetings-create', 'meetings-read', 'meetings-update', 'meetings-delete', 'followups-create', 'followups-read', 'followups-update', 'followups-delete', 'reports-read', 'dashboard-read', 'attendance-read'],
  },
  {
    name: 'Admin',
    description: 'Full administrative access',
    permissions: ['leads-create', 'leads-read', 'leads-update', 'leads-delete', 'clients-create', 'clients-read', 'clients-update', 'clients-delete', 'users-create', 'users-read', 'users-update', 'users-delete', 'users-manage', 'meetings-create', 'meetings-read', 'meetings-update', 'meetings-delete', 'followups-create', 'followups-read', 'followups-update', 'followups-delete', 'reports-create', 'reports-read', 'reports-update', 'reports-delete', 'settings-read', 'settings-edit', 'dashboard-read', 'attendance-read', 'attendance-manage', 'roles-read', 'roles-create', 'roles-update', 'roles-delete'],
  },
];

export default function AccessControlPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Roles state
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', hierarchy: 1, isSystemRole: false });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [roleSearch, setRoleSearch] = useState('');

  // Permissions state
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<Role | null>(null);
  const [permSearch, setPermSearch] = useState('');
  const [expandedResources, setExpandedResources] = useState<string[]>([]);

  // Users state
  const [userSearch, setUserSearch] = useState('');
  const [assignUserDialog, setAssignUserDialog] = useState<string | null>(null);
  const [selectedRolesForUser, setSelectedRolesForUser] = useState<string[]>([]);

  // API
  const { data: rolesData } = useGetRolesQuery(undefined);
  const { data: permissionsData } = useGetPermissionsQuery(undefined);
  const { data: rolePermissionsData } = useGetRolePermissionsQuery(selectedRoleForPerms?.id, { skip: !selectedRoleForPerms });
  const { data: usersData } = useGetUsersQuery({ pageSize: 100, isActive: true });

  const [createRole, { isLoading: creatingRole }] = useCreateRoleMutation();
  const [updateRole, { isLoading: updatingRole }] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();
  const [assignPermission] = useAssignPermissionToRoleMutation();
  const [removePermission] = useRemovePermissionFromRoleMutation();
  const [bulkAssignPermissions] = useBulkAssignPermissionsMutation();
  const [bulkRemovePermissions] = useBulkRemovePermissionsMutation();
  const [assignRoleToUser] = useAssignRoleToUserMutation();
  const [removeRoleFromUser] = useRemoveRoleFromUserMutation();

  const roles: Role[] = Array.isArray(rolesData) ? rolesData : rolesData || [];
  const permissions: Permission[] = Array.isArray(permissionsData) ? permissionsData : permissionsData || [];
  const users: User[] = Array.isArray(usersData) ? usersData : (usersData?.items || usersData?.data?.items || usersData?.data || usersData || []);
  const rolePermissions: Record<string, string[]> = rolePermissionsData || {};

  // Derived data
  const resources = useMemo(() => {
    const res = new Set(permissions.map(p => p.resource));
    return Array.from(res).sort();
  }, [permissions]);

  const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(roleSearch.toLowerCase()));
  const filteredUsers = users.filter((u: any) =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase())
  );

  const toggleExpandResource = (resource: string) => {
    setExpandedResources(prev => prev.includes(resource) ? prev.filter(r => r !== resource) : [...prev, resource]);
  };

  const getRoleIcon = (name: string) => ROLE_ICONS[name.toLowerCase()] || Settings;
  const getRoleColor = (name: string) => ROLE_COLORS[name.toLowerCase()] || '#667eea';

  // === ROLE HANDLERS ===
  const handleCreateRole = () => {
    setRoleForm({ name: '', description: '', hierarchy: roles.length + 1, isSystemRole: false });
    setSelectedRole(null);
    setRoleDrawerOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setRoleForm({ name: role.name, description: role.description, hierarchy: role.hierarchy, isSystemRole: role.isSystemRole });
    setSelectedRole(role);
    setRoleDrawerOpen(true);
  };

  const handleSaveRole = async () => {
    try {
      if (selectedRole) {
        await updateRole({ id: selectedRole.id, ...roleForm }).unwrap();
        setSnackbar({ open: true, message: 'Role updated successfully', severity: 'success' });
      } else {
        await createRole(roleForm).unwrap();
        setSnackbar({ open: true, message: 'Role created successfully', severity: 'success' });
      }
      setRoleDrawerOpen(false);
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.data?.message || 'Failed to save role', severity: 'error' });
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteRole(deleteConfirm).unwrap();
      setSnackbar({ open: true, message: 'Role deleted successfully', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.data?.message || 'Failed to delete role', severity: 'error' });
    }
    setDeleteConfirm(null);
  };

  // === PERMISSION HANDLERS ===
  const handlePermToggle = async (permId: string) => {
    if (!selectedRoleForPerms) return;
    const current = rolePermissions[selectedRoleForPerms.id] || [];
    try {
      if (current.includes(permId)) {
        await removePermission({ roleId: selectedRoleForPerms.id, permissionId: permId }).unwrap();
      } else {
        await assignPermission({ roleId: selectedRoleForPerms.id, permissionId: permId }).unwrap();
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.data?.message || 'Failed to update permission', severity: 'error' });
    }
  };

  const handleBulkPermToggle = async (resource: string, action: string, checked: boolean) => {
    if (!selectedRoleForPerms) return;
    const current = rolePermissions[selectedRoleForPerms.id] || [];
    const permIds = permissions.filter(p => p.resource === resource && p.action === action).map(p => p.id);
    const toToggle = permIds.filter(id => checked ? !current.includes(id) : current.includes(id));
    if (toToggle.length === 0) return;
    try {
      if (checked) {
        await bulkAssignPermissions({ roleId: selectedRoleForPerms.id, permissionIds: toToggle }).unwrap();
      } else {
        await bulkRemovePermissions({ roleId: selectedRoleForPerms.id, permissionIds: toToggle }).unwrap();
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.data?.message || 'Failed to update permissions', severity: 'error' });
    }
  };

  const handleSelectAllPerms = async () => {
    if (!selectedRoleForPerms) return;
    const allPermIds = permissions.map(p => p.id);
    try {
      await bulkAssignPermissions({ roleId: selectedRoleForPerms.id, permissionIds: allPermIds }).unwrap();
      setSnackbar({ open: true, message: 'All permissions assigned', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.data?.message || 'Failed', severity: 'error' });
    }
  };

  const handleDeselectAllPerms = async () => {
    if (!selectedRoleForPerms) return;
    const current = rolePermissions[selectedRoleForPerms.id] || [];
    if (current.length === 0) return;
    try {
      await bulkRemovePermissions({ roleId: selectedRoleForPerms.id, permissionIds: current }).unwrap();
      setSnackbar({ open: true, message: 'All permissions removed', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.data?.message || 'Failed', severity: 'error' });
    }
  };

  // === USER-ROLE HANDLERS ===
  const handleAssignRoleToUser = async (userId: string) => {
    for (const roleId of selectedRolesForUser) {
      try {
        await assignRoleToUser({ userId, roleId }).unwrap();
      } catch {}
    }
    setSnackbar({ open: true, message: 'Roles updated for user', severity: 'success' });
    setAssignUserDialog(null);
  };

  const handleRemoveRoleFromUser = async (userId: string, roleId: string) => {
    try {
      await removeRoleFromUser({ userId, roleId }).unwrap();
      setSnackbar({ open: true, message: 'Role removed from user', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.data?.message || 'Failed', severity: 'error' });
    }
  };

  const getPermCount = (roleId: string) => (rolePermissions[roleId] || []).length;

  const hasPerm = (roleId: string, permId: string) => (rolePermissions[roleId] || []).includes(permId);

  return (
    <Box className="animate-in">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/settings')} sx={{ minWidth: 'auto', textTransform: 'none' }}>
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="800" sx={{
            background: 'linear-gradient(135deg, #1a1a3e, #667eea)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Access Control
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage roles, permissions, and user access levels
          </Typography>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Roles', value: roles.length, icon: Group, color: '#667eea', bg: '#667eea10' },
          { label: 'Permissions', value: permissions.length, icon: VpnKey, color: '#00c9a7', bg: '#00c9a710' },
          { label: 'Resources', value: resources.length, icon: GridOn, color: '#764ba2', bg: '#764ba210' },
          { label: 'Active Users', value: users.filter((u: any) => u.isActive).length, icon: People, color: '#ffc107', bg: '#ffc10710' },
        ].map((stat) => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Card sx={{ background: `linear-gradient(135deg, ${stat.bg}, ${stat.bg.replace('10', '05')})`, border: `1px solid ${stat.color}20`, borderRadius: '12px' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 44, height: 44, bgcolor: `${stat.color}15`, color: stat.color }}>
                  <stat.icon sx={{ fontSize: 22 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="800" sx={{ color: stat.color }}>{stat.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{
          borderBottom: '1px solid #e2e8f0',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 56 },
          '& .MuiTabs-indicator': { background: 'linear-gradient(135deg, #667eea, #764ba2)', height: 3 },
        }}>
          <Tab icon={<Shield />} iconPosition="start" label="Roles" />
          <Tab icon={<VpnKey />} iconPosition="start" label="Permissions" />
          <Tab icon={<GridOn />} iconPosition="start" label="Permission Matrix" />
          <Tab icon={<People />} iconPosition="start" label="User Roles" />
        </Tabs>

        {/* === TAB 0: ROLES === */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <TextField
                size="small" placeholder="Search roles..." value={roleSearch} onChange={e => setRoleSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
                sx={{ width: 300 }}
              />
              <Button variant="contained" startIcon={<Add />} onClick={handleCreateRole}
                sx={{ textTransform: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                Create Role
              </Button>
            </Box>

            <Grid container spacing={2.5}>
              {filteredRoles.map((role) => {
                const Icon = getRoleIcon(role.name);
                const color = getRoleColor(role.name);
                const permCount = getPermCount(role.id);
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={role.id}>
                    <Card sx={{
                      borderRadius: '16px', border: '1px solid #e2e8f0',
                      transition: 'all 0.2s', position: 'relative', overflow: 'visible',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 12px 32px ${color}20`, borderColor: `${color}40` },
                    }}>
                      {role.isSystemRole && (
                        <Chip label="System" size="small" sx={{
                          position: 'absolute', top: -8, right: 12, fontWeight: 700, fontSize: '0.65rem',
                          background: `${color}15`, color, border: `1px solid ${color}30`,
                        }} />
                      )}
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <Avatar sx={{ width: 48, height: 48, bgcolor: `${color}15`, color }}>
                            <Icon sx={{ fontSize: 24 }} />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography fontWeight="700" fontSize="0.95rem">{role.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{role.description || 'No description'}</Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Chip label={`Level ${role.hierarchy}`} size="small" sx={{ fontWeight: 600, bgcolor: '#f5f5f5', fontSize: '0.7rem' }} />
                          <Chip label={`${permCount} perms`} size="small" sx={{
                            fontWeight: 600, fontSize: '0.7rem',
                            background: permCount > 0 ? `${color}15` : '#f5f5f5',
                            color: permCount > 0 ? color : '#999',
                          }} />
                        </Box>

                        <Divider sx={{ mb: 1.5 }} />

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" fullWidth onClick={() => { setSelectedRoleForPerms(role); setActiveTab(1); }}
                            sx={{ textTransform: 'none', color, fontWeight: 600, fontSize: '0.75rem' }}>
                            <VpnKey sx={{ fontSize: 14, mr: 0.5 }} /> Permissions
                          </Button>
                          <Button size="small" onClick={() => handleEditRole(role)}
                            sx={{ textTransform: 'none', color: '#ffc107', fontWeight: 600, minWidth: 'auto' }}>
                            <Edit sx={{ fontSize: 16 }} />
                          </Button>
                          {!role.isSystemRole && (
                            <Button size="small" onClick={() => setDeleteConfirm(role.id)}
                              sx={{ textTransform: 'none', color: '#d32f2f', fontWeight: 600, minWidth: 'auto' }}>
                              <Delete sx={{ fontSize: 16 }} />
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* === TAB 1: PERMISSIONS === */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  size="small" placeholder="Search permissions..." value={permSearch}
                  onChange={e => setPermSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
                  sx={{ width: 300 }}
                />
                {selectedRoleForPerms && (
                  <Chip
                    label={`Editing: ${selectedRoleForPerms.name}`}
                    onDelete={() => setSelectedRoleForPerms(null)}
                    color="primary"
                    sx={{ fontWeight: 700 }}
                  />
                )}
              </Box>
              {selectedRoleForPerms && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Select All">
                    <IconButton onClick={handleSelectAllPerms} sx={{ color: '#2e7d32' }}><SelectAll /></IconButton>
                  </Tooltip>
                  <Tooltip title="Deselect All">
                    <IconButton onClick={handleDeselectAllPerms} sx={{ color: '#d32f2f' }}><Deselect /></IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>

            {!selectedRoleForPerms ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Security sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">Select a role to manage permissions</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Click on a role card in the Roles tab or use the role selector above
                </Typography>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                  {roles.slice(0, 5).map(role => {
                    const color = getRoleColor(role.name);
                    return (
                      <Chip
                        key={role.id}
                        label={role.name}
                        onClick={() => setSelectedRoleForPerms(role)}
                        sx={{ fontWeight: 600, bgcolor: `${color}10`, color, border: `1px solid ${color}30`, cursor: 'pointer', '&:hover': { bgcolor: `${color}20` } }}
                      />
                    );
                  })}
                </Box>
              </Box>
            ) : (
              <Box>
                {resources.map(resource => {
                  const resPerms = permissions.filter(p => p.resource === resource && (permSearch === '' || p.name.toLowerCase().includes(permSearch.toLowerCase()) || p.action.toLowerCase().includes(permSearch.toLowerCase())));
                  if (resPerms.length === 0) return null;
                  const isExpanded = expandedResources.includes(resource) || permSearch !== '';
                  const resColor = RESOURCE_COLORS[resource] || '#667eea';
                  const actions = ['create', 'read', 'update', 'delete', 'execute', 'manage'].filter(a => resPerms.some(p => p.action === a));
                  const allChecked = actions.every(a => resPerms.filter(p => p.action === a).every(p => hasPerm(selectedRoleForPerms.id, p.id)));
                  const someChecked = actions.some(a => resPerms.filter(p => p.action === a).some(p => hasPerm(selectedRoleForPerms.id, p.id)));

                  return (
                    <Paper key={resource} sx={{ mb: 2, borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, cursor: 'pointer', bgcolor: `${resColor}05`, '&:hover': { bgcolor: `${resColor}08` } }}
                        onClick={() => toggleExpandResource(resource)}
                      >
                        <Checkbox
                          checked={allChecked}
                          indeterminate={someChecked && !allChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            actions.forEach(a => handleBulkPermToggle(resource, a, e.target.checked));
                          }}
                          sx={{ color: resColor, '&.Mui-checked': { color: resColor } }}
                          onClick={e => e.stopPropagation()}
                        />
                        <Avatar sx={{ width: 32, height: 32, bgcolor: `${resColor}15`, color: resColor, fontSize: '0.85rem' }}>
                          {RESOURCE_LABELS[resource]?.[0] || resource[0]}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography fontWeight="700" fontSize="0.9rem">{RESOURCE_LABELS[resource] || resource}</Typography>
                          <Typography variant="caption" color="text.secondary">{resPerms.length} permissions</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {actions.map(a => {
                            const count = resPerms.filter(p => p.action === a).filter(p => hasPerm(selectedRoleForPerms.id, p.id)).length;
                            return (
                              <Chip key={a} label={`${a} ${count}/${resPerms.filter(p => p.action === a).length}`} size="small"
                                sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600, bgcolor: ACTION_BG[a] || '#f5f5f5', color: ACTION_COLORS[a] || '#666' }} />
                            );
                          })}
                        </Box>
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </Box>

                      {isExpanded && (
                        <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
                          <Grid container spacing={1.5}>
                            {resPerms.map(perm => {
                              const isChecked = hasPerm(selectedRoleForPerms.id, perm.id);
                              const aColor = ACTION_COLORS[perm.action] || '#666';
                              return (
                                <Grid item xs={12} sm={6} md={4} key={perm.id}>
                                  <Box
                                    onClick={() => handlePermToggle(perm.id)}
                                    sx={{
                                      display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: '8px',
                                      border: `1px solid ${isChecked ? `${aColor}40` : '#e0e0e0'}`,
                                      bgcolor: isChecked ? `${aColor}08` : 'transparent',
                                      cursor: 'pointer', transition: 'all 0.15s',
                                      '&:hover': { borderColor: `${aColor}60`, bgcolor: `${aColor}05` },
                                    }}
                                  >
                                    <Checkbox checked={isChecked} sx={{ color: aColor, '&.Mui-checked': { color: aColor }, p: 0 }} />
                                    <Box sx={{ flex: 1 }}>
                                      <Typography fontSize="0.8rem" fontWeight="600">{perm.name}</Typography>
                                      {perm.description && <Typography fontSize="0.65rem" color="text.secondary">{perm.description}</Typography>}
                                    </Box>
                                    <Chip label={perm.action} size="small"
                                      sx={{ height: 20, fontSize: '0.6rem', fontWeight: 600, bgcolor: ACTION_BG[perm.action] || '#f5f5f5', color: aColor }} />
                                  </Box>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </Box>
                      )}
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        {/* === TAB 2: PERMISSION MATRIX === */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>Permission Matrix</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Quick overview of all role-permission assignments. Rows = Resources, Columns = Roles.
            </Typography>
            <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', maxHeight: 'calc(100vh - 360px)' }}>
              <Table size="small" stickyHeader sx={{ tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa', width: 160, position: 'sticky', left: 0, zIndex: 2 }}>Resource / Action</TableCell>
                    {roles.map(role => {
                      const color = getRoleColor(role.name);
                      return (
                        <TableCell key={role.id} align="center" sx={{
                          fontWeight: 700, bgcolor: '#f8f9fa', minWidth: 120, borderBottom: `3px solid ${color}`,
                        }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Typography fontSize="0.8rem" fontWeight="700">{role.name}</Typography>
                            <Typography fontSize="0.6rem" color="text.secondary">{getPermCount(role.id)} perms</Typography>
                          </Box>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resources.map(resource => {
                    const resColor = RESOURCE_COLORS[resource] || '#667eea';
                    const actions = ['create', 'read', 'update', 'delete', 'execute', 'manage'].filter(a => permissions.some(p => p.resource === resource && p.action === a));
                    return (
                      <Fragment key={resource}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, bgcolor: `${resColor}08`, position: 'sticky', left: 0, zIndex: 1, borderBottom: 'none' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: resColor }} />
                              {RESOURCE_LABELS[resource] || resource}
                            </Box>
                          </TableCell>
                          {roles.map(role => (
                            <TableCell key={role.id} align="center" sx={{ bgcolor: `${resColor}03` }}>
                              <Typography fontSize="0.7rem" fontWeight="600" color={resColor}>
                                {getPermCount(role.id) > 0 ? '—' : ''}
                              </Typography>
                            </TableCell>
                          ))}
                        </TableRow>
                        {actions.map(action => {
                          const perm = permissions.find(p => p.resource === resource && p.action === action);
                          if (!perm) return null;
                          const aColor = ACTION_COLORS[action] || '#666';
                          return (
                            <TableRow key={`${resource}-${action}`}>
                              <TableCell sx={{ pl: 4, position: 'sticky', left: 0, zIndex: 1, bgcolor: 'white' }}>
                                <Chip label={action} size="small"
                                  sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600, bgcolor: ACTION_BG[action] || '#f5f5f5', color: aColor }} />
                              </TableCell>
                              {roles.map(role => {
                                const checked = hasPerm(role.id, perm.id);
                                return (
                                  <TableCell key={role.id} align="center">
                                    <Checkbox
                                      checked={checked}
                                      disabled={role.isSystemRole && role.name === 'Super Admin'}
                                      size="small"
                                      sx={{ color: '#ccc', '&.Mui-checked': { color: aColor } }}
                                      onChange={() => handlePermToggle(perm.id)}
                                    />
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* === TAB 3: USER ROLES === */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <TextField
                size="small" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
                sx={{ width: 300 }}
              />
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Assigned Roles</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user: any) => {
                    const userRoles = user.roles || [];
                    return (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: '#667eea15', color: '#667eea', fontSize: '0.85rem' }}>
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography fontWeight="600" fontSize="0.85rem">{user.firstName} {user.lastName}</Typography>
                              {user.department && <Typography variant="caption" color="text.secondary">{user.department}</Typography>}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography fontSize="0.8rem">{user.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={user.isActive ? 'Active' : 'Inactive'} size="small"
                            sx={{ fontWeight: 600, bgcolor: user.isActive ? '#e8f5e9' : '#ffebee', color: user.isActive ? '#2e7d32' : '#d32f2f' }} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {userRoles.length > 0 ? userRoles.map((roleName: string) => {
                              const role = roles.find(r => r.name === roleName);
                              const color = getRoleColor(roleName);
                              return (
                                <Chip key={roleName} label={roleName} size="small"
                                  onDelete={() => role && handleRemoveRoleFromUser(user.id, role.id)}
                                  sx={{ fontWeight: 600, bgcolor: `${color}15`, color, '& .MuiChip-deleteIcon': { color: `${color}60` } }} />
                              );
                            }) : (
                              <Typography fontSize="0.75rem" color="text.secondary">No roles assigned</Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Manage Roles">
                            <IconButton size="small" onClick={() => {
                              setAssignUserDialog(user.id);
                              setSelectedRolesForUser(user.roles?.map((r: string) => roles.find(role => role.name === r)?.id).filter(Boolean) || []);
                            }} sx={{ color: '#667eea' }}>
                              <PersonAdd fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* Role Create/Edit Drawer */}
      {roleDrawerOpen && (
        <>
          <Box onClick={() => setRoleDrawerOpen(false)} sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.3)', zIndex: 1200 }} />
          <Paper sx={{
            position: 'fixed', top: 0, right: 0, width: 440, height: '100vh', zIndex: 1201,
            boxShadow: '-8px 0 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column',
          }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: '#667eea15', color: '#667eea' }}><Shield /></Avatar>
                <Typography variant="h6" fontWeight="700">{selectedRole ? 'Edit Role' : 'Create Role'}</Typography>
              </Box>
              <IconButton onClick={() => setRoleDrawerOpen(false)}><Close /></IconButton>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Role Name" size="small" value={roleForm.name}
                    onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Security sx={{ fontSize: 18, color: '#667eea' }} /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Description" size="small" multiline rows={3} value={roleForm.description}
                    onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Hierarchy Level" type="number" size="small" value={roleForm.hierarchy}
                    onChange={e => setRoleForm({ ...roleForm, hierarchy: parseInt(e.target.value) || 1 })} />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel control={<Switch checked={roleForm.isSystemRole}
                    onChange={e => setRoleForm({ ...roleForm, isSystemRole: e.target.checked })} />}
                    label="System Role" sx={{ mt: 1 }} />
                </Grid>

                {!selectedRole && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 1.5, mt: 1 }}>Quick Start Templates</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {ROLE_TEMPLATES.map(template => (
                        <Chip key={template.name} label={template.name} onClick={() => {
                          setRoleForm({ name: template.name, description: template.description, hierarchy: roles.length + 1, isSystemRole: false });
                        }} sx={{ fontWeight: 600, cursor: 'pointer' }} variant="outlined" />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>

            <Box sx={{ p: 3, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1 }}>
              <Button fullWidth variant="outlined" onClick={() => setRoleDrawerOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
              <Button fullWidth variant="contained" onClick={handleSaveRole} disabled={creatingRole || updatingRole || !roleForm.name}
                sx={{ textTransform: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                {creatingRole || updatingRole ? <CircularProgress size={20} /> : selectedRole ? 'Update Role' : 'Create Role'}
              </Button>
            </Box>
          </Paper>
        </>
      )}

      {/* User Role Assignment Dialog */}
      <Dialog open={!!assignUserDialog} onClose={() => setAssignUserDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd sx={{ color: '#667eea' }} /> Assign Roles
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select roles to assign to this user:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {roles.map(role => {
              const color = getRoleColor(role.name);
              const Icon = getRoleIcon(role.name);
              return (
                <Box key={role.id} onClick={() => {
                  setSelectedRolesForUser(prev => prev.includes(role.id) ? prev.filter(id => id !== role.id) : [...prev, role.id]);
                }} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '8px', cursor: 'pointer',
                  border: `1px solid ${selectedRolesForUser.includes(role.id) ? `${color}60` : '#e0e0e0'}`,
                  bgcolor: selectedRolesForUser.includes(role.id) ? `${color}08` : 'transparent',
                  '&:hover': { bgcolor: `${color}05` },
                }}>
                  <Checkbox checked={selectedRolesForUser.includes(role.id)} sx={{ color: `${color}60`, '&.Mui-checked': { color } }} />
                  <Avatar sx={{ width: 32, height: 32, bgcolor: `${color}15`, color }}>
                    <Icon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box>
                    <Typography fontWeight="600" fontSize="0.85rem">{role.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{role.description}</Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAssignUserDialog(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={() => assignUserDialog && handleAssignRoleToUser(assignUserDialog)}
            sx={{ textTransform: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
            Save Roles
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle fontWeight="700">Delete Role</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this role? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteRole} sx={{ textTransform: 'none' }}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
