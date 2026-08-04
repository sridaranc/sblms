import { useState } from 'react';
import {
  Box, Typography, Button, TextField, Grid, Paper, Card, CardContent, Alert, Snackbar,
  CircularProgress, Divider, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, Tab, Tabs, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Search, AutoAwesome, CheckCircle, Business, Email, Phone, LocationOn,
  History, SmartToy, Cloud, Psychology, AutoGraph, LinkedIn, CalendarToday, AttachMoney,
} from '@mui/icons-material';
import {
  useSearchAiLeadsMutation, useGetAiLeadRequestsQuery, useGetAiLeadRequestByIdQuery, useConfirmAiLeadMutation,
} from '../../api/api';

interface AiSearchResult {
  id: string;
  companyName: string;
  contactPerson: string;
  emailAddress: string;
  contactPersonEmail: string;
  phone: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  website: string;
  natureOfBusiness: string;
  industry: string;
  companySize: string;
  linkedinUrl: string;
  foundedYear: number;
  revenueRange: string;
  isDuplicate: boolean;
  isConfirmed: boolean;
}

interface SearchRequest {
  id: string;
  keywords: string;
  country: string;
  industry: string;
  aiProvider: string;
  resultsCount: number;
  status: string;
  userName: string;
  createdAt: string;
}

const countries = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Japan', 'Singapore', 'UAE', 'South Africa', 'Brazil',
];

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
  'Education', 'Real Estate', 'Energy', 'Agriculture', 'Other',
];

const aiProviders = [
  { value: 'Ollama', label: 'Ollama (Local)', icon: <AutoGraph />, color: '#000000', desc: 'Local LLM - 100% free, runs on machine', free: true },
  { value: 'Groq', label: 'Groq (Llama 3)', icon: <AutoGraph />, color: '#f97316', desc: 'Llama 3 70B - Free, fast inference', free: true },
  { value: 'OpenAI', label: 'ChatGPT (OpenAI)', icon: <SmartToy />, color: '#10a37f', desc: 'GPT-4o Mini - Free tier available', free: true },
  { value: 'Google Gemini', label: 'Google Gemini', icon: <Cloud />, color: '#4285f4', desc: 'Gemini 1.5 Flash - Free tier (15 RPM)', free: true },
  { value: 'HuggingFace', label: 'HuggingFace', icon: <AutoAwesome />, color: '#ffd21e', desc: 'Open source models - Always free', free: true },
  { value: 'OpenRouter', label: 'OpenRouter', icon: <Psychology />, color: '#7c3aed', desc: 'Free Llama 3/Mistral/Gemma models', free: true },
];

