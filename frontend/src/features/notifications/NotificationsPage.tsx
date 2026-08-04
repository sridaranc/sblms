import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Chip, Checkbox, TablePagination, Alert, Snackbar,
} from '@mui/material';
import { CheckCircle, NotificationsNone } from '@mui/icons-material';
import { useState } from 'react';
import { useGetNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation, useGetUnreadCountQuery } from '../../api/api';

export default function NotificationsPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data } = useGetNotificationsQuery({ pageNumber: page + 1, pageSize: rowsPerPage });
  const { data: unreadData } = useGetUnreadCountQuery(undefined);
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const notifications = data?.data?.items || [];
  const totalCount = data?.data?.totalCount || 0;

  const handleMarkAsRead = async (id: string) => {
    try { await markAsRead(id).unwrap(); setSnackbar({ open: true, message: 'Marked as read', severity: 'success' }); } catch { setSnackbar({ open: true, message: 'Failed', severity: 'error' }); }
  };
  const handleMarkAllAsRead = async () => {
    try { await markAllAsRead(undefined).unwrap(); setSnackbar({ open: true, message: 'All marked as read', severity: 'success' }); } catch { setSnackbar({ open: true, message: 'Failed', severity: 'error' }); }
  };

  return (
    <Box className="animate-in">
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" fontWeight="800" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' }, background: 'linear-gradient(135deg, #1a1a3e, #ff6b6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Notifications</Typography>
          {unreadData && unreadData.count > 0 && <Chip label={`${unreadData.count} unread`} color="error" size="small" />}
        </Box>
        <Button variant="outlined" startIcon={<CheckCircle />} onClick={handleMarkAllAsRead} size="small" sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}>Mark All as Read</Button>
      </Box>

      <TableContainer component={Paper} sx={{ overflow: 'auto' }}>
        <Table>
          <TableHead><TableRow>
            <TableCell padding="checkbox"></TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {notifications.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                <NotificationsNone sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                <Typography color="text.secondary">No notifications</Typography>
              </TableCell></TableRow>
            ) : notifications.map((n: any) => (
              <TableRow key={n.id} hover sx={{ background: n.isRead ? 'transparent' : 'rgba(102,126,234,0.03)' }}>
                <TableCell padding="checkbox"><Checkbox checked={n.isRead} disabled /></TableCell>
                <TableCell sx={{ fontWeight: n.isRead ? 400 : 600 }}>{n.message}</TableCell>
                <TableCell><Chip label={n.typeName || n.type} size="small" /></TableCell>
                <TableCell>{new Date(n.createdAt).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  {!n.isRead && <IconButton size="small" color="primary" onClick={() => handleMarkAsRead(n.id)}><CheckCircle fontSize="small" /></IconButton>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination component="div" count={totalCount} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} />
      </TableContainer>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
