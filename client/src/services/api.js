import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  getMe: () => api.get('/users/me'),
};

export const reportsAPI = {
  upload: (formData) => api.post('/reports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.date) params.append('date', filters.date);
    if (filters.reportType) params.append('reportType', filters.reportType);
    if (filters.vitalType) params.append('vitalType', filters.vitalType);
    return api.get(`/reports?${params.toString()}`);
  },
  getShared: () => api.get('/reports/shared'),
  getById: (id) => api.get(`/reports/${id}`),
  download: (id) => api.get(`/reports/${id}/download`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/reports/${id}`),
};

export const vitalsAPI = {
  create: (vitalsData) => api.post('/vitals', vitalsData),
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.vitalType) params.append('vitalType', filters.vitalType);
    return api.get(`/vitals?${params.toString()}`);
  },
  getTrends: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.vitalType) params.append('vitalType', filters.vitalType);
    return api.get(`/vitals/trends?${params.toString()}`);
  },
  update: (id, vitalsData) => api.put(`/vitals/${id}`, vitalsData),
  delete: (id) => api.delete(`/vitals/${id}`),
};

export const sharesAPI = {
  share: (reportId, shareData) => api.post(`/shares/${reportId}`, shareData),
  getReportShares: (reportId) => api.get(`/shares/report/${reportId}`),
  getSharedWithMe: () => api.get('/shares/shared-with-me'),
  revoke: (shareId) => api.delete(`/shares/${shareId}`),
};

export default api;