export default function AiLeadsPage() {
  const [tab, setTab] = useState(0);
  const [keywords, setKeywords] = useState('');
  const [country, setCountry] = useState('');
  const [industry, setIndustry] = useState('');
  const [prompt, setPrompt] = useState('');
  const [aiProvider, setAiProvider] = useState('OpenAI');
  const [results, setResults] = useState<AiSearchResult[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SearchRequest | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });
  const [confirmDialog, setConfirmDialog] = useState<AiSearchResult | null>(null);

  const [searchAiLeads, { isLoading: loading }] = useSearchAiLeadsMutation();
  const { data: requestsResponse, refetch: refetchRequests } = useGetAiLeadRequestsQuery({});
  const [confirmAiLead] = useConfirmAiLeadMutation();

  const requests: SearchRequest[] = requestsResponse?.data?.items || [];

  const { data: detailResponse, isLoading: detailLoading } = useGetAiLeadRequestByIdQuery(
    selectedRequest?.id || '',
    { skip: !selectedRequest }
  );

  const detailResults: AiSearchResult[] = detailResponse?.data?.results || [];

  const handleSearch = async () => {
    if (!keywords.trim() || !country) {
      setSnackbar({ open: true, message: 'Please enter keywords and select a country', severity: 'error' });
      return;
    }
    try {
      const data = await searchAiLeads({ keywords, country, industry, prompt, aiProvider }).unwrap();
      if (data.isSuccess) {
        setResults(data.data.results);
        const count = data.data.resultsCount;
        const duplicates = data.data.duplicatesSkipped || 0;
        if (count === 0) {
          setSnackbar({ open: true, message: `No results found for "${keywords}" in ${country}. Try different keywords.`, severity: 'warning' });
        } else {
          setSnackbar({ open: true, message: `Found ${count} companies via ${data.data.provider}${duplicates > 0 ? ` (${duplicates} duplicates skipped)` : ''}`, severity: 'success' });
        }
        refetchRequests();
      } else {
        setSnackbar({ open: true, message: data.message || 'Search failed', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Network error', severity: 'error' });
    }
  };

  const handleConfirm = async (result: AiSearchResult) => {
    try {
      const data = await confirmAiLead(result.id).unwrap();
      if (data.isSuccess) {
        setSnackbar({ open: true, message: `Lead created: ${data.data.leadNumber}`, severity: 'success' });
        setResults(results.map(r => r.id === result.id ? { ...r, isConfirmed: true } : r));
        setConfirmDialog(null);
      } else {
        setSnackbar({ open: true, message: data.message || 'Failed to confirm lead', severity: 'error' });
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Network error';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  const viewRequestDetail = (request: SearchRequest) => {
    setSelectedRequest(request);
  };

  const providerColor: Record<string, string> = {
    'Ollama': '#000000', 'OpenAI': '#10a37f', 'Google Gemini': '#4285f4',
    'Groq': '#f97316', 'HuggingFace': '#ffd21e', 'OpenRouter': '#7c3aed',
  };

  return (
    <Box className="animate-in">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="800" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' }, background: 'linear-gradient(135deg, #1a1a3e, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AI Lead Discovery
        </Typography>
        <Typography variant="body2" color="text.secondary">Use AI to discover real business leads from keywords and company information</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>
        <Typography fontWeight="700" gutterBottom>Setup Required for Real Data</Typography>
        <Typography variant="body2" gutterBottom>To get real company data, configure at least one search API:</Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          <li><strong>Brave Search</strong> (Recommended) - Free 2000 queries/month at <a href="https://brave.com/search/api/" target="_blank" rel="noopener">brave.com/search/api</a></li>
          <li><strong>Google Custom Search</strong> - Free 100 queries/day at <a href="https://cse.google.com/cse/all" target="_blank" rel="noopener">cse.google.com</a></li>
        </Box>
        <Typography variant="caption" color="text.secondary">Add API key to appsettings.json under Search:Brave:ApiKey or GoogleSearch:ApiKey</Typography>
      </Alert>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<AutoAwesome />} label="Search AI" />
        <Tab icon={<History />} label={`Search History (${requests.length})`} />
      </Tabs>

      {tab === 0 && (
        <>
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Typography variant="h6" fontWeight="700" gutterBottom sx={{ color: '#764ba2' }}>
              <SmartToy sx={{ mr: 1, verticalAlign: 'middle' }} />Select AI Provider & Search
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
              {aiProviders.map((provider) => (
                <Card key={provider.value}
                  onClick={() => setAiProvider(provider.value)}
                  sx={{
                    flex: '1 1 180px', cursor: 'pointer', transition: 'all 0.2s',
                    border: aiProvider === provider.value ? `2px solid ${provider.color}` : '2px solid transparent',
                    background: aiProvider === provider.value ? `${provider.color}08` : 'white',
                    boxShadow: aiProvider === provider.value ? `0 4px 16px ${provider.color}30` : 'none',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${provider.color}20` },
                  }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Avatar sx={{ width: 32, height: 32, background: provider.color, color: 'white' }}>{provider.icon}</Avatar>
                      <Box>
                        <Typography fontWeight="700" fontSize="0.85rem">{provider.label}</Typography>
                        <Typography variant="caption" color="text.secondary" fontSize="0.7rem">{provider.desc}</Typography>
                      </Box>
                    </Box>
                    {provider.free && <Chip label="FREE" size="small" sx={{ mt: 0.5, fontSize: '0.65rem', height: 18, background: '#e8f5e9', color: '#2e7d32' }} />}
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Business Keywords *" placeholder="e.g., Software Company, IT Solutions, Digital Marketing..."
                  value={keywords} onChange={(e) => setKeywords(e.target.value)} size="small" multiline rows={2} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth select label="Country *" value={country} onChange={(e) => setCountry(e.target.value)} size="small">
                  {countries.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth select label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} size="small">
                  <MenuItem value="">All Industries</MenuItem>
                  {industries.map((i) => <MenuItem key={i} value={i}>{i}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Additional Prompt (Optional)" placeholder="Describe what kind of companies you're looking for..."
                  value={prompt} onChange={(e) => setPrompt(e.target.value)} size="small" multiline rows={2} />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                  onClick={handleSearch} disabled={loading} sx={{
                    px: 4,
                    background: `linear-gradient(135deg, ${providerColor[aiProvider] || '#667eea'}, ${providerColor[aiProvider] || '#764ba2'}cc)`,
                    '&:hover': { background: `linear-gradient(135deg, ${providerColor[aiProvider] || '#667eea'}, ${providerColor[aiProvider] || '#764ba2'})` },
                  }}>
                  {loading ? 'Searching...' : `Search with ${aiProviders.find(p => p.value === aiProvider)?.label}`}
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {results.length > 0 && (
            <Paper sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="700" sx={{ color: '#667eea' }}>
                  Results ({results.length} companies found via {aiProviders.find(p => p.value === aiProvider)?.label})
                </Typography>
                <Chip label={`${results.filter(r => r.isConfirmed).length} confirmed`} color="success" size="small" />
              </Box>
              <Grid container spacing={2}>
                {results.map((result) => (
                  <Grid item xs={12} md={6} key={result.id}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 44, height: 44, background: `linear-gradient(135deg, ${providerColor[aiProvider]}, ${providerColor[aiProvider]}aa)`, fontSize: '0.9rem', fontWeight: 700 }}>
                              {result.companyName[0]}
                            </Avatar>
                            <Box>
                              <Typography fontWeight="700">{result.companyName}</Typography>
                              <Typography variant="caption" color="text.secondary">{result.natureOfBusiness}</Typography>
                            </Box>
                          </Box>
                          {result.isConfirmed ? (
                            <Chip icon={<CheckCircle />} label="Confirmed" color="success" size="small" />
                          ) : result.isDuplicate ? (
                            <Chip label="Duplicate" color="warning" size="small" />
                          ) : null}
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Email sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                            <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>{result.emailAddress || 'N/A'}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Phone sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                            <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>{result.mobile || result.phone || 'N/A'}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                            <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>
                              {result.address ? `${result.address}, ${result.city}, ${result.country}` : `${result.city || ''} ${result.country || ''}`.trim()}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Business sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                            <Typography variant="caption">{result.companySize || 'Unknown Size'}</Typography>
                          </Box>
                        </Box>
                        {result.contactPerson && (
                          <Box sx={{ mb: 1.5, p: 1, borderRadius: 1, background: 'rgba(102,126,234,0.04)' }}>
                            <Typography variant="caption" color="text.secondary">Contact: {result.contactPerson}</Typography>
                            {result.contactPersonEmail && <Typography variant="caption" display="block">{result.contactPersonEmail}</Typography>}
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          {result.linkedinUrl && (
                            <Chip icon={<LinkedIn sx={{ fontSize: 14 }} />} label="LinkedIn" size="small" component="a" href={result.linkedinUrl} target="_blank" clickable sx={{ fontSize: '0.7rem' }} />
                          )}
                          {result.foundedYear && (
                            <Chip icon={<CalendarToday sx={{ fontSize: 14 }} />} label={`Est. ${result.foundedYear}`} size="small" sx={{ fontSize: '0.7rem' }} />
                          )}
                          {result.revenueRange && (
                            <Chip icon={<AttachMoney sx={{ fontSize: 14 }} />} label={result.revenueRange} size="small" sx={{ fontSize: '0.7rem' }} />
                          )}
                        </Box>
                        {!result.isConfirmed && !result.isDuplicate && (
                          <Button variant="contained" size="small" fullWidth startIcon={<CheckCircle />}
                            onClick={() => setConfirmDialog(result)}>
                            Confirm as Lead
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
        </>
      )}

      {tab === 1 && (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" fontWeight="700" gutterBottom>Search History</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Keywords</TableCell>
                  <TableCell>AI Provider</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Results</TableCell>
                  <TableCell>Requested By</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id} hover>
                    <TableCell><Chip label={req.keywords} size="small" sx={{ fontWeight: 600 }} /></TableCell>
                    <TableCell>
                      <Chip label={req.aiProvider || 'Unknown'} size="small"
                        sx={{ fontWeight: 600, background: `${providerColor[req.aiProvider] || '#999'}15`, color: providerColor[req.aiProvider] || '#999' }} />
                    </TableCell>
                    <TableCell>{req.country}</TableCell>
                    <TableCell><Chip label={`${req.resultsCount} found`} size="small" color="info" /></TableCell>
                    <TableCell>{req.userName}</TableCell>
                    <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => viewRequestDetail(req)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle fontWeight="700">Confirm Lead</DialogTitle>
        <DialogContent>
          {confirmDialog && (
            <Box>
              <Typography gutterBottom>This will create a new lead from <strong>{confirmDialog.companyName}</strong> and move it to the Leads page.</Typography>
              <Alert severity="info" sx={{ mt: 1 }}>The company will be checked for duplicates before creation.</Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => confirmDialog && handleConfirm(confirmDialog)}>Confirm & Create Lead</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!selectedRequest} onClose={() => setSelectedRequest(null)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography fontWeight="700">Search Results: {selectedRequest?.keywords}</Typography>
              <Chip label={selectedRequest?.aiProvider || 'Unknown'} size="small" sx={{ mt: 0.5, background: `${providerColor[selectedRequest?.aiProvider || ''] || '#999'}15`, color: providerColor[selectedRequest?.aiProvider || ''] || '#999' }} />
            </Box>
            <Button onClick={() => setSelectedRequest(null)}>Close</Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailLoading ? <CircularProgress /> : (
            <Grid container spacing={2}>
              {detailResults.map((result) => (
                <Grid item xs={12} md={6} key={result.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography fontWeight="700">{result.companyName}</Typography>
                        {result.isConfirmed ? <Chip label="Confirmed" color="success" size="small" /> : null}
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>{result.natureOfBusiness}</Typography>
                      <Typography variant="caption" display="block"><strong>Email:</strong> {result.emailAddress || 'N/A'}</Typography>
                      <Typography variant="caption" display="block"><strong>Phone:</strong> {result.mobile || 'N/A'}</Typography>
                      <Typography variant="caption" display="block"><strong>Address:</strong> {result.address || `${result.city}, ${result.country}`}</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1, mb: 1 }}>
                        {result.linkedinUrl && (
                          <Chip icon={<LinkedIn sx={{ fontSize: 14 }} />} label="LinkedIn" size="small" component="a" href={result.linkedinUrl} target="_blank" clickable sx={{ fontSize: '0.7rem' }} />
                        )}
                        {result.foundedYear && (
                          <Chip icon={<CalendarToday sx={{ fontSize: 14 }} />} label={`Est. ${result.foundedYear}`} size="small" sx={{ fontSize: '0.7rem' }} />
                        )}
                        {result.revenueRange && (
                          <Chip icon={<AttachMoney sx={{ fontSize: 14 }} />} label={result.revenueRange} size="small" sx={{ fontSize: '0.7rem' }} />
                        )}
                      </Box>
                      {!result.isConfirmed && (
                        <Button variant="contained" size="small" sx={{ mt: 1 }} startIcon={<CheckCircle />}
                          onClick={() => { setSelectedRequest(null); setConfirmDialog(result); }}>
                          Confirm
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
