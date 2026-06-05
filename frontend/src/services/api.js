import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        Cookies.remove('token', { path: '/' });
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(data);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/current'),
  changePassword: (data) => api.put('/auth/password', data),
};

export const userAPI = {
  list: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updateStatus: (id, data) => api.put(`/users/${id}/status`, data),
  resetPassword: (id) => api.put(`/users/${id}/reset-password`),
  approve: (id) => api.put(`/users/${id}/approve`),
  getMyAuditLogs: (params) => api.get('/users/me/audit-logs', { params }),
};

export const departmentAPI = {
  getTree: () => api.get('/departments/tree'),
  list: (params) => api.get('/departments', { params }),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

export const assetAPI = {
  list: (params) => api.get('/assets', { params }),
  getById: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets', data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  delete: (id) => api.delete(`/assets/${id}`),
  getTypes: () => api.get('/assets/types'),
  createType: (data) => api.post('/assets/types', data),
  deleteType: (id) => api.delete(`/assets/types/${id}`),
  deleteAll: () => api.delete('/assets/batch/all'),
  approve: (id) => api.put(`/assets/${id}/approve`),
  reject: (id, data) => api.put(`/assets/${id}/reject`, data),
  confirmDelete: (id) => api.put(`/assets/${id}/confirm-delete`),
  rejectDelete: (id, data) => api.put(`/assets/${id}/reject-delete`, data),
  import: (formData) => api.post('/assets/import', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000 }),
  getQRCode: (id) => api.get(`/assets/${id}/qrcode`),
  getLoans: (params) => api.get('/assets/loans/list', { params }),
  createLoan: (data) => api.post('/assets/loans', data),
  approveLoan: (id, data) => api.put(`/assets/loans/${id}/approve`, data),
  withdrawLoan: (id) => api.put(`/assets/loans/${id}/withdraw`),
  batchApproveLoans: (data) => api.post('/assets/loans/batch-approve', data),
  scanConfirmLoan: (data) => api.post('/assets/loans/scan-confirm', data),
  scanReturn: (data) => api.post('/assets/loans/scan-return', data),
};

export const purchaseAPI = {
  list: (params) => api.get('/purchases', { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  deptAudit: (id, data) => api.put(`/purchases/${id}/dept-audit`, data),
  superAudit: (id, data) => api.put(`/purchases/${id}/super-audit`, data),
  withdraw: (id) => api.put(`/purchases/${id}/withdraw`),
  batchAudit: (data) => api.post('/purchases/batch-audit', data),
};

export const repairAPI = {
  list: (params) => api.get('/repairs', { params }),
  create: (data) => api.post('/repairs', data),
  audit: (id, data) => api.put(`/repairs/${id}/audit`, data),
  startRepair: (id, data) => api.put(`/repairs/${id}/start-repair`, data),
  completeRepair: (id, data) => api.put(`/repairs/${id}/complete-repair`, data),
  acceptance: (id, data) => api.put(`/repairs/${id}/acceptance`, data),
  withdraw: (id) => api.put(`/repairs/${id}/withdraw`),
  batchAudit: (data) => api.post('/repairs/batch-audit', data),
};

export const systemAPI = {
  getAuditLogs: (params) => api.get('/system/audit-logs', { params }),
  getNotifications: (params) => api.get('/system/notifications', { params }),
  markNotificationRead: (id) => api.put(`/system/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/system/notifications/read-all'),
  getSystemConfigs: () => api.get('/system/system-configs'),
  updateSystemConfigs: (data) => api.put('/system/system-configs', data),
  createBackup: () => api.post('/system/backups'),
  getBackups: (params) => api.get('/system/backups', { params }),
  restoreBackup: (id) => api.post(`/system/backups/${id}/restore`),
  getStatistics: () => api.get('/system/statistics'),
};

export const rejectionAPI = {
  getUnread: () => api.get('/rejections/unread'),
  markRead: (id) => api.put(`/rejections/${id}/read`),
  markAllRead: () => api.put('/rejections/read-all'),
};

export const roleUpgradeAPI = {
  getTargets: () => api.get('/role-upgrade/targets'),
  getMyRequests: (params) => api.get('/role-upgrade/my', { params }),
  createRequest: (data) => api.post('/role-upgrade', data),
  cancelRequest: (id) => api.delete(`/role-upgrade/${id}`),
  getAllRequests: (params) => api.get('/role-upgrade/all', { params }),
  approveRequest: (id, data) => api.put(`/role-upgrade/${id}/approve`, data),
  rejectRequest: (id, data) => api.put(`/role-upgrade/${id}/reject`, data),
};

export default api;
