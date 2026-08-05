import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Chip, TextField, MenuItem, TablePagination, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Snackbar, Grid, Card, CardContent, Collapse,
  Avatar, Divider, Tooltip, Checkbox, LinearProgress,
} from '@mui/material';
import { Add, Edit, Delete, Search, FilterList, PeopleAlt,
  PictureAsPdf, TableChart, ExpandMore, ExpandLess, LocationOn, ContactPhone,
  Phone, Email, Language, TrendingUp, Business, Person, Event, Schedule, AccessTime, AssignmentInd,
  Visibility, Close,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState, Fragment } from 'react';
import { useGetLeadsQuery, useGetLeadByIdQuery, useDeleteLeadMutation, useGetLeadStatsQuery,
  useGetFollowUpsQuery, useGetLeadMeetingsQuery, useBulkAssignLeadsMutation, useGetUsersQuery } from '../../api/api';
import { Can } from '../../components/Can';

const statusColors: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  New: 'info', FollowUp: 'warning', Contacted: 'info', Interested: 'info', MeetingScheduled: 'warning',
  ProposalSent: 'warning', Negotiation: 'warning', Converted: 'success', Lost: 'error', Closed: 'default',
};

const statusBgColors: Record<string, string> = {
  New: '#e3f2fd', FollowUp: '#fff3e0', Contacted: '#f3e5f5', Interested: '#e8f5e9',
  MeetingScheduled: '#fff8e1', ProposalSent: '#fff3e0', Negotiation: '#fce4ec',
  Converted: '#e8f5e9', Lost: '#ffebee', Closed: '#f5f5f5',
};

const sourceLabels: Record<string, string> = {
  Website: 'Website', Referral: 'Referral', SocialMedia: 'Social Media', ColdCall: 'Cold Call',
  Advertisement: 'Advertisement', Email: 'Email', Other: 'Other',
  AI_OpenAI: 'AI - ChatGPT', AI_GoogleGemini: 'AI - Gemini', AI_Claude: 'AI - Claude',
  AI_Groq: 'AI - Groq', AI_HuggingFace: 'AI - HuggingFace',
};

const sourceColors: Record<string, string> = {
  AI_OpenAI: '#10a37f', AI_GoogleGemini: '#4285f4', AI_Claude: '#d97706',
  AI_Groq: '#f97316', AI_HuggingFace: '#ffd21e',
};

const aiSources = ['AI_OpenAI', 'AI_GoogleGemini', 'AI_Claude', 'AI_Groq', 'AI_HuggingFace'];
const manualSources = ['Website', 'Referral', 'SocialMedia', 'ColdCall', 'Advertisement', 'Email', 'Other'];

