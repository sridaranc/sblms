import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL_WITH_PATH } from '../config';

const API_BASE_URL = API_URL_WITH_PATH;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      try {
        const { store } = require('../store');
        const { logout } = require('../store/slices/authSlice');
        store.dispatch(logout());
      } catch (e) {
        console.warn('Store not available for logout');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  faceLogin: (faceDescriptor: number[]) => api.post('/auth/face-login', { faceDescriptor, threshold: 0.6 }),
  getMe: () => api.get('/users/me'),
};

export const leadsAPI = {
  getAll: (params?: any) => api.get('/leads', { params }),
  getById: (id: string) => api.get(`/leads/${id}`),
  create: (data: any) => api.post('/leads', data),
  update: (id: string, data: any) => api.put(`/leads/${id}`, data),
  delete: (id: string) => api.delete(`/leads/${id}`),
  updateStatus: (id: string, status: string) => api.put(`/leads/${id}/status`, { status }),
  getStats: () => api.get('/leads/statistics'),
};

export const followUpsAPI = {
  getAll: (params?: any) => api.get('/followups', { params }),
  getById: (id: string) => api.get(`/followups/${id}`),
  create: (data: any) => api.post('/followups', data),
  update: (id: string, data: any) => api.put(`/followups/${id}`, data),
  complete: (id: string, notes: string) => api.put(`/followups/${id}/complete`, { notes }),
  cancel: (id: string, reason: string) => api.put(`/followups/${id}/cancel`, { reason }),
  getOverdue: () => api.get('/followups/overdue'),
};

export const meetingsAPI = {
  getAll: (params?: any) => api.get('/meetings', { params }),
  getById: (id: string) => api.get(`/meetings/${id}`),
  create: (data: any) => api.post('/meetingschedule/setup', data),
  update: (id: string, data: any) => api.put(`/meetings/${id}`, data),
  cancel: (id: string, reason: string) => api.put(`/meetings/${id}/cancel`, { reason }),
  complete: (id: string, notes: string, outcome: string) => api.put(`/meetings/${id}/complete`, { notes, outcome }),
  sendToClient: (meetingId: string) => api.post(`/meetingschedule/send/${meetingId}`),
  getByLead: (leadId: string) => api.get(`/meetingschedule/lead/${leadId}`),
};

export const notificationsAPI = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const clientsAPI = {
  getAll: (params?: any) => api.get('/clients', { params }),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  getStats: () => api.get('/clients/stats'),
  addProject: (clientId: string, data: any) => api.post(`/clients/${clientId}/projects`, data),
};

export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getLeadsByStatus: () => api.get('/reports/leads-by-status'),
  getConversion: (params?: any) => api.get('/reports/conversion', { params }),
  getPerformance: (params?: any) => api.get('/reports/performance', { params }),
};

export const aiLeadsAPI = {
  search: (data: any) => api.post('/aileads/search', data),
  getRequests: (params?: any) => api.get('/aileads/requests', { params }),
  getRequestById: (id: string) => api.get(`/aileads/requests/${id}`),
  confirmLead: (resultId: string) => api.post(`/aileads/confirm/${resultId}`),
};

export const meetingScheduleAPI = {
  schedule: (data: any) => api.post('/meetings', data),
  getByLead: (leadId: string) => api.get(`/meetings/lead/${leadId}`),
};

export const usersAPI = {
  getMe: () => api.get('/users/me'),
  getAll: (params?: any) => api.get('/users/paginated', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  changePassword: (id: string, data: any) => api.put(`/users/${id}/change-password`, data),
  getRoles: () => api.get('/roles'),
  assignRole: (userId: string, roleId: string) => api.post(`/users/${userId}/roles`, { roleId }),
  removeRole: (userId: string, roleId: string) => api.delete(`/users/${userId}/roles/${roleId}`),
};

export const attendanceAPI = {
  checkIn: (data: any) => api.post('/attendance/check-in', data),
  checkOut: (data: any) => api.post('/attendance/check-out', data),
  manualEntry: (data: any) => api.post('/attendance/manual', data),
  getAttendance: async (params: any) => {
    const res = await api.get('/attendance', { params });
    // Transform API response to match frontend interface
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      res.data.data = data.map((r: any) => ({
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
    }
    return res;
  },
  getStats: (params: any) => api.get('/attendance/stats', { params }),
  getTeamAttendance: (date: string) => api.get('/attendance/team', { params: { date } }),
};

export const faceEnrolmentAPI = {
  getAll: () => api.get('/face-enrolment'),
  getByUserId: (userId: string) => api.get(`/face-enrolment/${userId}`),
  enrol: (data: { userId: string; imageBase64: string; notes?: string }) =>
    api.post('/face-enrolment/enrol-image', data),
  update: (userId: string, data: { imageBase64: string; notes?: string }) =>
    api.put(`/face-enrolment/${userId}/update-image`, data),
  remove: (userId: string) => api.delete(`/face-enrolment/${userId}`),
  verify: (userId: string) => api.get(`/face-enrolment/${userId}/verify`),
};

export default api;
