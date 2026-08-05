import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard, RoleGuard } from './features/auth/AuthGuard';
import { PermissionGuard } from './components/PermissionGuard';
import LoginPage from './features/auth/LoginPage';
import AppLayout from './components/layout/AppLayout';
import { Box, CircularProgress } from '@mui/material';

const FaceLogin = lazy(() => import('./features/auth/FaceLogin'));
const FaceRegistration = lazy(() => import('./features/auth/FaceRegistration'));
const UnauthorizedPage = lazy(() => import('./features/auth/UnauthorizedPage'));
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'));
const LeadsListPage = lazy(() => import('./features/leads/LeadsListPage'));
const LeadFormPage = lazy(() => import('./features/leads/LeadFormPage'));
const LeadDetailPage = lazy(() => import('./features/leads/LeadDetailPage'));
const FollowUpsListPage = lazy(() => import('./features/followups/FollowUpsListPage'));
const FollowUpFormPage = lazy(() => import('./features/followups/FollowUpFormPage'));
const MeetingsListPage = lazy(() => import('./features/meetings/MeetingsListPage'));
const MeetingFormPage = lazy(() => import('./features/meetings/MeetingFormPage'));
const ReportsPage = lazy(() => import('./features/reports/ReportsPage'));
const NotificationsPage = lazy(() => import('./features/notifications/NotificationsPage'));
const UsersListPage = lazy(() => import('./features/users/UsersListPage'));
const UserFormPage = lazy(() => import('./features/users/UserFormPage'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));
const AiLeadsPage = lazy(() => import('./features/aileads/AiLeadsPage'));
const ClientsListPage = lazy(() => import('./features/clients/ClientsListPage'));
const ClientFormPage = lazy(() => import('./features/clients/ClientFormPage'));
const ClientDetailPage = lazy(() => import('./features/clients/ClientDetailPage'));
const AccessControlPage = lazy(() => import('./features/management/AccessControlPage'));
const SystemConfigPage = lazy(() => import('./features/management/SystemConfigPage'));
const FaceEnrolmentPage = lazy(() => import('./features/face-enrolment/FaceEnrolmentPage'));
const AttendancePage = lazy(() => import('./features/attendance/AttendancePage'));

function PageLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <CircularProgress sx={{ color: '#667eea' }} />
    </Box>
  );
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/face-login" element={<FaceLogin />} />
        <Route path="/register" element={<FaceRegistration />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/leads" element={<PermissionGuard requires={['leads-read']}><LeadsListPage /></PermissionGuard>} />
                  <Route path="/leads/new" element={<PermissionGuard requires={['leads-create']}><LeadFormPage /></PermissionGuard>} />
                  <Route path="/leads/:id" element={<PermissionGuard requires={['leads-read']}><LeadDetailPage /></PermissionGuard>} />
                  <Route path="/leads/:id/edit" element={<PermissionGuard requires={['leads-update']}><LeadFormPage /></PermissionGuard>} />
                  <Route path="/ai-leads" element={<RoleGuard allowedRoles={['admin', 'manager']}><AiLeadsPage /></RoleGuard>} />
                  <Route path="/clients" element={<PermissionGuard requires={['clients-read']}><ClientsListPage /></PermissionGuard>} />
                  <Route path="/clients/new" element={<PermissionGuard requires={['clients-create']}><ClientFormPage /></PermissionGuard>} />
                  <Route path="/clients/:id" element={<PermissionGuard requires={['clients-read']}><ClientDetailPage /></PermissionGuard>} />
                  <Route path="/clients/:id/edit" element={<PermissionGuard requires={['clients-update']}><ClientFormPage /></PermissionGuard>} />
                  <Route path="/follow-ups" element={<PermissionGuard requires={['followups-read']}><FollowUpsListPage /></PermissionGuard>} />
                  <Route path="/follow-ups/new" element={<PermissionGuard requires={['followups-create']}><FollowUpFormPage /></PermissionGuard>} />
                  <Route path="/follow-ups/:id/edit" element={<PermissionGuard requires={['followups-update']}><FollowUpFormPage /></PermissionGuard>} />
                  <Route path="/meetings" element={<PermissionGuard requires={['meetings-read']}><MeetingsListPage /></PermissionGuard>} />
                  <Route path="/meetings/new" element={<PermissionGuard requires={['meetings-create']}><MeetingFormPage /></PermissionGuard>} />
                  <Route path="/meetings/:id/edit" element={<PermissionGuard requires={['meetings-update']}><MeetingFormPage /></PermissionGuard>} />
                  <Route path="/reports" element={<PermissionGuard requires={['reports-read']}><ReportsPage /></PermissionGuard>} />
                  <Route path="/notifications" element={<PermissionGuard requires={['notifications-read']}><NotificationsPage /></PermissionGuard>} />
                  <Route path="/users" element={<PermissionGuard requires={['users-read']}><UsersListPage /></PermissionGuard>} />
                  <Route path="/users/new" element={<PermissionGuard requires={['users-create']}><UserFormPage /></PermissionGuard>} />
                  <Route path="/users/:id/edit" element={<PermissionGuard requires={['users-update']}><UserFormPage /></PermissionGuard>} />
                  <Route path="/settings" element={<PermissionGuard requires={['settings-read']}><SettingsPage /></PermissionGuard>} />
                  <Route path="/settings/roles" element={<PermissionGuard requires={['roles-read']}><AccessControlPage /></PermissionGuard>} />
                  <Route path="/settings/system" element={<PermissionGuard requires={['settings-read']}><SystemConfigPage /></PermissionGuard>} />
                  <Route path="/face-enrolment" element={<PermissionGuard requires={['face-enrolment-read']}><FaceEnrolmentPage /></PermissionGuard>} />
                  <Route path="/attendance" element={<PermissionGuard requires={['attendance-read']}><AttendancePage /></PermissionGuard>} />
                </Routes>
              </AppLayout>
            </AuthGuard>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;