function LeadExpandedRow({ leadId }: { leadId: string }) {
  const { data: lead, isLoading } = useGetLeadByIdQuery(leadId);
  const { data: followUps } = useGetFollowUpsQuery({ leadId, pageSize: 5 });
  const { data: meetings } = useGetLeadMeetingsQuery(leadId);

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={12} sx={{ py: 3, background: '#f8f9ff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}><Typography color="text.secondary">Loading details...</Typography></Box>
        </TableCell>
      </TableRow>
    );
  }

  if (!lead) return null;

  const followUpItems = Array.isArray(followUps) ? followUps : followUps?.items || [];
  const meetingItems = Array.isArray(meetings) ? meetings : meetings?.items || meetings?.meetings || [];

  const fuStatusColor: Record<string, string> = {
    Pending: '#ed6c02', InProgress: '#0288d1', Completed: '#2e7d32', Cancelled: '#d32f2f', Rescheduled: '#9c27b0',
  };
  const meetingStatusColor: Record<string, string> = {
    Scheduled: '#0288d1', Completed: '#2e7d32', Cancelled: '#d32f2f', Rescheduled: '#9c27b0', NoShow: '#d32f2f',
  };

  return (
    <TableRow>
      <TableCell colSpan={12} sx={{ py: 0, px: 0, background: 'linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)' }}>
        <Collapse in timeout={300}>
          <Box sx={{ p: 3, borderLeft: '3px solid #667eea', mx: 2, my: 1.5, borderRadius: '0 12px 12px 0', background: 'rgba(102,126,234,0.02)' }}>
            <Grid container spacing={3}>
              {/* Contact Info */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', border: '1px solid #e3f2fd', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #667eea, #764ba2)' }}><Person sx={{ fontSize: 18 }} /></Avatar>
                      <Typography fontWeight="700" fontSize="0.9rem">Contact Information</Typography>
                    </Box>
                    <Divider sx={{ mb: 1.5 }} />
                    <InfoRow icon={<Person sx={{ fontSize: 16 }} />} label="Name" value={lead.customerName} />
                    <InfoRow icon={<Business sx={{ fontSize: 16 }} />} label="Company" value={lead.companyName || '-'} />
                    <InfoRow icon={<Email sx={{ fontSize: 16 }} />} label="Email" value={lead.emailAddress || '-'} />
                    <InfoRow icon={<Phone sx={{ fontSize: 16 }} />} label="Mobile" value={lead.mobileNumber || '-'} />
                    {lead.alternativeNumber && <InfoRow icon={<Phone sx={{ fontSize: 16 }} />} label="Alt Phone" value={lead.alternativeNumber} />}
                    <InfoRow icon={<Language sx={{ fontSize: 16 }} />} label="Website" value={lead.website || '-'} />
                    <InfoRow icon={<TrendingUp sx={{ fontSize: 16 }} />} label="Value" value={lead.value ? `$${lead.value.toLocaleString()}` : '-'} />
                    <InfoRow icon={<TrendingUp sx={{ fontSize: 16 }} />} label="Budget" value={lead.expectedBudget ? `$${lead.expectedBudget.toLocaleString()}` : '-'} />
                  </CardContent>
                </Card>
              </Grid>

              {/* Addresses */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', border: '1px solid #e8f5e9', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #00c9a7, #4facfe)' }}><LocationOn sx={{ fontSize: 18 }} /></Avatar>
                      <Typography fontWeight="700" fontSize="0.9rem">Addresses ({lead.addresses?.length || 0})</Typography>
                    </Box>
                    <Divider sx={{ mb: 1.5 }} />
                    {lead.addresses?.length > 0 ? lead.addresses.map((addr: any) => (
                      <Box key={addr.id} sx={{ mb: 1.5, p: 1.5, borderRadius: 1, background: 'rgba(0,201,167,0.04)', border: '1px solid rgba(0,201,167,0.1)' }}>
                        <Chip label={addr.label} size="small" sx={{ mb: 0.5, height: 20, fontSize: '0.65rem', background: 'rgba(0,201,167,0.1)', color: '#00c9a7', fontWeight: 600 }} />
                        {addr.addressLine1 && <Typography fontSize="0.8rem" fontWeight="500">{addr.addressLine1}</Typography>}
                        {addr.addressLine2 && <Typography fontSize="0.75rem" color="text.secondary">{addr.addressLine2}</Typography>}
                        {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ') && (
                          <Typography fontSize="0.75rem" color="text.secondary">{[addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')}</Typography>
                        )}
                        {addr.country && <Typography fontSize="0.75rem" color="text.secondary">{addr.country}</Typography>}
                      </Box>
                    )) : (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        {lead.address && <Typography fontSize="0.8rem">{lead.address}</Typography>}
                        {[lead.city, lead.state, lead.postalCode].filter(Boolean).join(', ') && (
                          <Typography fontSize="0.75rem" color="text.secondary">{[lead.city, lead.state, lead.postalCode].filter(Boolean).join(', ')}</Typography>
                        )}
                        {lead.country && <Typography fontSize="0.75rem" color="text.secondary">{lead.country}</Typography>}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Contact Persons */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', border: '1px solid #fce4ec', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #fa709a, #fee140)' }}><ContactPhone sx={{ fontSize: 18 }} /></Avatar>
                      <Typography fontWeight="700" fontSize="0.9rem">Contact Persons ({lead.contactPersons?.length || 0})</Typography>
                    </Box>
                    <Divider sx={{ mb: 1.5 }} />
                    {lead.contactPersons?.length > 0 ? lead.contactPersons.map((cp: any) => (
                      <Box key={cp.id} sx={{ mb: 1.5, p: 1.5, borderRadius: 1, background: 'rgba(250,112,154,0.04)', border: '1px solid rgba(250,112,154,0.1)' }}>
                        <Typography fontWeight="700" fontSize="0.8rem" sx={{ color: '#fa709a' }}>{cp.name}</Typography>
                        {cp.designation && <Typography fontSize="0.7rem" color="text.secondary" sx={{ mb: 0.5 }}>{cp.designation}</Typography>}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {cp.phone && <Chip icon={<Phone sx={{ fontSize: 12 }} />} label={cp.phone} size="small" sx={{ height: 22, fontSize: '0.65rem' }} />}
                          {cp.mobile && <Chip icon={<Phone sx={{ fontSize: 12 }} />} label={cp.mobile} size="small" sx={{ height: 22, fontSize: '0.65rem' }} />}
                          {cp.email && <Chip icon={<Email sx={{ fontSize: 12 }} />} label={cp.email} size="small" sx={{ height: 22, fontSize: '0.65rem' }} />}
                        </Box>
                      </Box>
                    )) : (
                      <Typography fontSize="0.8rem" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>No contact persons</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Additional Details */}
              <Grid item xs={12}>
                <Card sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #764ba2, #667eea)' }}><Business sx={{ fontSize: 18 }} /></Avatar>
                      <Typography fontWeight="700" fontSize="0.9rem">Business Details</Typography>
                    </Box>
                    <Divider sx={{ mb: 1.5 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <InfoRow icon={<Business sx={{ fontSize: 16 }} />} label="Industry" value={lead.industryType || '-'} />
                        <InfoRow icon={<Business sx={{ fontSize: 16 }} />} label="Category" value={lead.businessCategory || '-'} />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <InfoRow icon={<Person sx={{ fontSize: 16 }} />} label="Size" value={lead.companySize || '-'} />
                        <InfoRow icon={<TrendingUp sx={{ fontSize: 16 }} />} label="Revenue" value={lead.annualRevenue ? `$${lead.annualRevenue.toLocaleString()}` : '-'} />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <InfoRow icon={<TrendingUp sx={{ fontSize: 16 }} />} label="Tax ID" value={lead.taxId || '-'} />
                        <InfoRow icon={<TrendingUp sx={{ fontSize: 16 }} />} label="Priority" value={lead.customerPriority || '-'} />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <InfoRow icon={<Event sx={{ fontSize: 16 }} />} label="Follow-ups" value={String(lead.followUpCount || 0)} />
                        <InfoRow icon={<Schedule sx={{ fontSize: 16 }} />} label="Meetings" value={String(lead.meetingCount || 0)} />
                      </Grid>
                    </Grid>
                    {lead.requirements && (
                      <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1, background: '#f5f5f5' }}>
                        <Typography fontSize="0.75rem" color="text.secondary" fontWeight="600" sx={{ mb: 0.5 }}>Requirements</Typography>
                        <Typography fontSize="0.8rem">{lead.requirements}</Typography>
                      </Box>
                    )}
                    {lead.notes && (
                      <Box sx={{ mt: 1, p: 1.5, borderRadius: 1, background: '#fff8e1' }}>
                        <Typography fontSize="0.75rem" color="text.secondary" fontWeight="600" sx={{ mb: 0.5 }}>Notes</Typography>
                        <Typography fontSize="0.8rem">{lead.notes}</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Follow-ups */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', border: '1px solid #e3f2fd', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}><AccessTime sx={{ fontSize: 18 }} /></Avatar>
                        <Typography fontWeight="700" fontSize="0.9rem">Follow-ups ({followUpItems.length})</Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ mb: 1.5 }} />
                    {followUpItems.length > 0 ? followUpItems.map((fu: any) => (
                      <Box key={fu.id} sx={{ mb: 1, p: 1.5, borderRadius: 1, background: 'rgba(79,172,254,0.04)', border: '1px solid rgba(79,172,254,0.1)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography fontSize="0.8rem" fontWeight="600">{fu.type || fu.followUpType || 'Follow-up'}</Typography>
                          <Chip label={fu.status} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, background: `${fuStatusColor[fu.status] || '#9e9e9e'}20`, color: fuStatusColor[fu.status] || '#9e9e9e' }} />
                        </Box>
                        {fu.scheduledDate && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Event sx={{ fontSize: 12, color: '#4facfe' }} />
                            <Typography fontSize="0.7rem" color="text.secondary">
                              {new Date(fu.scheduledDate).toLocaleDateString()} {fu.scheduledTime ? `at ${fu.scheduledTime}` : ''}
                            </Typography>
                          </Box>
                        )}
                        {fu.notes && <Typography fontSize="0.7rem" color="text.secondary" sx={{ mt: 0.5 }} noWrap>{fu.notes}</Typography>}
                      </Box>
                    )) : (
                      <Typography fontSize="0.8rem" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>No follow-ups yet</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Meetings */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', border: '1px solid #fce4ec', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' }}><Event sx={{ fontSize: 18 }} /></Avatar>
                        <Typography fontWeight="700" fontSize="0.9rem">Meetings ({meetingItems.length})</Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ mb: 1.5 }} />
                    {meetingItems.length > 0 ? meetingItems.map((mt: any) => (
                      <Box key={mt.id} sx={{ mb: 1, p: 1.5, borderRadius: 1, background: 'rgba(161,140,209,0.04)', border: '1px solid rgba(161,140,209,0.1)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography fontSize="0.8rem" fontWeight="600">{mt.title || mt.subject || 'Meeting'}</Typography>
                          <Chip label={mt.status} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, background: `${meetingStatusColor[mt.status] || '#9e9e9e'}20`, color: meetingStatusColor[mt.status] || '#9e9e9e' }} />
                        </Box>
                        {mt.meetingDate && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Event sx={{ fontSize: 12, color: '#a18cd1' }} />
                            <Typography fontSize="0.7rem" color="text.secondary">
                              {new Date(mt.meetingDate).toLocaleDateString()} {mt.meetingTime ? `at ${mt.meetingTime}` : ''}
                            </Typography>
                          </Box>
                        )}
                        {mt.meetingType && <Typography fontSize="0.7rem" color="text.secondary" sx={{ mt: 0.3 }}>{mt.meetingType}</Typography>}
                        {mt.notes && <Typography fontSize="0.7rem" color="text.secondary" sx={{ mt: 0.5 }} noWrap>{mt.notes}</Typography>}
                      </Box>
                    )) : (
                      <Typography fontSize="0.8rem" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>No meetings scheduled</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </TableCell>
    </TableRow>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
      <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
      <Typography fontSize="0.7rem" color="text.secondary" sx={{ minWidth: 60 }}>{label}</Typography>
      <Typography fontSize="0.8rem" fontWeight="500">{value}</Typography>
    </Box>
  );
}

function LeadDetailPanel({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const { data: lead, isLoading } = useGetLeadByIdQuery(leadId);
  const { data: followUps } = useGetFollowUpsQuery({ leadId, pageSize: 5 });
  const { data: meetings } = useGetLeadMeetingsQuery(leadId);

  const followUpItems = Array.isArray(followUps) ? followUps : followUps?.items || [];
  const meetingItems = Array.isArray(meetings) ? meetings : meetings?.items || [];

  const fuStatusColor: Record<string, string> = {
    Pending: '#ed6c02', InProgress: '#0288d1', Completed: '#2e7d32', Cancelled: '#d32f2f', Rescheduled: '#9c27b0',
  };
  const meetingStatusColor: Record<string, string> = {
    Scheduled: '#0288d1', Completed: '#2e7d32', Cancelled: '#d32f2f', Rescheduled: '#9c27b0', NoShow: '#d32f2f',
  };

  if (isLoading) return <LinearProgress sx={{ m: 2 }} />;
  if (!lead) return <Typography color="text.secondary" sx={{ p: 3 }}>Lead not found</Typography>;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(102,126,234,0.08), rgba(118,75,162,0.08))', borderBottom: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', width: 40, height: 40 }}><Person sx={{ fontSize: 20 }} /></Avatar>
          <Box>
            <Typography fontWeight="700" fontSize="1rem">{lead.customerName}</Typography>
            <Typography fontSize="0.75rem" color="text.secondary">{lead.leadNumber} · {lead.companyName || '-'}</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card sx={{ border: '1px solid #e3f2fd', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography fontWeight="700" fontSize="0.85rem" sx={{ mb: 1 }}>Contact Information</Typography>
                <Divider sx={{ mb: 1 }} />
                <InfoRow icon={<Person sx={{ fontSize: 14 }} />} label="Name" value={lead.customerName} />
                <InfoRow icon={<Business sx={{ fontSize: 14 }} />} label="Company" value={lead.companyName || '-'} />
                <InfoRow icon={<Email sx={{ fontSize: 14 }} />} label="Email" value={lead.emailAddress || '-'} />
                <InfoRow icon={<Phone sx={{ fontSize: 14 }} />} label="Mobile" value={lead.mobileNumber || '-'} />
                {lead.alternativeNumber && <InfoRow icon={<Phone sx={{ fontSize: 14 }} />} label="Alt Phone" value={lead.alternativeNumber} />}
                <InfoRow icon={<Language sx={{ fontSize: 14 }} />} label="Website" value={lead.website || '-'} />
                <InfoRow icon={<TrendingUp sx={{ fontSize: 14 }} />} label="Value" value={lead.value ? `$${lead.value.toLocaleString()}` : '-'} />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ border: '1px solid #e8f5e9', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography fontWeight="700" fontSize="0.85rem" sx={{ mb: 1 }}>Business Details</Typography>
                <Divider sx={{ mb: 1 }} />
                <InfoRow icon={<Business sx={{ fontSize: 14 }} />} label="Industry" value={lead.industryType || '-'} />
                <InfoRow icon={<Business sx={{ fontSize: 14 }} />} label="Category" value={lead.businessCategory || '-'} />
                <InfoRow icon={<Person sx={{ fontSize: 14 }} />} label="Size" value={lead.companySize || '-'} />
                <InfoRow icon={<TrendingUp sx={{ fontSize: 14 }} />} label="Revenue" value={lead.annualRevenue ? `$${lead.annualRevenue.toLocaleString()}` : '-'} />
                <InfoRow icon={<TrendingUp sx={{ fontSize: 14 }} />} label="Priority" value={lead.customerPriority || '-'} />
                {lead.requirements && (
                  <Box sx={{ mt: 1, p: 1, borderRadius: 1, background: '#f5f5f5' }}>
                    <Typography fontSize="0.7rem" fontWeight="600" color="text.secondary">Requirements</Typography>
                    <Typography fontSize="0.8rem">{lead.requirements}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ border: '1px solid #fce4ec', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography fontWeight="700" fontSize="0.85rem" sx={{ mb: 1 }}>Follow-ups ({followUpItems.length})</Typography>
                <Divider sx={{ mb: 1 }} />
                {followUpItems.length > 0 ? followUpItems.map((fu: any) => (
                  <Box key={fu.id} sx={{ mb: 1, p: 1, borderRadius: 1, background: 'rgba(79,172,254,0.04)', border: '1px solid rgba(79,172,254,0.1)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontSize="0.75rem" fontWeight="600">{fu.type || 'Follow-up'}</Typography>
                      <Chip label={fu.status} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, background: `${fuStatusColor[fu.status] || '#9e9e9e'}20`, color: fuStatusColor[fu.status] || '#9e9e9e' }} />
                    </Box>
                    {fu.scheduledDate && <Typography fontSize="0.7rem" color="text.secondary">{new Date(fu.scheduledDate).toLocaleDateString()} {fu.scheduledTime || ''}</Typography>}
                  </Box>
                )) : <Typography fontSize="0.8rem" color="text.secondary">No follow-ups</Typography>}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ border: '1px solid #e3f2fd', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography fontWeight="700" fontSize="0.85rem" sx={{ mb: 1 }}>Meetings ({meetingItems.length})</Typography>
                <Divider sx={{ mb: 1 }} />
                {meetingItems.length > 0 ? meetingItems.map((mt: any) => (
                  <Box key={mt.id} sx={{ mb: 1, p: 1, borderRadius: 1, background: 'rgba(161,140,209,0.04)', border: '1px solid rgba(161,140,209,0.1)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontSize="0.75rem" fontWeight="600">{mt.title || 'Meeting'}</Typography>
                      <Chip label={mt.status} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, background: `${meetingStatusColor[mt.status] || '#9e9e9e'}20`, color: meetingStatusColor[mt.status] || '#9e9e9e' }} />
                    </Box>
                    {mt.meetingDate && <Typography fontSize="0.7rem" color="text.secondary">{new Date(mt.meetingDate).toLocaleDateString()} {mt.meetingTime || ''}</Typography>}
                  </Box>
                )) : <Typography fontSize="0.8rem" color="text.secondary">No meetings</Typography>}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default function LeadsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [createdByFilter, setCreatedByFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [viewingLeadId, setViewingLeadId] = useState<string | null>(null);
  const { data } = useGetLeadsQuery({ pageNumber: page + 1, pageSize: rowsPerPage, searchTerm, status: statusFilter, source: sourceFilter, assignedToUserId: assignedToFilter || undefined });
  const [deleteLead] = useDeleteLeadMutation();
  const [bulkAssignLeads, { isLoading: assigning }] = useBulkAssignLeadsMutation();
  const { data: stats } = useGetLeadStatsQuery(undefined);
  const { data: usersData } = useGetUsersQuery({ pageSize: 100, isActive: true });

  const leads = data?.data || [];
  const users = (usersData?.items || usersData?.data?.items || usersData?.data || usersData || []);
  const userList = Array.isArray(users) ? users : [];

  const filteredLeads = leads.filter((lead: any) => {
    if (createdByFilter === 'ai' && !aiSources.includes(lead.source)) return false;
    if (createdByFilter === 'manual' && !manualSources.includes(lead.source)) return false;
    if (dateFrom && new Date(lead.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(lead.createdAt) > new Date(dateTo)) return false;
    return true;
  });

  const allSelected = filteredLeads.length > 0 && filteredLeads.every((l: any) => selectedLeadIds.includes(l.id));
  const someSelected = filteredLeads.some((l: any) => selectedLeadIds.includes(l.id));

  const toggleExpand = (leadId: string) => {
    setExpandedLeadId(expandedLeadId === leadId ? null : leadId);
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l: any) => l.id));
    }
  };

  const toggleSelectLead = (leadId: string) => {
    setSelectedLeadIds(prev => prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]);
  };

  const handleBulkAssign = async () => {
    if (!selectedUserId || selectedLeadIds.length === 0) return;
    try {
      await bulkAssignLeads({ leadIds: selectedLeadIds, userId: selectedUserId }).unwrap();
      setSnackbar({ open: true, message: `${selectedLeadIds.length} lead(s) assigned successfully`, severity: 'success' });
      setSelectedLeadIds([]);
      setSelectedUserId('');
      setAssignDialogOpen(false);
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.data?.message || 'Assignment failed', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!leadToDelete) return;
    try {
      await deleteLead(leadToDelete.id).unwrap();
      setSnackbar({ open: true, message: 'Lead deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete lead', severity: 'error' });
    }
  };

  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    const exportData = filteredLeads.map((lead: any) => ({
      'Lead #': lead.leadNumber,
      'Customer': lead.customerName,
      'Company': lead.companyName || '',
      'Email': lead.emailAddress || '',
      'Phone': lead.mobileNumber || '',
      'City': lead.city || '',
      'Country': lead.country || '',
      'Status': lead.status,
      'Source': sourceLabels[lead.source] || lead.source,
      'Created By': lead.source?.startsWith('AI_') ? 'AI Generated' : 'Manual',
      'Value': lead.value || '',
      'Created': new Date(lead.createdAt).toLocaleDateString(),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, `leads_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    setSnackbar({ open: true, message: 'Excel file downloaded', severity: 'success' });
  };

  const exportToPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text('Leads Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Total: ${filteredLeads.length} leads`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Lead #', 'Customer', 'Company', 'Email', 'Status', 'Source', 'Created By', 'Value']],
      body: filteredLeads.map((lead: any) => [
        lead.leadNumber,
        lead.customerName,
        lead.companyName || '-',
        lead.emailAddress || '-',
        lead.status,
        sourceLabels[lead.source] || lead.source,
        lead.source?.startsWith('AI_') ? 'AI' : 'Manual',
        lead.value ? `$${lead.value.toLocaleString()}` : '-',
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [102, 126, 234] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    doc.save(`leads_report_${new Date().toISOString().split('T')[0]}.pdf`);
    setSnackbar({ open: true, message: 'PDF file downloaded', severity: 'success' });
  };

  return (
    <Box className="animate-in">
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="800" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' }, background: 'linear-gradient(135deg, #1a1a3e, #667eea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Leads
          </Typography>
          <Typography variant="body2" color="text.secondary">Manage your business leads and prospects</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<TableChart />} onClick={exportToExcel} size="small" sx={{ borderColor: '#10a37f', color: '#10a37f', '&:hover': { borderColor: '#10a37f', background: '#10a37f08' } }}>
            Excel
          </Button>
          <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={exportToPDF} size="small" sx={{ borderColor: '#ff6b6b', color: '#ff6b6b', '&:hover': { borderColor: '#ff6b6b', background: '#ff6b6b08' } }}>
            PDF
          </Button>
          <Can permission="leads-create">
            <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/leads/new')} size="small" sx={{ px: 2 }}>
              New Lead
            </Button>
          </Can>
        </Box>
      </Box>

      {stats && (
        <Grid container spacing={{ xs: 1, md: 2 }} sx={{ mb: 3 }}>
          {[
            { label: 'Total Leads', value: stats.totalLeads, color: '#667eea' },
            { label: 'New', value: stats.newLeads, color: '#4facfe' },
            { label: 'Converted', value: stats.convertedLeads, color: '#00c9a7' },
            { label: 'Lost', value: stats.lostLeads, color: '#ff6b6b' },
            { label: 'Pipeline Value', value: `$${(stats.totalValue || 0).toLocaleString()}`, color: '#764ba2' },
          ].map((stat) => (
            <Grid item xs={6} sm={4} md={2.4} key={stat.label}>
              <Card sx={{ background: `linear-gradient(135deg, ${stat.color}08, ${stat.color}04)`, border: `1px solid ${stat.color}15` }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600">{stat.label}</Typography>
                  <Typography variant="h5" fontWeight="800" sx={{ color: stat.color }}>{stat.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Left: List Panel */}
        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField fullWidth size="small" placeholder="Search leads..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }} />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField fullWidth size="small" select label="Status" value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All Statuses</MenuItem>
              {Object.keys(statusColors).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField fullWidth size="small" select label="Source" value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}>
              <MenuItem value="">All Sources</MenuItem>
              <MenuItem value="__ai__" disabled sx={{ fontWeight: 700, color: '#764ba2' }}>AI Sources</MenuItem>
              {aiSources.map((s) => <MenuItem key={s} value={s}>{sourceLabels[s]}</MenuItem>)}
              <MenuItem value="__manual__" disabled sx={{ fontWeight: 700, color: '#667eea' }}>Manual Sources</MenuItem>
              {manualSources.map((s) => <MenuItem key={s} value={s}>{sourceLabels[s]}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField fullWidth size="small" select label="Assigned To" value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}>
              <MenuItem value="">All Users</MenuItem>
              {userList.map((u: any) => <MenuItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField fullWidth size="small" select label="Created By" value={createdByFilter}
              onChange={(e) => setCreatedByFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="ai">AI Generated</MenuItem>
              <MenuItem value="manual">Manual Entry</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} md={1}>
            <TextField fullWidth size="small" type="date" label="From" value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6} md={1}>
            <TextField fullWidth size="small" type="date" label="To" value={dateTo}
              onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} md={1}>
            <Button fullWidth variant="outlined" startIcon={<FilterList />} onClick={() => {
              setSearchTerm(''); setStatusFilter(''); setSourceFilter(''); setCreatedByFilter(''); setAssignedToFilter(''); setDateFrom(''); setDateTo('');
            }}>Clear</Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ overflow: 'auto', maxWidth: '100%' }}>
        <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.05), rgba(118,75,162,0.05))' }}>
              <TableCell padding="checkbox" sx={{ width: 40 }}>
                <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleSelectAll} size="small" sx={{ color: '#667eea' }} />
              </TableCell>
              <TableCell padding="checkbox" sx={{ width: 36 }} />
              <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700, width: '8%' }}>Lead #</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700, width: '11%' }}>Customer</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700, width: '10%' }}>Company</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700, width: '12%' }}>Email</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700, width: '8%' }}>Status</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700, width: '8%' }}>Source</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700, width: '7%' }}>Value</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700, width: '10%' }}>
                <AssignmentInd sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />Assigned
              </TableCell>
              <TableCell align="center" sx={{ whiteSpace: 'nowrap', fontWeight: 700, width: '6%' }}>
                <AccessTime sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />FU
              </TableCell>
              <TableCell align="center" sx={{ whiteSpace: 'nowrap', fontWeight: 700, width: '6%' }}>
                <Event sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />MT
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700, width: '7%' }}>Created</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 700, width: '8%' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 6 }}>
                  <PeopleAlt sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                  <Typography color="text.secondary">No leads found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead: any) => {
                const isExpanded = expandedLeadId === lead.id;
                return (
                  <Fragment key={lead.id}>
                    <TableRow
                      hover
                      sx={{
                        cursor: 'pointer',
                        background: isExpanded ? 'rgba(102,126,234,0.06)' : undefined,
                        '&:hover': { background: isExpanded ? 'rgba(102,126,234,0.08)' : 'rgba(102,126,234,0.03)' },
                      }}
                      onClick={() => toggleExpand(lead.id)}
                    >
                      <TableCell padding="checkbox" sx={{ width: 48, minWidth: 48 }} onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selectedLeadIds.includes(lead.id)} onChange={() => toggleSelectLead(lead.id)} size="small" sx={{ color: '#667eea' }} />
                      </TableCell>
                      <TableCell padding="checkbox" sx={{ width: 48, minWidth: 48 }}>
                        <IconButton size="small" sx={{ color: isExpanded ? '#667eea' : '#9e9e9e' }}>
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </TableCell>
                      <TableCell><Chip label={lead.leadNumber} size="small" sx={{ fontWeight: 600, background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))', color: '#667eea', maxWidth: '100%' }} /></TableCell>
                      <TableCell sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.customerName}</TableCell>
                      <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.companyName || '-'}</TableCell>
                      <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.emailAddress || '-'}</TableCell>
                      <TableCell>
                        <Chip label={lead.status} size="small" sx={{
                          fontWeight: 600, maxWidth: '100%',
                          background: statusBgColors[lead.status] || undefined,
                          color: statusColors[lead.status] === 'success' ? '#2e7d32' : statusColors[lead.status] === 'error' ? '#d32f2f' : statusColors[lead.status] === 'warning' ? '#ed6c02' : statusColors[lead.status] === 'info' ? '#0288d1' : undefined,
                        }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={sourceLabels[lead.source] || lead.source} size="small" sx={{
                          fontWeight: 600, maxWidth: '100%',
                          background: sourceColors[lead.source] ? `${sourceColors[lead.source]}15` : undefined,
                          color: sourceColors[lead.source] || undefined,
                        }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{lead.value ? `$${lead.value.toLocaleString()}` : '-'}</TableCell>
                      <TableCell>
                        {lead.assignments?.length > 0 ? (
                          lead.assignments.filter((a: any) => a.isActive).slice(0, 1).map((a: any) => (
                            <Chip key={a.id} label={a.userName || 'Unknown'} size="small" sx={{ fontWeight: 600, background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))', color: '#667eea', maxWidth: '100%' }} />
                          ))
                        ) : (
                          <Typography fontSize="0.7rem" color="text.secondary">Unassigned</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={lead.followUpCount || 0}
                          size="small"
                          sx={{
                            fontWeight: 600, minWidth: 36,
                            background: (lead.followUpCount || 0) > 0 ? 'linear-gradient(135deg, #4facfe, #00f2fe)' : '#f5f5f5',
                            color: (lead.followUpCount || 0) > 0 ? 'white' : '#999',
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={lead.meetingCount || 0}
                          size="small"
                          sx={{
                            fontWeight: 600, minWidth: 36,
                            background: (lead.meetingCount || 0) > 0 ? 'linear-gradient(135deg, #a18cd1, #fbc2eb)' : '#f5f5f5',
                            color: (lead.meetingCount || 0) > 0 ? 'white' : '#999',
                          }}
                        />
                      </TableCell>
                      <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => setViewingLeadId(viewingLeadId === lead.id ? null : lead.id)} sx={{ color: viewingLeadId === lead.id ? '#10b981' : '#667eea' }}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Schedule Meeting">
                          <IconButton size="small" onClick={() => navigate(`/meetings/new?leadId=${lead.id}`)} sx={{ color: '#a18cd1' }}><Event fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Create Follow-up">
                          <IconButton size="small" onClick={() => navigate(`/followups/new?leadId=${lead.id}`)} sx={{ color: '#4facfe' }}><AccessTime fontSize="small" /></IconButton>
                        </Tooltip>
                        <Can permission="leads-update">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => navigate(`/leads/${lead.id}/edit`)} sx={{ color: '#ffc107' }}><Edit fontSize="small" /></IconButton>
                          </Tooltip>
                        </Can>
                        <Can permission="leads-delete">
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => { setLeadToDelete(lead); setDeleteDialogOpen(true); }}><Delete fontSize="small" /></IconButton>
                          </Tooltip>
                        </Can>
                      </TableCell>
                    </TableRow>
                    {isExpanded && <LeadExpandedRow leadId={lead.id} />}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination component="div" count={filteredLeads.length} page={page}
          onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} />
      </TableContainer>

      {/* Bulk Assign Toolbar */}
      {selectedLeadIds.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, background: 'linear-gradient(135deg, rgba(102,126,234,0.08), rgba(118,75,162,0.08))', border: '1px solid rgba(102,126,234,0.2)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip label={`${selectedLeadIds.length} selected`} color="primary" sx={{ fontWeight: 700 }} />
              <Button variant="contained" startIcon={<AssignmentInd />} onClick={() => setAssignDialogOpen(true)} sx={{ fontWeight: 700 }}>
                Assign to User
              </Button>
            </Box>
            <Button size="small" onClick={() => setSelectedLeadIds([])}>Clear Selection</Button>
          </Box>
        </Paper>
      )}

        </Box>

        {/* Right: Detail Panel */}
        {viewingLeadId && (
          <Paper sx={{ width: { xs: '100%', lg: 420 }, flexShrink: 0, borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', position: { lg: 'sticky' }, top: 20, maxHeight: { lg: 'calc(100vh - 120px)' } }}>
            <LeadDetailPanel leadId={viewingLeadId} onClose={() => setViewingLeadId(null)} />
          </Paper>
        )}
      </Box>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle fontWeight="700">Delete Lead</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete lead &quot;{leadToDelete?.customerName}&quot;?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} PaperProps={{ sx: { borderRadius: '16px', p: 1 } }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentInd sx={{ color: '#667eea' }} /> Assign {selectedLeadIds.length} Lead(s)
        </DialogTitle>
        <DialogContent>
          <Typography fontSize="0.85rem" color="text.secondary" sx={{ mb: 2 }}>
            Select a user to assign the selected leads to:
          </Typography>
          <TextField fullWidth select label="Select User" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} size="small">
            {userList.map((u: any) => (
              <MenuItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!selectedUserId || assigning} onClick={handleBulkAssign} sx={{ fontWeight: 700 }}>
            {assigning ? 'Assigning...' : 'Assign Leads'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
