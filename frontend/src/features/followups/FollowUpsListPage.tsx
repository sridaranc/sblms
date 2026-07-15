import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Chip, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Snackbar, Grid, TablePagination,
} from '@mui/material';
import { Add, Edit, CheckCircle, Cancel, EventNote } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetFollowUpsQuery, useCompleteFollowUpMutation, useCancelFollowUpMutation, useGetOverdueFollowUpsQuery } from '../../api/api';
import { Can } from '../../components/Can';

const statusColors: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  Pending: 'info', Completed: 'success', Cancelled: 'error', Overdue: 'warning',
};

const statusGradients: Record<string, string> = {
  Pending: 'linear-gradient(135deg, #4facfe, #00f2fe)', Completed: 'linear-gradient(135deg, #00c9a7, #4facfe)',
  Cancelled: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)', Overdue: 'linear-gradient(135deg, #fa709a, #fee140)',
};

export default function FollowUpsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [completeDialog, setCompleteDialog] = useState<any>(null);
  const [cancelDialog, setCancelDialog] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data } = useGetFollowUpsQuery({ pageNumber: page + 1, pageSize: rowsPerPage, status: statusFilter });
  const { data: overdueData } = useGetOverdueFollowUpsQuery(undefined);
  const [completeFollowUp] = useCompleteFollowUpMutation();
  const [cancelFollowUp] = useCancelFollowUpMutation();

  const followUps = data || [];

  const handleComplete = async () => {
    try {
      await completeFollowUp({ id: completeDialog.id, notes }).unwrap();
      setSnackbar({ open: true, message: 'Follow-up completed', severity: 'success' });
      setCompleteDialog(null);
      setNotes('');
    } catch {
      setSnackbar({ open: true, message: 'Failed to complete', severity: 'error' });
    }
  };

  const handleCancel = async () => {
    try {
      await cancelFollowUp({ id: cancelDialog.id, reason }).unwrap();
      setSnackbar({ open: true, message: 'Follow-up cancelled', severity: 'success' });
      setCancelDialog(null);
      setReason('');
    } catch {
      setSnackbar({ open: true, message: 'Failed to cancel', severity: 'error' });
    }
  };

  return (
    <Box className="animate-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ background: 'linear-gradient(135deg, #1a1a3e, #fa709a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Follow-ups
          </Typography>
          <Typography variant="body2" color="text.secondary">Track and manage your follow-up activities</Typography>
        </Box>
        <Can permission="followups-create">
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/follow-ups/new')} sx={{ px: 3 }}>
            New Follow-up
          </Button>
        </Can>
      </Box>

      {Array.isArray(overdueData) && overdueData.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: '12px' }}>
          You have {overdueData.length} overdue follow-up(s) that need attention
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All Statuses</MenuItem>
              {Object.keys(statusColors).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Lead</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {followUps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <EventNote sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                  <Typography color="text.secondary">No follow-ups found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              followUps.map((fu: any) => (
                <TableRow key={fu.id} hover>
                  <TableCell><Chip label={fu.leadNumber || '-'} size="small" sx={{ fontWeight: 600 }} /></TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{fu.customerName || '-'}</TableCell>
                  <TableCell>{new Date(fu.scheduledDate).toLocaleDateString()}</TableCell>
                  <TableCell>{fu.scheduledTime || '-'}</TableCell>
                  <TableCell>
                    <Chip label={fu.statusName || fu.status} size="small"
                      sx={{ fontWeight: 600, background: statusGradients[fu.statusName || fu.status], color: 'white' }} />
                  </TableCell>
                  <TableCell>{fu.userName || '-'}</TableCell>
                  <TableCell align="right">
                    {(fu.statusName === 'Pending' || fu.status === 'Pending') && (
                      <>
                        <IconButton size="small" color="success" onClick={() => setCompleteDialog(fu)}><CheckCircle fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => setCancelDialog(fu)}><Cancel fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => navigate(`/follow-ups/${fu.id}/edit`)} sx={{ color: '#ffc107' }}><Edit fontSize="small" /></IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={data?.length || 0}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      <Dialog open={!!completeDialog} onClose={() => setCompleteDialog(null)} PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle fontWeight="700">Complete Follow-up</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={3} label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleComplete}>Complete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!cancelDialog} onClose={() => setCancelDialog(null)} PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle fontWeight="700">Cancel Follow-up</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={3} label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleCancel}>Cancel Follow-up</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
