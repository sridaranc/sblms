import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Chip, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Snackbar, Grid, TablePagination,
} from '@mui/material';
import { Add, Edit, CheckCircle, Cancel, CalendarMonth } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetMeetingsQuery, useCompleteMeetingMutation, useCancelMeetingMutation } from '../../api/api';
import { Can } from '../../components/Can';

const statusColors: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  Scheduled: 'info', Completed: 'success', Cancelled: 'error', Rescheduled: 'warning', InProgress: 'info',
};

const statusGradients: Record<string, string> = {
  Scheduled: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', Completed: 'linear-gradient(135deg, #00c9a7, #4facfe)',
  Cancelled: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)', Rescheduled: 'linear-gradient(135deg, #ffc107, #ffcd38)',
};

export default function MeetingsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [completeDialog, setCompleteDialog] = useState<any>(null);
  const [cancelDialog, setCancelDialog] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('');
  const [reason, setReason] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data } = useGetMeetingsQuery({ pageNumber: page + 1, pageSize: rowsPerPage, status: statusFilter });
  const [completeMeeting] = useCompleteMeetingMutation();
  const [cancelMeeting] = useCancelMeetingMutation();

  const meetings = data || [];

  const handleComplete = async () => {
    try {
      await completeMeeting({ id: completeDialog.id, notes, outcome }).unwrap();
      setSnackbar({ open: true, message: 'Meeting completed', severity: 'success' });
      setCompleteDialog(null);
      setNotes('');
      setOutcome('');
    } catch {
      setSnackbar({ open: true, message: 'Failed to complete', severity: 'error' });
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMeeting({ id: cancelDialog.id, reason }).unwrap();
      setSnackbar({ open: true, message: 'Meeting cancelled', severity: 'success' });
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
          <Typography variant="h4" fontWeight="800" sx={{ background: 'linear-gradient(135deg, #1a1a3e, #a18cd1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Meetings
          </Typography>
          <Typography variant="body2" color="text.secondary">Schedule and manage your meetings</Typography>
        </Box>
        <Can permission="meetings-create">
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/meetings/new')} sx={{ px: 3 }}>
            New Meeting
          </Button>
        </Can>
      </Box>

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
              <TableCell>Title</TableCell>
              <TableCell>Lead</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {meetings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CalendarMonth sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                  <Typography color="text.secondary">No meetings found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              meetings.map((m: any) => (
                <TableRow key={m.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{m.title}</TableCell>
                  <TableCell>{m.customerName || '-'}</TableCell>
                  <TableCell>{new Date(m.scheduledDate).toLocaleDateString()}</TableCell>
                  <TableCell>{m.location || '-'}</TableCell>
                  <TableCell>
                    <Chip label={m.statusName || m.status} size="small"
                      sx={{ fontWeight: 600, background: statusGradients[m.statusName || m.status], color: 'white' }} />
                  </TableCell>
                  <TableCell align="right">
                    {(m.statusName === 'Scheduled' || m.status === 'Scheduled') && (
                      <>
                        <IconButton size="small" color="success" onClick={() => setCompleteDialog(m)}><CheckCircle fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => setCancelDialog(m)}><Cancel fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => navigate(`/meetings/${m.id}/edit`)} sx={{ color: '#ffc107' }}><Edit fontSize="small" /></IconButton>
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
        <DialogTitle fontWeight="700">Complete Meeting</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} sx={{ mt: 1, mb: 2 }} />
          <TextField fullWidth multiline rows={3} label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleComplete}>Complete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!cancelDialog} onClose={() => setCancelDialog(null)} PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle fontWeight="700">Cancel Meeting</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={3} label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleCancel}>Cancel Meeting</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
