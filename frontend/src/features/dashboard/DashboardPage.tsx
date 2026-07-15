import { Box, Typography, Grid, LinearProgress, Paper, Button } from '@mui/material';
import { People, Assessment, EventNote, TrendingDown, CheckCircle, CalendarMonth, PersonAdd, AccessTime } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { useGetDashboardStatsQuery } from '../../api/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../../components/common/StatCard';
import ActivityTimeline from '../../components/common/ActivityTimeline';

const COLORS = ['#667eea', '#764ba2', '#00c9a7', '#ffc107', '#ff6b6b', '#4facfe'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { data: stats, isLoading } = useGetDashboardStatsQuery(undefined);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const quickActions = [
    { label: 'Add Lead', icon: <PersonAdd />, path: '/leads/new', color: '#667eea' },
    { label: 'Schedule Meeting', icon: <CalendarMonth />, path: '/meetings/new', color: '#a18cd1' },
    { label: 'Check In', icon: <AccessTime />, path: '/attendance', color: '#00c9a7' },
    { label: 'View Reports', icon: <Assessment />, path: '/reports', color: '#fa709a' },
  ];

  const activities = (stats?.recentActivities || []).map((a: any, i: number) => ({
    id: i.toString(),
    type: a.typeName?.toLowerCase().replace(/\s/g, '_') || 'notification',
    title: a.typeName || 'Activity',
    description: a.description || '',
    timestamp: a.createdAt || new Date().toISOString(),
    user: a.userName || '',
  }));

  if (isLoading) return (
    <Box sx={{ width: '100%' }}>
      <LinearProgress sx={{ height: 4, borderRadius: 2, '& .MuiLinearProgress-bar': { background: 'linear-gradient(135deg, #667eea, #764ba2)' } }} />
    </Box>
  );

  return (
    <Box className="animate-in">
      <Box sx={{ p: 3, mb: 3, borderRadius: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -20, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <Box sx={{ position: 'absolute', bottom: -30, right: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" fontWeight="800" sx={{ mb: 0.5 }}>
            {getGreeting()}, {user?.firstName}!
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.85, mb: 2 }}>
            Here's what's happening with your business today.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {quickActions.map((action) => (
              <Button key={action.label} startIcon={action.icon} onClick={() => navigate(action.path)}
                sx={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '10px', textTransform: 'none', fontWeight: 600, '&:hover': { background: 'rgba(255,255,255,0.3)' } }}>
                {action.label}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Total Leads" value={stats?.totalLeads || 0} icon={<People />} color="#667eea" gradient="linear-gradient(135deg, #667eea, #764ba2)" trend={{ value: 12, isPositive: true }} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Converted" value={stats?.convertedLeads || 0} icon={<CheckCircle />} color="#00c9a7" gradient="linear-gradient(135deg, #00c9a7, #4facfe)" trend={{ value: 8, isPositive: true }} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Total Value" value={`$${(stats?.totalValue || 0).toLocaleString()}`} icon={<Assessment />} color="#fa709a" gradient="linear-gradient(135deg, #fa709a, #fee140)" trend={{ value: 5, isPositive: true }} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Today's Follow-ups" value={stats?.todayFollowUps || 0} icon={<EventNote />} color="#ffc107" gradient="linear-gradient(135deg, #ffc107, #ffcd38)" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Upcoming Meetings" value={stats?.upcomingMeetings || 0} icon={<CalendarMonth />} color="#a18cd1" gradient="linear-gradient(135deg, #a18cd1, #fbc2eb)" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Lost Leads" value={stats?.lostLeads || 0} icon={<TrendingDown />} color="#ff6b6b" gradient="linear-gradient(135deg, #ff6b6b, #ff8e8e)" trend={{ value: 3, isPositive: false }} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: '16px' }}>
            <Typography variant="h6" fontWeight="700" gutterBottom>Leads Pipeline</Typography>
            {stats?.leadsByStatus && stats.leadsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={stats.leadsByStatus} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {stats.leadsByStatus.map((_: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">No data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: '16px' }}>
            <Typography variant="h6" fontWeight="700" gutterBottom>Lead Distribution</Typography>
            {stats?.leadsByStatus && stats.leadsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={stats.leadsByStatus.map((s: any) => ({ name: s.status, value: s.count }))} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                    {stats.leadsByStatus.map((_: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">No data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {stats?.monthlyLeads && stats.monthlyLeads.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: '16px' }}>
          <Typography variant="h6" fontWeight="700" gutterBottom>Monthly Trends</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyLeads} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
              <Legend />
              <Line type="monotone" dataKey="created" stroke="#667eea" strokeWidth={3} dot={{ r: 4, fill: '#667eea' }} name="Created" />
              <Line type="monotone" dataKey="converted" stroke="#00c9a7" strokeWidth={3} dot={{ r: 4, fill: '#00c9a7' }} name="Converted" />
              <Line type="monotone" dataKey="lost" stroke="#ff6b6b" strokeWidth={3} dot={{ r: 4, fill: '#ff6b6b' }} name="Lost" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {activities.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: '16px' }}>
          <ActivityTimeline activities={activities} />
        </Paper>
      )}
    </Box>
  );
}
