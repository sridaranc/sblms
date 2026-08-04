import { Box, Typography, Grid, Paper, Chip, Button, Card, CardContent, Divider, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar, CircularProgress, MenuItem, Avatar, Stepper, Step, StepLabel, StepContent, IconButton, Tooltip } from '@mui/material';
import { Edit, ArrowBack, Person, Business, Email, Phone, Language, TrendingUp, Event, VideoCall, Send, ContentCopy, OpenInNew, Schedule, LocationOn, ContactPhone, CheckCircle, Cancel, Add, AccessTime, Flag } from '@mui/icons-material';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetLeadByIdQuery, useUpdateLeadStatusMutation, useAssignLeadMutation, useGetUsersQuery, useSetupMeetingMutation, useSendMeetingToClientMutation, useGetLeadMeetingsQuery, useGetFollowUpsQuery, useCreateFollowUpMutation, useCompleteFollowUpMutation, useCancelFollowUpMutation } from '../../api/api';
import { Can } from '../../components/Can';

const statusColors: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  New: 'info', FollowUp: 'warning', Contacted: 'info', Interested: 'info', MeetingScheduled: 'warning',
  ProposalSent: 'warning', Negotiation: 'warning', Converted: 'success', Lost: 'error', Closed: 'default',
};

const statuses = ['New', 'Contacted', 'FollowUp', 'Interested', 'MeetingScheduled', 'ProposalSent', 'Negotiation', 'Converted', 'Lost', 'Closed'];

const meetingTypes = [
  { value: 0, label: 'Google Meet', icon: '🟢', color: '#10a37f', desc: 'Free, browser-based' },
  { value: 1, label: 'Microsoft Teams', icon: '🟣', color: '#6264a7', desc: 'Enterprise collaboration' },
  { value: 2, label: 'Zoom', icon: '🔵', color: '#2d8cff', desc: 'Video conferencing' },
  { value: 3, label: 'Webex', icon: '🟠', color: '#f47b20', desc: 'Cisco meetings' },
  { value: 4, label: 'Phone Call', icon: '📞', color: '#667eea', desc: 'Direct call' },
  { value: 5, label: 'In-Person', icon: '🤝', color: '#00c9a7', desc: 'Face to face' },
];

const setupStatusColors: Record<string, string> = {
  NotStarted: '#999', SettingUp: '#ffc107', Ready: '#4caf50', SentToClient: '#2196f3', Accepted: '#00c9a7', Declined: '#ff6b6b',
};

