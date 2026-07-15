import { Box, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider } from '@mui/material';
import { PersonAdd, Edit, Delete, CheckCircle, EventNote, TrendingUp, Notifications } from '@mui/icons-material';

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user?: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

const activityIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  lead_created: { icon: <PersonAdd />, color: '#667eea' },
  lead_updated: { icon: <Edit />, color: '#ffc107' },
  lead_deleted: { icon: <Delete />, color: '#ff6b6b' },
  lead_converted: { icon: <CheckCircle />, color: '#00c9a7' },
  followup: { icon: <EventNote />, color: '#fa709a' },
  meeting: { icon: <EventNote />, color: '#a18cd1' },
  notification: { icon: <Notifications />, color: '#4facfe' },
  performance: { icon: <TrendingUp />, color: '#00c9a7' },
};

const getTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <Box>
      <Typography variant="h6" fontWeight="700" sx={{ mb: 2, color: '#1a1a3e' }}>Recent Activities</Typography>
      <List sx={{ p: 0 }}>
        {activities.map((activity, index) => {
          const iconData = activityIcons[activity.type] || activityIcons.notification;
          return (
            <Box key={activity.id}>
              <ListItem sx={{ px: 0, py: 1.5 }}>
                <ListItemAvatar>
                  <Avatar sx={{
                    width: 40, height: 40,
                    bgcolor: `${iconData.color}15`,
                    color: iconData.color,
                  }}>
                    {iconData.icon}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight="600">{activity.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{getTimeAgo(activity.timestamp)}</Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {activity.description}
                      {activity.user && ` — by ${activity.user}`}
                    </Typography>
                  }
                />
              </ListItem>
              {index < activities.length - 1 && <Divider variant="inset" component="li" />}
            </Box>
          );
        })}
      </List>
    </Box>
  );
}
