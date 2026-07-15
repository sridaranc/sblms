import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 30%, #2d1b69 60%, #4a1a7a 100%)',
    }}>
      <Paper elevation={0} sx={{
        p: 5,
        maxWidth: 400,
        borderRadius: '24px',
        background: 'rgba(255,255,255,0.95)',
        textAlign: 'center',
      }}>
        <Typography variant="h4" fontWeight="800" sx={{ mb: 2 }}>
          Access Denied
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          You do not have permission to access this page.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/dashboard')}
          sx={{ px: 4, py: 1.5, borderRadius: '12px' }}
        >
          Go to Dashboard
        </Button>
      </Paper>
    </Box>
  );
}