const clientResponseColors: Record<string, string> = {
  Pending: '#ffc107', Accepted: '#00c9a7', Declined: '#ff6b6b',
};

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: lead, isLoading } = useGetLeadByIdQuery(id!);
  const [updateStatus] = useUpdateLeadStatusMutation();
  const [assignLead] = useAssignLeadMutation();
  const { data: usersData } = useGetUsersQuery({ pageSize: 100 });
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Meeting scheduling state
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [meetingStep, setMeetingStep] = useState(0);
  const [meetingType, setMeetingType] = useState(0);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingDuration, setMeetingDuration] = useState('30');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [attendeeEmails, setAttendeeEmails] = useState('');
  const [attendeeNames] = useState('');
  const [setupMeeting] = useSetupMeetingMutation();
  const [sendToClient] = useSendMeetingToClientMutation();
  const [setupResult, setSetupResult] = useState<any>(null);
  const [meetingLoading, setMeetingLoading] = useState(false);

  // Meetings list
  const { data: meetingsData, refetch: refetchMeetings } = useGetLeadMeetingsQuery(id!);
  const meetings = (meetingsData as any)?.data || meetingsData || [];

  // Follow-ups
  const { data: followUpsData, refetch: refetchFollowUps } = useGetFollowUpsQuery({ leadId: id!, pageSize: 50 });
  const followUps = followUpsData?.items || (followUpsData as any)?.data || [];
  const [createFollowUp] = useCreateFollowUpMutation();
  const [completeFollowUp] = useCompleteFollowUpMutation();
  const [cancelFollowUp] = useCancelFollowUpMutation();
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpDescription, setFollowUpDescription] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpType, setFollowUpType] = useState('PhoneCall');

  const handleStatusChange = async () => {
    try { await updateStatus({ id: id!, status: newStatus }).unwrap(); setSnackbar({ open: true, message: 'Status updated', severity: 'success' }); setStatusDialogOpen(false); }
    catch { setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' }); }
  };

  const handleAssign = async () => {
    try { await assignLead({ id: id!, userId: selectedUserId }).unwrap(); setSnackbar({ open: true, message: 'Lead assigned successfully', severity: 'success' }); setAssignDialogOpen(false); }
    catch { setSnackbar({ open: true, message: 'Failed to assign lead', severity: 'error' }); }
  };

  const handleSetupMeeting = async () => {
    if (!meetingTitle || !meetingDate) {
      setSnackbar({ open: true, message: 'Please fill title and date', severity: 'error' });
      return;
    }
    setMeetingLoading(true);
    try {
      const result = await setupMeeting({
        leadId: id!,
        title: meetingTitle,
        description: meetingDescription,
        scheduledDate: new Date(meetingDate).toISOString(),
        duration: parseInt(meetingDuration),
        meetingType,
        clientEmail: lead?.emailAddress || '',
        clientName: lead?.customerName || '',
        attendeeEmails,
        attendeeNames,
      }).unwrap();
      setSetupResult(result.data);
      setMeetingStep(1);
      setSnackbar({ open: true, message: 'Meeting setup ready!', severity: 'success' });
      refetchMeetings();
    } catch {
      setSnackbar({ open: true, message: 'Failed to setup meeting', severity: 'error' });
    }
    setMeetingLoading(false);
  };

  const handleSendToClient = async () => {
    if (!setupResult) return;
    setMeetingLoading(true);
    try {
      await sendToClient(setupResult.meetingId).unwrap();
      setMeetingStep(2);
      setSnackbar({ open: true, message: 'Meeting invitation sent to client!', severity: 'success' });
      refetchMeetings();
    } catch {
      setSnackbar({ open: true, message: 'Failed to send', severity: 'error' });
    }
    setMeetingLoading(false);
  };

  const copyMeetingLink = () => {
    if (setupResult?.meetingUrl) {
      navigator.clipboard.writeText(setupResult.meetingUrl);
      setSnackbar({ open: true, message: 'Meeting link copied!', severity: 'success' });
    }
  };

  const openMeetingLink = () => {
    if (setupResult?.meetingUrl) window.open(setupResult.meetingUrl, '_blank');
  };

  const handleCreateFollowUp = async () => {
    if (!followUpTitle || !followUpDate) {
      setSnackbar({ open: true, message: 'Please fill title and date', severity: 'error' });
      return;
    }
    try {
      await createFollowUp({
        leadId: id!,
        title: followUpTitle,
        description: followUpDescription,
        scheduledDate: new Date(followUpDate).toISOString(),
        followUpType,
      }).unwrap();
      setSnackbar({ open: true, message: 'Follow-up created', severity: 'success' });
      setFollowUpDialogOpen(false);
      setFollowUpTitle('');
      setFollowUpDescription('');
      setFollowUpDate('');
      refetchFollowUps();
    } catch {
      setSnackbar({ open: true, message: 'Failed to create follow-up', severity: 'error' });
    }
  };

  const handleCompleteFollowUp = async (fuId: string) => {
    try {
      await completeFollowUp({ id: fuId, notes: 'Completed' }).unwrap();
      setSnackbar({ open: true, message: 'Follow-up completed', severity: 'success' });
      refetchFollowUps();
    } catch {
      setSnackbar({ open: true, message: 'Failed to complete', severity: 'error' });
    }
  };

  const handleCancelFollowUp = async (fuId: string) => {
    try {
      await cancelFollowUp({ id: fuId, reason: 'Cancelled' }).unwrap();
      setSnackbar({ open: true, message: 'Follow-up cancelled', severity: 'success' });
      refetchFollowUps();
    } catch {
      setSnackbar({ open: true, message: 'Failed to cancel', severity: 'error' });
    }
  };

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!lead) return <Typography>Lead not found</Typography>;

  return (
    <Box className="animate-in">
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/leads')} sx={{ minWidth: 'auto' }}>Back</Button>
          <Typography variant="h4" fontWeight="800" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>{lead.customerName}</Typography>
          <Chip label={lead.status} color={statusColors[lead.status] || 'default'} sx={{ fontWeight: 600 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<VideoCall />} onClick={() => { setMeetingDialogOpen(true); setMeetingStep(0); setSetupResult(null); setMeetingTitle(`Meeting with ${lead.customerName}`); }}
            sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', '&:hover': { background: 'linear-gradient(135deg, #5a6fd6, #6a4192)' } }}>
            Schedule Meeting
          </Button>
          <Can permission="leads-update">
            <Button variant="outlined" size="small" onClick={() => setStatusDialogOpen(true)}>Change Status</Button>
            <Button variant="outlined" size="small" onClick={() => setAssignDialogOpen(true)}>Assign</Button>
            <Button variant="contained" size="small" startIcon={<Edit />} onClick={() => navigate(`/leads/${id}/edit`)}>Edit</Button>
          </Can>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Typography variant="h6" fontWeight="700" gutterBottom sx={{ color: '#667eea' }}>Lead Information</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2.5}>
              {[
                { icon: <Person />, label: 'Customer Name', value: lead.customerName },
                { icon: <Business />, label: 'Company', value: lead.companyName || '-' },
                { icon: <Email />, label: 'Email', value: lead.emailAddress || '-' },
                { icon: <Phone />, label: 'Mobile', value: lead.mobileNumber || '-' },
                { icon: <Language />, label: 'Website', value: lead.website || '-' },
                { icon: <TrendingUp />, label: 'Value', value: lead.value ? `$${lead.value.toLocaleString()}` : '-' },
              ].map((item) => (
                <Grid item xs={12} md={6} key={item.label}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Avatar sx={{ width: 28, height: 28, background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))', color: '#667eea' }}>{item.icon}</Avatar>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">{item.label}</Typography>
                  </Box>
                  <Typography fontWeight="500" sx={{ ml: 4.5 }}>{item.value}</Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Meetings Section */}
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="700" sx={{ color: '#764ba2' }}>
                <Event sx={{ mr: 1, verticalAlign: 'middle' }} />Meetings & Follow-ups ({meetings.length})
              </Typography>
              <Button size="small" startIcon={<VideoCall />} onClick={() => { setMeetingDialogOpen(true); setMeetingStep(0); setSetupResult(null); setMeetingTitle(`Meeting with ${lead.customerName}`); }}>
                Schedule Meeting
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {meetings.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Schedule sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                <Typography color="text.secondary">No meetings scheduled yet</Typography>
                <Button size="small" sx={{ mt: 1 }} onClick={() => { setMeetingDialogOpen(true); setMeetingStep(0); setSetupResult(null); setMeetingTitle(`Meeting with ${lead.customerName}`); }}>
                  Schedule First Meeting
                </Button>
              </Box>
            ) : (
              meetings.map((meeting: any) => (
                <Card key={meeting.id} sx={{ mb: 2, border: `1px solid ${setupStatusColors[meeting.setupStatus] || '#eee'}30` }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography fontWeight="700">{meeting.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(meeting.scheduledDate).toLocaleString()} | {meeting.meetingType} | {meeting.duration ? `${meeting.duration} min` : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip label={meeting.setupStatus} size="small" sx={{ fontWeight: 600, background: `${setupStatusColors[meeting.setupStatus] || '#999'}15`, color: setupStatusColors[meeting.setupStatus] || '#999' }} />
                        <Chip label={`Client: ${meeting.clientResponse}`} size="small" sx={{ fontWeight: 600, background: `${clientResponseColors[meeting.clientResponse] || '#999'}15`, color: clientResponseColors[meeting.clientResponse] || '#999' }} />
                      </Box>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, mt: 1, p: 1.5, borderRadius: 1, background: 'rgba(102,126,234,0.03)' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Set up by</Typography>
                        <Typography variant="body2" fontWeight="600">{meeting.setupByName || 'Unknown'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Sent to</Typography>
                        <Typography variant="body2" fontWeight="600">{meeting.sentToEmail || meeting.clientEmail || '-'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Sent at</Typography>
                        <Typography variant="body2" fontWeight="600">{meeting.sentAt ? new Date(meeting.sentAt).toLocaleString() : 'Not sent yet'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Client response</Typography>
                        <Typography variant="body2" fontWeight="600" sx={{ color: clientResponseColors[meeting.clientResponse] }}>
                          {meeting.clientResponse === 'Accepted' ? '✓ Accepted' : meeting.clientResponse === 'Declined' ? '✗ Declined' : '⏳ Pending'}
                        </Typography>
                      </Box>
                    </Box>

                    {meeting.attendeeNames && (
                      <Box sx={{ mt: 1, p: 1, borderRadius: 1, background: 'rgba(0,201,167,0.04)' }}>
                        <Typography variant="caption" color="text.secondary">Attendees: {meeting.attendeeNames}</Typography>
                      </Box>
                    )}

                    {meeting.meetingUrl && meeting.setupStatus !== 'NotStarted' && (
                      <Box sx={{ mt: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip icon={<VideoCall />} label={meeting.meetingUrl} size="small" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} />
                        <Tooltip title="Copy link">
                          <IconButton size="small" onClick={() => { navigator.clipboard.writeText(meeting.meetingUrl); }}>
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Open meeting">
                          <IconButton size="small" onClick={() => window.open(meeting.meetingUrl, '_blank')}>
                            <OpenInNew fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </Paper>

          {/* Follow-ups Section */}
          <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="700" sx={{ color: '#00c9a7' }}>
                <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />Follow-ups ({followUps.length})
              </Typography>
              <Can permission="followups-create">
                <Button size="small" startIcon={<Add />} onClick={() => setFollowUpDialogOpen(true)}>
                  New Follow-up
                </Button>
              </Can>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {followUps.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Flag sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                <Typography color="text.secondary">No follow-ups scheduled</Typography>
                <Can permission="followups-create">
                  <Button size="small" sx={{ mt: 1 }} onClick={() => setFollowUpDialogOpen(true)}>
                    Schedule First Follow-up
                  </Button>
                </Can>
              </Box>
            ) : (
              followUps.map((fu: any) => (
                <Card key={fu.id} sx={{ mb: 2, border: `1px solid ${fu.status === 'Completed' ? '#4caf5030' : fu.status === 'Cancelled' ? '#ff6b6b30' : fu.status === 'Overdue' ? '#ff6b6b30' : '#eee'}` }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography fontWeight="700">{fu.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(fu.scheduledDate).toLocaleString()} | {fu.followUpType || 'General'}
                        </Typography>
                        {fu.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{fu.description}</Typography>
                        )}
                      </Box>
                      <Chip
                        label={fu.status}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          background: fu.status === 'Completed' ? '#4caf5015' : fu.status === 'Cancelled' ? '#ff6b6b15' : fu.status === 'Overdue' ? '#ff6b6b15' : '#ffc10715',
                          color: fu.status === 'Completed' ? '#2e7d32' : fu.status === 'Cancelled' || fu.status === 'Overdue' ? '#d32f2f' : '#ed6c02',
                        }}
                      />
                    </Box>
                    {fu.status === 'Pending' && (
                      <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                        <Can permission="followups-update">
                          <Button size="small" color="success" startIcon={<CheckCircle />} onClick={() => handleCompleteFollowUp(fu.id)}>
                            Complete
                          </Button>
                          <Button size="small" color="error" startIcon={<Cancel />} onClick={() => handleCancelFollowUp(fu.id)}>
                            Cancel
                          </Button>
                        </Can>
                      </Box>
                    )}
                    {fu.completedAt && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Completed: {new Date(fu.completedAt).toLocaleString()}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="700" gutterBottom sx={{ color: '#764ba2' }}>Details</Typography>
              <Divider sx={{ mb: 2 }} />
              {[
                { label: 'Lead Number', value: lead.leadNumber },
                { label: 'Source', value: lead.source?.startsWith('AI_') ? `AI (${lead.source.replace('AI_', '')})` : lead.source },
                { label: 'Created', value: new Date(lead.createdAt).toLocaleDateString() },
                { label: 'Updated', value: new Date(lead.updatedAt).toLocaleDateString() },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="body2" fontWeight="600">{item.value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          {(lead.address || lead.city) && !(lead.addresses?.length > 0) && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="700" gutterBottom sx={{ color: '#00c9a7' }}>Address</Typography>
                <Divider sx={{ mb: 2 }} />
                {lead.address && <Typography>{lead.address}</Typography>}
                {[lead.city, lead.state, lead.postalCode].filter(Boolean).join(', ') && (
                  <Typography>{[lead.city, lead.state, lead.postalCode].filter(Boolean).join(', ')}</Typography>
                )}
                {lead.country && <Typography>{lead.country}</Typography>}
              </CardContent>
            </Card>
          )}

          {lead.addresses?.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="700" gutterBottom sx={{ color: '#00c9a7' }}>
                  <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />Addresses ({lead.addresses.length})
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {lead.addresses.map((addr: any) => (
                  <Box key={addr.id} sx={{ mb: 2, p: 1.5, borderRadius: 1, background: 'rgba(0,201,167,0.04)', border: '1px solid rgba(0,201,167,0.1)' }}>
                    <Chip label={addr.label} size="small" sx={{ mb: 1, background: 'rgba(0,201,167,0.1)', color: '#00c9a7', fontWeight: 600 }} />
                    {addr.addressLine1 && <Typography fontWeight="500">{addr.addressLine1}</Typography>}
                    {addr.addressLine2 && <Typography variant="body2" color="text.secondary">{addr.addressLine2}</Typography>}
                    {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ') && (
                      <Typography variant="body2">{[addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')}</Typography>
                    )}
                    {addr.country && <Typography variant="body2" color="text.secondary">{addr.country}</Typography>}
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {lead.contactPersons?.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="700" gutterBottom sx={{ color: '#fa709a' }}>
                  <ContactPhone sx={{ mr: 1, verticalAlign: 'middle' }} />Contact Persons ({lead.contactPersons.length})
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {lead.contactPersons.map((cp: any) => (
                  <Box key={cp.id} sx={{ mb: 2, p: 1.5, borderRadius: 1, background: 'rgba(250,112,154,0.04)', border: '1px solid rgba(250,112,154,0.1)' }}>
                    <Typography fontWeight="700" sx={{ color: '#fa709a' }}>{cp.name}</Typography>
                    {cp.designation && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{cp.designation}</Typography>}
                    <Grid container spacing={1}>
                      {cp.phone && <Grid item xs={6}><Typography variant="body2"><Phone sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />{cp.phone}</Typography></Grid>}
                      {cp.mobile && <Grid item xs={6}><Typography variant="body2"><Phone sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />{cp.mobile}</Typography></Grid>}
                      {cp.email && <Grid item xs={12}><Typography variant="body2"><Email sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />{cp.email}</Typography></Grid>}
                    </Grid>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {lead.taxId || lead.annualRevenue || lead.employeeCount ? (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="700" gutterBottom sx={{ color: '#764ba2' }}>Business Details</Typography>
                <Divider sx={{ mb: 2 }} />
                {[
                  { label: 'Tax ID', value: lead.taxId },
                  { label: 'Annual Revenue', value: lead.annualRevenue ? `$${lead.annualRevenue.toLocaleString()}` : null },
                  { label: 'Employee Count', value: lead.employeeCount },
                  { label: 'Fax', value: lead.fax },
                  { label: 'LinkedIn', value: lead.linkedInUrl },
                  { label: 'Skype', value: lead.skypeId },
                  { label: 'Campaign Source', value: lead.campaignSource },
                  { label: 'Source Details', value: lead.leadSourceDetails },
                ].filter(item => item.value).map((item) => (
                  <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                    <Typography variant="body2" fontWeight="600">{item.value}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </Grid>
      </Grid>

      {/* Schedule Meeting Dialog */}
      <Dialog open={meetingDialogOpen} onClose={() => setMeetingDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle fontWeight="700">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VideoCall sx={{ color: '#667eea' }} />
            Schedule Meeting with {lead.customerName}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={meetingStep} orientation="vertical" sx={{ mt: 2 }}>
            <Step>
              <StepLabel>Select Meeting Type & Details</StepLabel>
              <StepContent>
                <Grid container spacing={2} sx={{ mt: 0 }}>
                  <Grid item xs={12}>
                    <Typography variant="body2" fontWeight="600" gutterBottom>Choose Platform</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {meetingTypes.map((type) => (
                        <Card key={type.value} onClick={() => setMeetingType(type.value)}
                          sx={{ flex: '1 1 140px', cursor: 'pointer', transition: 'all 0.2s',
                            border: meetingType === type.value ? `2px solid ${type.color}` : '2px solid transparent',
                            background: meetingType === type.value ? `${type.color}08` : 'white',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${type.color}20` },
                          }}>
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
                            <Typography fontSize="1.5rem">{type.icon}</Typography>
                            <Typography fontWeight="700" fontSize="0.8rem">{type.label}</Typography>
                            <Typography variant="caption" color="text.secondary" fontSize="0.65rem">{type.desc}</Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Meeting Title" size="small" value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth type="datetime-local" label="Date & Time" size="small" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth select label="Duration" size="small" value={meetingDuration} onChange={(e) => setMeetingDuration(e.target.value)}>
                      <MenuItem value="15">15 minutes</MenuItem>
                      <MenuItem value="30">30 minutes</MenuItem>
                      <MenuItem value="45">45 minutes</MenuItem>
                      <MenuItem value="60">1 hour</MenuItem>
                      <MenuItem value="90">1.5 hours</MenuItem>
                      <MenuItem value="120">2 hours</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Attendee Emails (comma separated)" size="small" value={attendeeEmails} onChange={(e) => setAttendeeEmails(e.target.value)} placeholder="email1@example.com, email2@example.com" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Description (optional)" size="small" multiline rows={2} value={meetingDescription} onChange={(e) => setMeetingDescription(e.target.value)} />
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="contained" startIcon={meetingLoading ? <CircularProgress size={20} /> : <VideoCall />} onClick={handleSetupMeeting} disabled={meetingLoading || !meetingTitle || !meetingDate}
                      sx={{ background: `linear-gradient(135deg, ${meetingTypes[meetingType].color}, ${meetingTypes[meetingType].color}cc)` }}>
                      {meetingLoading ? 'Setting up...' : 'Setup Meeting'}
                    </Button>
                  </Grid>
                </Grid>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>Setup Ready - Review & Send</StepLabel>
              <StepContent>
                {setupResult && (
                  <Box>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Typography fontWeight="700">Meeting Setup Ready!</Typography>
                      <Typography variant="body2">Your {meetingTypes[meetingType].label} meeting is ready. Review the details below and send to client.</Typography>
                    </Alert>
                    <Card sx={{ mb: 2, border: '1px solid #4caf5030' }}>
                      <CardContent>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Meeting Type</Typography>
                            <Typography fontWeight="600">{meetingTypes[meetingType].icon} {meetingTypes[meetingType].label}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Meeting URL</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography fontWeight="600" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>{setupResult.meetingUrl}</Typography>
                              <IconButton size="small" onClick={copyMeetingLink}><ContentCopy fontSize="small" /></IconButton>
                              <IconButton size="small" onClick={openMeetingLink}><OpenInNew fontSize="small" /></IconButton>
                            </Box>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Client</Typography>
                            <Typography fontWeight="600">{lead.customerName} ({lead.emailAddress})</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Setup Status</Typography>
                            <Chip label={setupResult.setupStatus} size="small" sx={{ fontWeight: 600, background: '#4caf5015', color: '#4caf50' }} />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button variant="contained" startIcon={meetingLoading ? <CircularProgress size={20} /> : <Send />} onClick={handleSendToClient} disabled={meetingLoading}
                        sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                        {meetingLoading ? 'Sending...' : 'Send to Client'}
                      </Button>
                      <Button onClick={() => { setMeetingStep(0); setSetupResult(null); }}>Back</Button>
                    </Box>
                  </Box>
                )}
              </StepContent>
            </Step>

            <Step>
              <StepLabel>Invitation Sent - Awaiting Response</StepLabel>
              <StepContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography fontWeight="700">Invitation Sent!</Typography>
                  <Typography variant="body2">Meeting invitation has been sent to {lead.emailAddress}. The meeting status will automatically update when the client responds.</Typography>
                </Alert>
                <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(33,150,243,0.05)', border: '1px solid rgba(33,150,243,0.15)' }}>
                  <Typography variant="body2" color="text.secondary">Client can accept or decline the meeting. Status will update automatically.</Typography>
                </Box>
                <Button sx={{ mt: 2 }} onClick={() => { setMeetingDialogOpen(false); setMeetingStep(0); setSetupResult(null); }}>Close</Button>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
      </Dialog>

      {/* Follow-up Dialog */}
      <Dialog open={followUpDialogOpen} onClose={() => setFollowUpDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle fontWeight="700">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime sx={{ color: '#00c9a7' }} />
            New Follow-up for {lead.customerName}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Follow-up Title" size="small" value={followUpTitle} onChange={(e) => setFollowUpTitle(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="datetime-local" label="Scheduled Date" size="small" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Follow-up Type" size="small" value={followUpType} onChange={(e) => setFollowUpType(e.target.value)}>
                <MenuItem value="PhoneCall">Phone Call</MenuItem>
                <MenuItem value="Email">Email</MenuItem>
                <MenuItem value="Meeting">Meeting</MenuItem>
                <MenuItem value="SiteVisit">Site Visit</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" size="small" multiline rows={2} value={followUpDescription} onChange={(e) => setFollowUpDescription(e.target.value)} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFollowUpDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateFollowUp} disabled={!followUpTitle || !followUpDate}
            sx={{ background: 'linear-gradient(135deg, #00c9a7, #4facfe)' }}>
            Create Follow-up
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle fontWeight="700">Change Status</DialogTitle>
        <DialogContent>
          <TextField fullWidth select label="New Status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} sx={{ mt: 1 }} size="small">
            {statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleStatusChange} disabled={!newStatus}>Update</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle fontWeight="700">Assign Lead</DialogTitle>
        <DialogContent>
          <TextField fullWidth select label="Assign To" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} sx={{ mt: 1 }} size="small">
            {usersData?.items?.map((u: any) => <MenuItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssign} disabled={!selectedUserId}>Assign</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
