import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { useManualAttendanceMutation, useGetUsersQuery } from '../../api/api';

interface ManualAttendanceDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ManualAttendanceDialog: React.FC<ManualAttendanceDialogProps> = ({ open, onClose }) => {
  const [manualEntry] = useManualAttendanceMutation();
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery({ pageSize: 1000, isActive: true });
  
  const [formData, setFormData] = useState({
    targetUserId: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: '',
    checkOutTime: '',
    status: 'Present',
    notes: '',
  });

  const users = Array.isArray(usersData) ? usersData : 
                Array.isArray(usersData?.items) ? usersData.items : 
                Array.isArray(usersData?.data?.items) ? usersData.data.items : 
                Array.isArray(usersData?.data) ? usersData.data : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await manualEntry({
        targetUserId: formData.targetUserId || null,
        date: new Date(formData.date).toISOString(),
        checkInTime: formData.checkInTime ? `${formData.checkInTime}:00` : null,
        checkOutTime: formData.checkOutTime ? `${formData.checkOutTime}:00` : null,
        status: formData.status,
        notes: formData.notes,
      }).unwrap();
      onClose();
    } catch (err) {
      console.error('Failed to submit manual attendance:', err);
      alert('Failed to submit manual attendance. Please try again.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Manual Attendance Entry</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>User (Leave blank for self)</InputLabel>
                <Select
                  value={formData.targetUserId}
                  label="User (Leave blank for self)"
                  onChange={(e) => setFormData({ ...formData, targetUserId: e.target.value })}
                  disabled={isLoadingUsers}
                >
                  <MenuItem value=""><em>Self</em></MenuItem>
                  {users.map((user: any) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Check In Time"
                value={formData.checkInTime}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Check Out Time"
                value={formData.checkOutTime}
                onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Present">Present</MenuItem>
                  <MenuItem value="Absent">Absent</MenuItem>
                  <MenuItem value="Late">Late</MenuItem>
                  <MenuItem value="HalfDay">Half Day</MenuItem>
                  <MenuItem value="OnLeave">On Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes (Optional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" color="primary">Save Record</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
