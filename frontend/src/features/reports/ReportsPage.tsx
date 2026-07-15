import { Box, Typography, Button, Grid, Paper, TextField, Tabs, Tab, Card, CardContent, CircularProgress } from '@mui/material';
import { Download, PictureAsPdf } from '@mui/icons-material';
import { useState } from 'react';
import {
  useGetLeadsByStatusReportQuery, useGetLeadsQuery, useGetConversionReportQuery,
  useGetPerformanceReportQuery, useGetFollowUpReportQuery, useGetMeetingReportQuery,
  useGetAttendanceReportQuery, useGetClientReportQuery, useGetUserEntryReportQuery,
  useExportLeadsToExcelMutation, useExportLeadsToPdfMutation, useExportPerformanceToPdfMutation,
  useExportFollowUpsToExcelMutation, useExportFollowUpsToPdfMutation,
  useExportMeetingsToExcelMutation, useExportMeetingsToPdfMutation,
  useExportAttendanceToExcelMutation, useExportAttendanceToPdfMutation,
  useExportClientsToExcelMutation, useExportClientsToPdfMutation,
  useExportUsersToExcelMutation, useExportUsersToPdfMutation,
} from '../../api/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Can } from '../../components/Can';

const COLORS = ['#667eea', '#764ba2', '#00c9a7', '#ffc107', '#ff6b6b', '#4facfe'];

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

