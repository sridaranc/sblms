import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5080/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Leads', 'FollowUps', 'Meetings', 'Notifications', 'Users', 'Dashboard', 'AuditLogs', 'Reports', 'AiLeads', 'Clients', 'Roles', 'Permissions', 'SystemConfig', 'Attendance'],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation({ query: (credentials) => ({ url: '/auth/login', method: 'POST', body: credentials }) }),
    faceLogin: builder.mutation({ query: (data) => ({ url: '/auth/face-login', method: 'POST', body: data }) }),
    register: builder.mutation({ query: (user) => ({ url: '/users', method: 'POST', body: user }), invalidatesTags: ['Users'] }),

    // Leads
    getLeads: builder.query({
      query: ({ pageNumber = 1, pageSize = 10, searchTerm, status, source }) => ({
        url: '/leads',
        params: { pageNumber, pageSize, searchTerm, status, source },
      }),
      providesTags: ['Leads'],
    }),
    getLeadById: builder.query({ query: (id) => `/leads/${id}`, transformResponse: (response: any) => response?.data || response, providesTags: ['Leads'] }),
    createLead: builder.mutation({ query: (lead) => ({ url: '/leads', method: 'POST', body: lead }), invalidatesTags: ['Leads'] }),
    updateLead: builder.mutation({ query: ({ id, ...lead }) => ({ url: `/leads/${id}`, method: 'PUT', body: lead }), invalidatesTags: ['Leads'] }),
    deleteLead: builder.mutation({ query: (id) => ({ url: `/leads/${id}`, method: 'DELETE' }), invalidatesTags: ['Leads'] }),
    updateLeadStatus: builder.mutation({ query: ({ id, status }) => ({ url: `/leads/${id}/status`, method: 'PUT', body: { status } }), invalidatesTags: ['Leads'] }),
    assignLead: builder.mutation({ query: ({ id, userId }) => ({ url: `/leads/${id}/assign`, method: 'PUT', body: { userId } }), invalidatesTags: ['Leads'] }),
    bulkAssignLeads: builder.mutation({ query: ({ leadIds, userId }) => ({ url: '/leads/bulk-assign', method: 'POST', body: { leadIds, userId } }), invalidatesTags: ['Leads'] }),
    getLeadStats: builder.query({ query: () => '/leads/statistics', providesTags: ['Leads'] }),

    // Follow-ups
    getFollowUps: builder.query({
      query: ({ pageNumber = 1, pageSize = 10, status, leadId, userId }) => ({
        url: '/followups',
        params: { pageNumber, pageSize, status, leadId, userId },
      }),
      transformResponse: (response: any) => response?.data || response,
      providesTags: ['FollowUps'],
    }),
    getFollowUpById: builder.query({ query: (id) => `/followups/${id}`, transformResponse: (response: any) => response?.data || response, providesTags: ['FollowUps'] }),
    createFollowUp: builder.mutation({ query: (followUp) => ({ url: '/followups', method: 'POST', body: followUp }), invalidatesTags: ['FollowUps'] }),
    updateFollowUp: builder.mutation({ query: ({ id, ...followUp }) => ({ url: `/followups/${id}`, method: 'PUT', body: followUp }), invalidatesTags: ['FollowUps'] }),
    completeFollowUp: builder.mutation({ query: ({ id, notes }) => ({ url: `/followups/${id}/complete`, method: 'PUT', body: { notes } }), invalidatesTags: ['FollowUps'] }),
    cancelFollowUp: builder.mutation({ query: ({ id, reason }) => ({ url: `/followups/${id}/cancel`, method: 'PUT', body: { reason } }), invalidatesTags: ['FollowUps'] }),
    getOverdueFollowUps: builder.query({ query: () => '/followups/overdue', transformResponse: (response: any) => response?.data || response, providesTags: ['FollowUps'] }),

    // Meetings
    getMeetings: builder.query({
      query: ({ pageNumber = 1, pageSize = 10, status, userId, startDate, endDate }) => ({
        url: '/meetings',
        params: { pageNumber, pageSize, status, userId, startDate, endDate },
      }),
      transformResponse: (response: any) => response?.data || response,
      providesTags: ['Meetings'],
    }),
    getMeetingById: builder.query({ query: (id) => `/meetings/${id}`, transformResponse: (response: any) => response?.data || response, providesTags: ['Meetings'] }),
    getLeadMeetings: builder.query({
      query: (leadId) => `/meetingschedule/lead/${leadId}`,
      transformResponse: (response: any) => response?.data || response,
      providesTags: ['Meetings'],
    }),
    createMeeting: builder.mutation({ query: (meeting) => ({ url: '/meetings', method: 'POST', body: meeting }), invalidatesTags: ['Meetings'] }),
    updateMeeting: builder.mutation({ query: ({ id, ...meeting }) => ({ url: `/meetings/${id}`, method: 'PUT', body: meeting }), invalidatesTags: ['Meetings'] }),
    cancelMeeting: builder.mutation({ query: ({ id, reason }) => ({ url: `/meetings/${id}/cancel`, method: 'PUT', body: { reason } }), invalidatesTags: ['Meetings'] }),
    completeMeeting: builder.mutation({ query: ({ id, notes, outcome }) => ({ url: `/meetings/${id}/complete`, method: 'PUT', body: { notes, outcome } }), invalidatesTags: ['Meetings'] }),

    // Notifications
    getNotifications: builder.query({
      query: ({ pageNumber = 1, pageSize = 10, isRead }) => ({
        url: '/notifications',
        params: { pageNumber, pageSize, isRead },
      }),
      providesTags: ['Notifications'],
    }),
    getUnreadCount: builder.query({ query: () => '/notifications/unread-count', providesTags: ['Notifications'] }),
    markAsRead: builder.mutation({ query: (id) => ({ url: `/notifications/${id}/read`, method: 'PUT' }), invalidatesTags: ['Notifications'] }),
    markAllAsRead: builder.mutation({ query: () => ({ url: '/notifications/read-all', method: 'PUT' }), invalidatesTags: ['Notifications'] }),

    // Users
    getUsers: builder.query({
      query: ({ pageNumber = 1, pageSize = 10, searchTerm, role, isActive = true }) => ({
        url: '/users/paginated',
        params: { pageNumber, pageSize, searchTerm, role, isActive },
      }),
      transformResponse: (response: any) => response?.data || response,
      providesTags: ['Users'],
    }),
    getUserById: builder.query({ query: (id) => `/users/${id}`, transformResponse: (response: any) => response?.data || response, providesTags: ['Users'] }),
    createUser: builder.mutation({ query: (user) => ({ url: '/users', method: 'POST', body: user }), invalidatesTags: ['Users'] }),
    updateUser: builder.mutation({ query: ({ id, ...user }) => ({ url: `/users/${id}`, method: 'PUT', body: user }), invalidatesTags: ['Users'] }),
    deleteUser: builder.mutation({ query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }), invalidatesTags: ['Users'] }),

    // Dashboard
    getDashboardStats: builder.query({ query: () => '/reports/dashboard', transformResponse: (response: any) => response?.data || response, providesTags: ['Dashboard'] }),

    // Reports
    getLeadsByStatusReport: builder.query({ query: () => '/reports/leads-by-status', transformResponse: (response: any) => response?.data || response, providesTags: ['Reports'] }),
    getConversionReport: builder.query({ query: ({ startDate, endDate }) => ({ url: '/reports/conversion', params: { startDate, endDate } }), transformResponse: (response: any) => response?.data || response, providesTags: ['Reports'] }),
    getPerformanceReport: builder.query({ query: ({ startDate, endDate }) => ({ url: '/reports/performance', params: { startDate, endDate } }), transformResponse: (response: any) => response?.data || response, providesTags: ['Reports'] }),
    getFollowUpReport: builder.query({
      query: ({ startDate, endDate }: { startDate?: string; endDate?: string } = {}) => ({
        url: '/reports/followups',
        params: { startDate, endDate },
      }),
      transformResponse: (response: any) => response?.data || response,
      providesTags: ['Reports'],
    }),
    getMeetingReport: builder.query({
      query: ({ startDate, endDate }: { startDate?: string; endDate?: string } = {}) => ({
        url: '/reports/meetings',
        params: { startDate, endDate },
      }),
      transformResponse: (response: any) => response?.data || response,
      providesTags: ['Reports'],
    }),
    getAttendanceReport: builder.query({
      query: ({ startDate, endDate }: { startDate?: string; endDate?: string } = {}) => ({
        url: '/reports/attendance',
        params: { startDate, endDate },
      }),
      transformResponse: (response: any) => response?.data || response,
      providesTags: ['Reports'],
    }),
    getClientReport: builder.query({
      query: () => '/reports/clients',
      transformResponse: (response: any) => response?.data || response,
      providesTags: ['Reports'],
    }),
    getUserEntryReport: builder.query({
      query: () => '/reports/users',
      transformResponse: (response: any) => response?.data || response,
      providesTags: ['Reports'],
    }),
    exportLeadsToExcel: builder.mutation({ query: () => ({ url: '/reports/export/leads/excel', responseHandler: (res) => res.blob() }) }),
    exportLeadsToPdf: builder.mutation({ query: () => ({ url: '/reports/export/leads/pdf', responseHandler: (res) => res.blob() }) }),
    exportPerformanceToPdf: builder.mutation({ query: () => ({ url: '/reports/export/performance/pdf', responseHandler: (res) => res.blob() }) }),
    exportFollowUpsToExcel: builder.mutation({
      query: ({ startDate, endDate }: { startDate?: string; endDate?: string } = {}) => ({
        url: '/reports/export/followups/excel',
        params: { startDate, endDate },
        responseHandler: (res: any) => res.blob(),
      }),
    }),
    exportFollowUpsToPdf: builder.mutation({
      query: ({ startDate, endDate }: { startDate?: string; endDate?: string } = {}) => ({
        url: '/reports/export/followups/pdf',
        params: { startDate, endDate },
        responseHandler: (res: any) => res.blob(),
      }),
    }),
    exportMeetingsToExcel: builder.mutation({
      query: ({ startDate, endDate }: { startDate?: string; endDate?: string } = {}) => ({
        url: '/reports/export/meetings/excel',
        params: { startDate, endDate },
        responseHandler: (res: any) => res.blob(),
      }),
    }),
    exportMeetingsToPdf: builder.mutation({
      query: ({ startDate, endDate }: { startDate?: string; endDate?: string } = {}) => ({
        url: '/reports/export/meetings/pdf',
        params: { startDate, endDate },
        responseHandler: (res: any) => res.blob(),
      }),
    }),
    exportAttendanceToExcel: builder.mutation({
      query: ({ startDate, endDate }: { startDate?: string; endDate?: string } = {}) => ({
        url: '/reports/export/attendance/excel',
        params: { startDate, endDate },
        responseHandler: (res: any) => res.blob(),
      }),
    }),
    exportAttendanceToPdf: builder.mutation({
      query: ({ startDate, endDate }: { startDate?: string; endDate?: string } = {}) => ({
        url: '/reports/export/attendance/pdf',
        params: { startDate, endDate },
        responseHandler: (res: any) => res.blob(),
      }),
    }),
    exportClientsToExcel: builder.mutation({
      query: () => ({
        url: '/reports/export/clients/excel',
        responseHandler: (res: any) => res.blob(),
      }),
    }),
    exportClientsToPdf: builder.mutation({
      query: () => ({
        url: '/reports/export/clients/pdf',
        responseHandler: (res: any) => res.blob(),
      }),
    }),
    exportUsersToExcel: builder.mutation({
      query: () => ({
        url: '/reports/export/users/excel',
        responseHandler: (res: any) => res.blob(),
      }),
    }),
    exportUsersToPdf: builder.mutation({
      query: () => ({
        url: '/reports/export/users/pdf',
        responseHandler: (res: any) => res.blob(),
      }),
    }),

    // Audit Logs
    getAuditLogs: builder.query({
      query: ({ pageNumber = 1, pageSize = 10, searchTerm, entityName, action, startDate, endDate }) => ({
        url: '/auditlogs',
        params: { pageNumber, pageSize, searchTerm, entityName, action, startDate, endDate },
      }),
      providesTags: ['AuditLogs'],
    }),

    // AI Leads
    searchAiLeads: builder.mutation({
      query: (body) => ({ url: '/aileads/search', method: 'POST', body }),
    }),
    getAiLeadRequests: builder.query({ query: () => '/aileads/requests', providesTags: ['AiLeads'] }),
    getAiLeadRequestById: builder.query({ query: (id) => `/aileads/requests/${id}`, providesTags: ['AiLeads'] }),
    confirmAiLead: builder.mutation({
      query: (resultId) => ({ url: `/aileads/confirm/${resultId}`, method: 'POST' }),
      invalidatesTags: ['AiLeads', 'Leads'],
    }),

    // Clients
    getClients: builder.query({ query: () => '/clients', transformResponse: (response: any) => response?.data || response, providesTags: ['Clients'] }),
    getClientById: builder.query({ query: (id) => `/clients/${id}`, transformResponse: (response: any) => response?.data || response, providesTags: ['Clients'] }),
    createClient: builder.mutation({ query: (body) => ({ url: '/clients', method: 'POST', body }), invalidatesTags: ['Clients'] }),
    updateClient: builder.mutation({ query: ({ id, ...body }) => ({ url: `/clients/${id}`, method: 'PUT', body }), invalidatesTags: ['Clients'] }),
    deleteClient: builder.mutation({ query: (id) => ({ url: `/clients/${id}`, method: 'DELETE' }), invalidatesTags: ['Clients'] }),
    createClientProject: builder.mutation({
      query: ({ clientId, ...body }) => ({ url: `/clients/${clientId}/projects`, method: 'POST', body }),
      invalidatesTags: ['Clients'],
    }),
    updateClientProject: builder.mutation({
      query: ({ clientId, projectId, ...body }) => ({ url: `/clients/${clientId}/projects/${projectId}`, method: 'PUT', body }),
      invalidatesTags: ['Clients'],
    }),
    getClientStats: builder.query({ query: () => '/clients/stats', transformResponse: (response: any) => response?.data || response, providesTags: ['Clients'] }),

    // Meeting Schedule
    setupMeeting: builder.mutation({
      query: (body) => ({ url: '/meetingschedule/setup', method: 'POST', body }),
      invalidatesTags: ['Meetings'],
    }),
    sendMeetingToClient: builder.mutation({
      query: (meetingId) => ({ url: `/meetingschedule/send/${meetingId}`, method: 'POST' }),
      invalidatesTags: ['Meetings'],
    }),
    clientRespondMeeting: builder.mutation({
      query: ({ meetingId, response }) => ({ url: `/meetingschedule/client-respond/${meetingId}`, method: 'POST', body: { response } }),
      invalidatesTags: ['Meetings'],
    }),
    getMeetingDetail: builder.query({
      query: (meetingId) => `/meetingschedule/${meetingId}`,
      providesTags: ['Meetings'],
    }),

    // Attendance
    checkIn: builder.mutation({
      query: (body) => ({ url: '/attendance/check-in', method: 'POST', body }),
      invalidatesTags: ['Attendance'],
    }),
    checkOut: builder.mutation({
      query: (body) => ({ url: '/attendance/check-out', method: 'POST', body }),
      invalidatesTags: ['Attendance'],
    }),
    manualAttendance: builder.mutation({
      query: (body) => ({ url: '/attendance/manual', method: 'POST', body }),
      invalidatesTags: ['Attendance'],
    }),
    getAttendance: builder.query({
      query: ({ userId, startDate, endDate }) => ({
        url: '/attendance',
        params: { userId, startDate, endDate },
      }),
      transformResponse: (response: any) => {
        const data = response?.data || response;
        if (!Array.isArray(data)) return data;
        return data.map((r: any) => ({
          id: r.id,
          userId: r.userId,
          date: r.date,
          checkIn: r.checkInTime,
          checkOut: r.checkOutTime,
          checkInLocation: r.checkInLocation,
          checkOutLocation: r.checkOutLocation,
          hours: r.hoursWorked,
          status: r.status?.toLowerCase() || 'present',
          faceVerified: r.faceVerifiedCheckIn || r.faceVerifiedCheckOut || false,
          faceDistance: r.faceDistanceCheckIn || r.faceDistanceCheckOut,
        }));
      },
      providesTags: ['Attendance'],
    }),
    getAttendanceStats: builder.query({
      query: ({ userId, month }) => ({
        url: '/attendance/stats',
        params: { userId, month },
      }),
    }),
    getTeamAttendance: builder.query({
      query: ({ date }) => ({
        url: '/attendance/team',
        params: { date },
      }),
    }),

    // Face Enrolment
    getFaceEnrolments: builder.query({
      query: () => '/face-enrolment',
      providesTags: ['Users'],
    }),
    enrolFace: builder.mutation({
      query: (body) => ({ url: '/face-enrolment', method: 'POST', body }),
      invalidatesTags: ['Users'],
    }),
    updateFaceEnrolment: builder.mutation({
      query: ({ userId, faceDescriptor }) => ({
        url: `/face-enrolment/${userId}`,
        method: 'PUT',
        body: { faceDescriptor },
      }),
      invalidatesTags: ['Users'],
    }),
    removeFaceEnrolment: builder.mutation({
      query: (userId) => ({ url: `/face-enrolment/${userId}`, method: 'DELETE' }),
      invalidatesTags: ['Users'],
    }),
    verifyFaceEnrolment: builder.query({
      query: (userId) => `/face-enrolment/${userId}/verify`,
    }),

    // Roles
    getRoles: builder.query({
      query: () => '/roles',
      transformResponse: (response: any) => response?.data || response,
      providesTags: ['Roles'],
    }),
    getRoleById: builder.query({
      query: (id) => `/roles/${id}`,
      transformResponse: (response: any) => response?.data || response,
      providesTags: ['Roles'],
    }),
    createRole: builder.mutation({
      query: (role) => ({ url: '/roles', method: 'POST', body: role }),
      invalidatesTags: ['Roles'],
    }),
    updateRole: builder.mutation({
      query: ({ id, ...role }) => ({ url: `/roles/${id}`, method: 'PUT', body: role }),
      invalidatesTags: ['Roles'],
    }),
    deleteRole: builder.mutation({
      query: (id) => ({ url: `/roles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Roles'],
    }),

    // Permissions
    getPermissions: builder.query({
      query: () => '/permissions',
      transformResponse: (response: any) => response?.data || response,
      providesTags: ['Permissions'],
    }),
    getPermissionById: builder.query({
      query: (id) => `/permissions/${id}`,
      transformResponse: (response: any) => response?.data || response,
      providesTags: ['Permissions'],
    }),
    createPermission: builder.mutation({
      query: (permission) => ({ url: '/permissions', method: 'POST', body: permission }),
      invalidatesTags: ['Permissions'],
    }),
    updatePermission: builder.mutation({
      query: ({ id, ...permission }) => ({ url: `/permissions/${id}`, method: 'PUT', body: permission }),
      invalidatesTags: ['Permissions'],
    }),
    deletePermission: builder.mutation({
      query: (id) => ({ url: `/permissions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Permissions'],
    }),

    // Role-Permission Assignments
    getRolePermissions: builder.query({
      query: (roleId) => `/roles/${roleId}/permissions`,
      transformResponse: (response: any) => {
        const data = response?.data || response;
        if (data?.permissionIds && data?.roleId) {
          return { [data.roleId]: data.permissionIds };
        }
        return data;
      },
      providesTags: ['Roles'],
    }),
    assignPermissionToRole: builder.mutation({
      query: ({ roleId, permissionId }) => ({
        url: `/roles/${roleId}/permissions`,
        method: 'POST',
        body: { permissionId },
      }),
      invalidatesTags: ['Roles'],
    }),
    removePermissionFromRole: builder.mutation({
      query: ({ roleId, permissionId }) => ({
        url: `/roles/${roleId}/permissions/${permissionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Roles'],
    }),
    bulkAssignPermissions: builder.mutation({
      query: ({ roleId, permissionIds }) => ({
        url: `/roles/${roleId}/permissions/bulk`,
        method: 'POST',
        body: { permissionIds },
      }),
      invalidatesTags: ['Roles'],
    }),
    bulkRemovePermissions: builder.mutation({
      query: ({ roleId, permissionIds }) => ({
        url: `/roles/${roleId}/permissions/bulk`,
        method: 'DELETE',
        body: { permissionIds },
      }),
      invalidatesTags: ['Roles'],
    }),

    // User-Role Assignments
    getUserRoles: builder.query({
      query: (userId) => `/users/${userId}/roles`,
      providesTags: ['Users'],
    }),
    assignRoleToUser: builder.mutation({
      query: ({ userId, roleId }) => ({
        url: `/users/${userId}/roles`,
        method: 'POST',
        body: { roleId },
      }),
      invalidatesTags: ['Users'],
    }),
    removeRoleFromUser: builder.mutation({
      query: ({ userId, roleId }) => ({
        url: `/users/${userId}/roles/${roleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),

    // System Config
    getSystemConfig: builder.query({
      query: () => '/system-config',
      providesTags: ['SystemConfig'],
    }),
    updateSystemConfig: builder.mutation({
      query: (config) => ({ url: '/system-config', method: 'PUT', body: config }),
      invalidatesTags: ['SystemConfig'],
    }),
  }),
});

export const {
  useLoginMutation,
  useFaceLoginMutation,
  useRegisterMutation,
  useGetLeadsQuery, useGetLeadByIdQuery, useCreateLeadMutation, useUpdateLeadMutation, useDeleteLeadMutation,
  useUpdateLeadStatusMutation, useAssignLeadMutation, useBulkAssignLeadsMutation, useGetLeadStatsQuery,
  useGetFollowUpsQuery, useGetFollowUpByIdQuery, useCreateFollowUpMutation, useUpdateFollowUpMutation,
  useCompleteFollowUpMutation, useCancelFollowUpMutation, useGetOverdueFollowUpsQuery,
  useGetMeetingsQuery, useGetMeetingByIdQuery, useCreateMeetingMutation, useUpdateMeetingMutation,
  useCancelMeetingMutation, useCompleteMeetingMutation,
  useGetNotificationsQuery, useGetUnreadCountQuery, useMarkAsReadMutation, useMarkAllAsReadMutation,
  useGetUsersQuery, useGetUserByIdQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation,
  useGetDashboardStatsQuery, useGetLeadsByStatusReportQuery, useGetConversionReportQuery, useGetPerformanceReportQuery,
  useGetFollowUpReportQuery, useGetMeetingReportQuery, useGetAttendanceReportQuery, useGetClientReportQuery, useGetUserEntryReportQuery,
  useExportLeadsToExcelMutation, useExportLeadsToPdfMutation, useExportPerformanceToPdfMutation,
  useExportFollowUpsToExcelMutation, useExportFollowUpsToPdfMutation,
  useExportMeetingsToExcelMutation, useExportMeetingsToPdfMutation,
  useExportAttendanceToExcelMutation, useExportAttendanceToPdfMutation,
  useExportClientsToExcelMutation, useExportClientsToPdfMutation,
  useExportUsersToExcelMutation, useExportUsersToPdfMutation,
  useGetAuditLogsQuery,
  useSearchAiLeadsMutation, useGetAiLeadRequestsQuery, useGetAiLeadRequestByIdQuery, useConfirmAiLeadMutation,
  useGetClientsQuery, useGetClientByIdQuery, useCreateClientMutation, useUpdateClientMutation, useDeleteClientMutation, useCreateClientProjectMutation, useUpdateClientProjectMutation, useGetClientStatsQuery,
  useSetupMeetingMutation, useSendMeetingToClientMutation, useClientRespondMeetingMutation,
  useGetLeadMeetingsQuery, useGetMeetingDetailQuery,
  useCheckInMutation, useCheckOutMutation, useManualAttendanceMutation, useGetAttendanceQuery, useGetAttendanceStatsQuery, useGetTeamAttendanceQuery,
  useGetFaceEnrolmentsQuery, useEnrolFaceMutation, useUpdateFaceEnrolmentMutation, useRemoveFaceEnrolmentMutation, useVerifyFaceEnrolmentQuery,
  useGetRolesQuery, useGetRoleByIdQuery, useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation,
  useGetPermissionsQuery, useGetPermissionByIdQuery, useCreatePermissionMutation, useUpdatePermissionMutation, useDeletePermissionMutation,
  useGetRolePermissionsQuery, useAssignPermissionToRoleMutation, useRemovePermissionFromRoleMutation,
  useBulkAssignPermissionsMutation, useBulkRemovePermissionsMutation,
  useGetUserRolesQuery, useAssignRoleToUserMutation, useRemoveRoleFromUserMutation,
  useGetSystemConfigQuery, useUpdateSystemConfigMutation,
} = api;
