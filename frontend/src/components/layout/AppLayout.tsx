import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem,
  List, ListItemButton, ListItemIcon, ListItemText, Divider, Badge, useTheme, useMediaQuery,
  Tooltip, Chip,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, People, Assessment, CalendarMonth, EventNote,
  Notifications, Settings, Logout, ChevronLeft, Person, BusinessCenter,
  AutoAwesome, ContactPhone, AccessTime, Face, Security, AddCircleOutline, ScheduleSend,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { usePermission } from '../../hooks/usePermission';
import NotificationBell from '../NotificationBell';
import type { ReactNode } from 'react';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', gradient: 'linear-gradient(135deg, #667eea, #764ba2)', permission: 'dashboard-read' },
  { text: 'Attendance', icon: <AccessTime />, path: '/attendance', gradient: 'linear-gradient(135deg, #00c9a7, #4facfe)', permission: 'attendance-read' },
  { text: 'AI Leads', icon: <AutoAwesome />, path: '/ai-leads', gradient: 'linear-gradient(135deg, #ff6b6b, #ff8e53)' },
  { text: 'Leads', icon: <People />, path: '/leads', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)', permission: 'leads-read' },
  { text: 'Clients', icon: <ContactPhone />, path: '/clients', gradient: 'linear-gradient(135deg, #00c9a7, #4facfe)', permission: 'clients-read' },
  { text: 'Follow-ups', icon: <EventNote />, path: '/follow-ups', gradient: 'linear-gradient(135deg, #fa709a, #fee140)', permission: 'followups-read' },
  { text: 'Meetings', icon: <CalendarMonth />, path: '/meetings', gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', permission: 'meetings-read' },
  { text: 'Reports', icon: <Assessment />, path: '/reports', gradient: 'linear-gradient(135deg, #00c9a7, #4facfe)', permission: 'reports-read' },
  { text: 'Face Enrolment', icon: <Face />, path: '/face-enrolment', gradient: 'linear-gradient(135deg, #667eea, #00c9a7)', permission: 'face-enrolment-read' },
  { text: 'Notifications', icon: <Notifications />, path: '/notifications', showBadge: true, gradient: 'linear-gradient(135deg, #ff6b6b, #ffc107)', permission: 'notifications-read' },
  { text: 'Users', icon: <Person />, path: '/users', gradient: 'linear-gradient(135deg, #667eea, #00c9a7)', permission: 'users-read' },
  { text: 'Access Control', icon: <Security />, path: '/settings/roles', gradient: 'linear-gradient(135deg, #667eea, #764ba2)', permission: 'roles-read' },
  { text: 'Settings', icon: <Settings />, path: '/settings', gradient: 'linear-gradient(135deg, #6b7280, #9ca3af)', permission: 'settings-read' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { unreadCount } = useAppSelector((state) => state.ui);
  const { has, isAdmin } = usePermission();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Box sx={{
          width: 40, height: 40,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(102,126,234,0.4)',
        }}>
          <BusinessCenter sx={{ color: 'white', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight="800" color="white" sx={{ lineHeight: 1.2, letterSpacing: '-0.02em' }}>SBLMS</Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>Lead Management</Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} sx={{ ml: 'auto', color: 'rgba(255,255,255,0.7)' }}>
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      {/* Quick Actions */}
      <Box sx={{ px: 1.5, pt: 1.5, pb: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', px: 1, fontSize: '0.6rem' }}>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Box
            onClick={() => { navigate('/meetings/new'); if (isMobile) setMobileOpen(false); }}
            sx={{ flex: 1, p: 1.5, borderRadius: '10px', background: 'linear-gradient(135deg, rgba(161,140,209,0.3), rgba(251,194,235,0.3))', cursor: 'pointer', textAlign: 'center', '&:hover': { background: 'linear-gradient(135deg, rgba(161,140,209,0.5), rgba(251,194,235,0.5))' } }}
          >
            <ScheduleSend sx={{ color: '#fbc2eb', fontSize: 20 }} />
            <Typography fontSize="0.65rem" fontWeight="600" color="white" sx={{ mt: 0.3 }}>Schedule Meeting</Typography>
          </Box>
          <Box
            onClick={() => { navigate('/follow-ups/new'); if (isMobile) setMobileOpen(false); }}
            sx={{ flex: 1, p: 1.5, borderRadius: '10px', background: 'linear-gradient(135deg, rgba(250,112,154,0.3), rgba(254,225,64,0.3))', cursor: 'pointer', textAlign: 'center', '&:hover': { background: 'linear-gradient(135deg, rgba(250,112,154,0.5), rgba(254,225,64,0.5))' } }}
          >
            <AddCircleOutline sx={{ color: '#fee140', fontSize: 20 }} />
            <Typography fontSize="0.65rem" fontWeight="600" color="white" sx={{ mt: 0.3 }}>Create Follow-up</Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 1.5 }} />

      <Box sx={{ px: 1.5, pt: 2, pb: 1 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', px: 1, fontSize: '0.6rem' }}>
          Navigation
        </Typography>
      </Box>

      <List sx={{ px: 1.5, flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {menuItems
          .filter(item => {
            if (!item.permission) {
              if (item.path === '/ai-leads') {
                return user?.role === 'admin' || user?.role === 'manager';
              }
              return true;
            }
            return has(item.permission) || isAdmin();
          })
          .map((item) => {
          const active = isActive(item.path);
          return (
            <Tooltip key={item.path} title={item.text} placement="right" arrow>
              <ListItemButton
                selected={false}
                onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
                sx={{
                  borderRadius: '12px',
                  mb: 0.5,
                  py: 1.2,
                  px: 1.5,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  ...(active ? {
                    background: item.gradient,
                    boxShadow: `0 4px 16px rgba(102,126,234,0.3)`,
                    '&:hover': { boxShadow: `0 6px 20px rgba(102,126,234,0.4)` },
                  } : {
                    '&:hover': { background: 'rgba(255,255,255,0.08)' },
                  }),
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: active ? 'white' : 'rgba(255,255,255,0.6)' }}>
                  {item.showBadge && unreadCount > 0 ? (
                    <Badge badgeContent={unreadCount} color="error">{item.icon}</Badge>
                  ) : item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? 'white' : 'rgba(255,255,255,0.7)',
                  }}
                />
                {active && (
                  <Box sx={{
                    position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: '60%', borderRadius: '3px 0 0 3px',
                    background: 'rgba(255,255,255,0.5)',
                  }} />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2 }} />

      <Box sx={{ p: 1.5 }}>
        <Box sx={{
          p: 1.5,
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 1.5, mb: 1,
        }}>
          <Avatar sx={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            fontSize: '0.8rem', fontWeight: 700,
          }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight="600" color="white" noWrap>{user?.firstName} {user?.lastName}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }} noWrap>{user?.email}</Typography>
          </Box>
        </Box>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: '12px',
            py: 1,
            '&:hover': { background: 'rgba(255,107,107,0.15)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Logout sx={{ color: '#ff6b6b', fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          color: 'text.primary',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ py: 0.5 }}>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flex: 1 }} />
          <NotificationBell />
          <Chip
            label={`Welcome, ${user?.firstName || 'User'}`}
            sx={{
              background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))',
              color: '#667eea',
              fontWeight: 600,
              mr: 1,
              display: { xs: 'none', sm: 'flex' },
            }}
          />
          <IconButton color="inherit" onClick={handleMenuOpen} sx={{ p: 0.5 }}>
            <Avatar sx={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              fontSize: '0.85rem', fontWeight: 700,
              boxShadow: '0 2px 8px rgba(102,126,234,0.3)',
            }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{ sx: { borderRadius: '16px', mt: 1, minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
          >
            <MenuItem disabled sx={{ py: 1.5 }}>
              <Box>
                <Typography variant="body2" fontWeight="600">{user?.firstName} {user?.lastName}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }} sx={{ py: 1.2 }}>
              <ListItemIcon><Settings fontSize="small" /></ListItemIcon>Settings
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ py: 1.2, color: 'error.main' }}>
              <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #0c0c1d 0%, #1a1a3e 40%, #2d1b69 70%, #3d1b7a 100%)',
            borderRight: 'none',
            boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
          },
        }}
      >
        {drawer}
      </Drawer>
      <Box component="main" sx={{
        flexGrow: 1,
        p: { xs: 2, md: 3 },
        mt: 8,
        minHeight: '100vh',
        background: '#f0f2f8',
      }}>
        {children || <Outlet />}
      </Box>
    </Box>
  );
}