interface TabPanelProps { children: React.ReactNode; value: number; index: number; }
function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const { data: statusReport, isLoading: loadingStatus } = useGetLeadsByStatusReportQuery(undefined);
  const { data: leadsData } = useGetLeadsQuery({ pageNumber: 1, pageSize: 1 });
  const { data: conversionReport } = useGetConversionReportQuery({ startDate, endDate });
  const { data: performanceReport, isLoading: loadingPerformance } = useGetPerformanceReportQuery({ startDate, endDate });
  const { data: followUpReport, isLoading: loadingFollowUps } = useGetFollowUpReportQuery({ startDate, endDate });
  const { data: meetingReport, isLoading: loadingMeetings } = useGetMeetingReportQuery({ startDate, endDate });
  const { data: attendanceReport, isLoading: loadingAttendance } = useGetAttendanceReportQuery({ startDate, endDate });
  const { data: clientReport, isLoading: loadingClients } = useGetClientReportQuery(undefined);
  const { data: userReport, isLoading: loadingUsers } = useGetUserEntryReportQuery(undefined);

  const [exportLeadsExcel] = useExportLeadsToExcelMutation();
  const [exportLeadsPdf] = useExportLeadsToPdfMutation();
  const [exportPerfPdf] = useExportPerformanceToPdfMutation();
  const [exportFuExcel] = useExportFollowUpsToExcelMutation();
  const [exportFuPdf] = useExportFollowUpsToPdfMutation();
  const [exportMtExcel] = useExportMeetingsToExcelMutation();
  const [exportMtPdf] = useExportMeetingsToPdfMutation();
  const [exportAtExcel] = useExportAttendanceToExcelMutation();
  const [exportAtPdf] = useExportAttendanceToPdfMutation();
  const [exportClExcel] = useExportClientsToExcelMutation();
  const [exportClPdf] = useExportClientsToPdfMutation();
  const [exportUsExcel] = useExportUsersToExcelMutation();
  const [exportUsPdf] = useExportUsersToPdfMutation();

  const totalLeads = leadsData?.totalCount || statusReport?.statuses?.reduce((s: number, r: any) => s + r.count, 0) || 0;
  const convertedLeads = conversionReport?.convertedLeads || 0;
  const conversionRate = conversionReport?.conversionRate || 0;

  return (
    <Box className="animate-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ background: 'linear-gradient(135deg, #1a1a3e, #00c9a7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Reports</Typography>
          <Typography variant="body2" color="text.secondary">Analytics and export reports</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Paper sx={{ p: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField size="small" type="date" label="Start Date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField size="small" type="date" label="End Date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Paper>
        </Box>
      </Box>

      <Paper sx={{ borderRadius: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          {['Leads', 'Clients', 'Follow-ups', 'Meetings', 'Attendance', 'Users', 'Performance'].map((label) => (
            <Tab key={label} label={label} sx={{ fontWeight: 600, textTransform: 'none' }} />
          ))}
        </Tabs>

        {/* Leads Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ px: 3 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { label: 'Total Leads', value: totalLeads, color: '#667eea' },
                { label: 'Converted', value: convertedLeads, color: '#00c9a7' },
                { label: 'Conversion Rate', value: `${conversionRate}%`, color: '#764ba2' },
              ].map((item) => (
                <Grid item xs={12} sm={4} key={item.label}>
                  <Card sx={{ background: `linear-gradient(135deg, ${item.color}08, ${item.color}04)`, border: `1px solid ${item.color}15` }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight="600">{item.label}</Typography>
                      <Typography variant="h5" fontWeight="800" sx={{ color: item.color }}>{item.value}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" fontWeight="700" gutterBottom>Leads by Status</Typography>
              {loadingStatus ? <CircularProgress /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusReport?.statuses}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {statusReport?.statuses?.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Paper>
            <Can permission="reports-export">
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button variant="outlined" startIcon={<Download />} size="small" onClick={async () => { const b = await exportLeadsExcel(undefined).unwrap(); downloadBlob(b, 'Leads.xlsx'); }}>Export Excel</Button>
                <Button variant="outlined" startIcon={<PictureAsPdf />} size="small" onClick={async () => { const b = await exportLeadsPdf(undefined).unwrap(); downloadBlob(b, 'Leads.pdf'); }}>Export PDF</Button>
              </Box>
            </Can>
          </Box>
        </TabPanel>

        {/* Clients Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ px: 3 }}>
            {loadingClients ? <CircularProgress /> : (
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Company', 'Contact', 'Email', 'Phone', 'Industry', 'Projects', 'Revenue'].map((h) => (
                      <th key={h} style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid rgba(102,126,234,0.15)', fontWeight: 700, color: '#1a1a3e' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {clientReport?.map((c: any) => (
                      <tr key={c.id}>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)', fontWeight: 600 }}>{c.companyName}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{c.contactName}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{c.email}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{c.phone}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{c.industry}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{c.projectsCount ?? '-'}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)', fontWeight: 600 }}>${(c.totalRevenue || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
            <Can permission="reports-export">
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button variant="outlined" startIcon={<Download />} size="small" onClick={async () => { const b = await exportClExcel(undefined).unwrap(); downloadBlob(b, 'Clients.xlsx'); }}>Export Excel</Button>
                <Button variant="outlined" startIcon={<PictureAsPdf />} size="small" onClick={async () => { const b = await exportClPdf(undefined).unwrap(); downloadBlob(b, 'Clients.pdf'); }}>Export PDF</Button>
              </Box>
            </Can>
          </Box>
        </TabPanel>

        {/* Follow-ups Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ px: 3 }}>
            {loadingFollowUps ? <CircularProgress /> : (
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Lead', 'Company', 'Scheduled Date', 'Status', 'Notes', 'User'].map((h) => (
                      <th key={h} style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid rgba(102,126,234,0.15)', fontWeight: 700, color: '#1a1a3e' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {followUpReport?.map((f: any) => (
                      <tr key={f.id}>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)', fontWeight: 600 }}>{f.leadName || f.lead?.name}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{f.companyName || f.lead?.company}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{f.scheduledDate ? new Date(f.scheduledDate).toLocaleDateString() : '-'}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{f.status}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{f.notes}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{f.userName || f.user?.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
            <Can permission="reports-export">
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button variant="outlined" startIcon={<Download />} size="small" onClick={async () => { const b = await exportFuExcel({ startDate, endDate }).unwrap(); downloadBlob(b, 'FollowUps.xlsx'); }}>Export Excel</Button>
                <Button variant="outlined" startIcon={<PictureAsPdf />} size="small" onClick={async () => { const b = await exportFuPdf({ startDate, endDate }).unwrap(); downloadBlob(b, 'FollowUps.pdf'); }}>Export PDF</Button>
              </Box>
            </Can>
          </Box>
        </TabPanel>

        {/* Meetings Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ px: 3 }}>
            {loadingMeetings ? <CircularProgress /> : (
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Lead', 'Title', 'Type', 'Date', 'Duration', 'Setup Status', 'Client Response'].map((h) => (
                      <th key={h} style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid rgba(102,126,234,0.15)', fontWeight: 700, color: '#1a1a3e' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {meetingReport?.map((m: any) => (
                      <tr key={m.id}>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)', fontWeight: 600 }}>{m.leadName || m.lead?.name}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{m.title}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{m.type}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString() : '-'}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{m.duration ? `${m.duration} min` : '-'}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{m.setupStatus || '-'}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{m.clientResponse || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
            <Can permission="reports-export">
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button variant="outlined" startIcon={<Download />} size="small" onClick={async () => { const b = await exportMtExcel({ startDate, endDate }).unwrap(); downloadBlob(b, 'Meetings.xlsx'); }}>Export Excel</Button>
                <Button variant="outlined" startIcon={<PictureAsPdf />} size="small" onClick={async () => { const b = await exportMtPdf({ startDate, endDate }).unwrap(); downloadBlob(b, 'Meetings.pdf'); }}>Export PDF</Button>
              </Box>
            </Can>
          </Box>
        </TabPanel>

        {/* Attendance Tab */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ px: 3 }}>
            {loadingAttendance ? <CircularProgress /> : (
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['User', 'Email', 'Date', 'Check In', 'Check Out', 'Hours', 'Status'].map((h) => (
                      <th key={h} style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid rgba(102,126,234,0.15)', fontWeight: 700, color: '#1a1a3e' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {attendanceReport?.map((a: any) => (
                      <tr key={a.id}>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)', fontWeight: 600 }}>{a.userName || a.user?.name}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{a.userEmail || a.user?.email}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{a.date ? new Date(a.date).toLocaleDateString() : '-'}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{a.checkIn || '-'}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{a.checkOut || '-'}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{a.hours ?? '-'}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{a.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
            <Can permission="reports-export">
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button variant="outlined" startIcon={<Download />} size="small" onClick={async () => { const b = await exportAtExcel({ startDate, endDate }).unwrap(); downloadBlob(b, 'Attendance.xlsx'); }}>Export Excel</Button>
                <Button variant="outlined" startIcon={<PictureAsPdf />} size="small" onClick={async () => { const b = await exportAtPdf({ startDate, endDate }).unwrap(); downloadBlob(b, 'Attendance.pdf'); }}>Export PDF</Button>
              </Box>
            </Can>
          </Box>
        </TabPanel>

        {/* Users Tab */}
        <TabPanel value={activeTab} index={5}>
          <Box sx={{ px: 3 }}>
            {loadingUsers ? <CircularProgress /> : (
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Name', 'Email', 'Role', 'Last Login', 'Leads', 'Follow-ups', 'Meetings', 'Active'].map((h) => (
                      <th key={h} style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid rgba(102,126,234,0.15)', fontWeight: 700, color: '#1a1a3e' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {userReport?.map((u: any) => (
                      <tr key={u.id || u.userId}>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)', fontWeight: 600 }}>{u.name || u.userName}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{u.email}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{u.role || u.roleName}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '-'}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{u.leadsCount ?? u.totalLeads ?? '-'}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{u.followUpsCount ?? u.followUpsCompleted ?? '-'}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{u.meetingsCount ?? u.meetingsHeld ?? '-'}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{u.isActive ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
            <Can permission="reports-export">
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button variant="outlined" startIcon={<Download />} size="small" onClick={async () => { const b = await exportUsExcel(undefined).unwrap(); downloadBlob(b, 'Users.xlsx'); }}>Export Excel</Button>
                <Button variant="outlined" startIcon={<PictureAsPdf />} size="small" onClick={async () => { const b = await exportUsPdf(undefined).unwrap(); downloadBlob(b, 'Users.pdf'); }}>Export PDF</Button>
              </Box>
            </Can>
          </Box>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={activeTab} index={6}>
          <Box sx={{ px: 3 }}>
            {loadingPerformance ? <CircularProgress /> : (
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['User', 'Leads', 'Converted', 'Follow-ups', 'Meetings', 'Rate', 'Value'].map((h) => (
                      <th key={h} style={{ padding: 12, textAlign: h === 'Value' ? 'right' : 'left', borderBottom: '2px solid rgba(102,126,234,0.15)', fontWeight: 700, color: '#1a1a3e' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {performanceReport?.users?.map((u: any) => (
                      <tr key={u.userId}>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{u.userName}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{u.totalLeads}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{u.convertedLeads}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{u.followUpsCompleted}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{u.meetingsHeld}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{u.conversionRate}%</td>
                        <td style={{ padding: 12, textAlign: 'right', borderBottom: '1px solid rgba(0,0,0,0.06)', fontWeight: 600 }}>${u.totalValue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
            <Can permission="reports-export">
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button variant="outlined" startIcon={<PictureAsPdf />} size="small" onClick={async () => { const b = await exportPerfPdf(undefined).unwrap(); downloadBlob(b, 'Performance.pdf'); }}>Export PDF</Button>
              </Box>
            </Can>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
}
