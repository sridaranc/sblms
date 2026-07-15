import { Box, Typography, Avatar } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  trend?: { value: number; isPositive: boolean };
}

export default function StatCard({ title, value, icon, color, gradient, trend }: StatCardProps) {
  return (
    <Box sx={{
      p: 3,
      borderRadius: '20px',
      background: 'white',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' },
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight="500" sx={{ mb: 0.5 }}>{title}</Typography>
          <Typography variant="h4" fontWeight="800" sx={{ color: '#1a1a3e' }}>{value}</Typography>
        </Box>
        <Avatar sx={{
          width: 52, height: 52,
          background: gradient,
          boxShadow: `0 4px 16px ${color}40`,
        }}>
          {icon}
        </Avatar>
      </Box>

      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {trend.isPositive ? (
            <TrendingUp sx={{ fontSize: 18, color: '#00c9a7' }} />
          ) : (
            <TrendingDown sx={{ fontSize: 18, color: '#ff6b6b' }} />
          )}
          <Typography variant="caption" fontWeight="600" sx={{ color: trend.isPositive ? '#00c9a7' : '#ff6b6b' }}>
            {trend.value}%
          </Typography>
          <Typography variant="caption" color="text.secondary">vs last month</Typography>
        </Box>
      )}

      <Box sx={{
        position: 'absolute', top: 0, right: 0,
        width: 100, height: 100,
        background: `radial-gradient(circle at top right, ${color}10, transparent)`,
      }} />
    </Box>
  );
}
