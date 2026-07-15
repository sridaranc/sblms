import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard, RoleGuard } from './features/auth/AuthGuard';
import { PermissionGuard } from './components/PermissionGuard';
import LoginPage from './features/auth/LoginPage';
import FaceLogin from './features/auth/FaceLogin';
import FaceRegistration from './features/auth/FaceRegistration';
import UnauthorizedPage from './features/auth/UnauthorizedPage';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './features/dashboard/DashboardPage';
import LeadsListPage from './features/leads/LeadsListPage';
import LeadFormPage from './features/leads/LeadFormPage';
import LeadDetailPage from './features/leads/LeadDetailPage';
import FollowUpsListPage from './features/followups/FollowUpsListPage';
import FollowUpFormPage from './features/followups/FollowUpFormPage';
import MeetingsListPage from './features/meetings/MeetingsListPage';
import MeetingFormPage from './features/meetings/MeetingFormPage';
import ReportsPage from './features/reports/ReportsPage';
import NotificationsPage from './features/notifications/NotificationsPage';
import UsersListPage from './features/users/UsersListPage';
import UserFormPage from './features/users/UserFormPage';
import SettingsPage from './features/settings/SettingsPage';
import AiLeadsPage from './features/aileads/AiLeadsPage';
import ClientsListPage from './features/clients/ClientsListPage';
import ClientFormPage from './features/clients/ClientFormPage';
import ClientDetailPage from './features/clients/ClientDetailPage';
import AccessControlPage from './features/management/AccessControlPage';
import SystemConfigPage from './features/management/SystemConfigPage';
import FaceEnrolmentPage from './features/face-enrolment/FaceEnrolmentPage';
import AttendancePage from './features/attendance/AttendancePage';

function App() {
  return (
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
  );
}

export default App;
