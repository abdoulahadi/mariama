// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Créer une instance axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token à chaque requête
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

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getPermissions: () => api.get('/auth/permissions'),
  refreshPermissions: () => api.post('/auth/refresh-permissions')
};

// Users endpoints
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  listUsers: () => api.get('/users'),
  updateUser: (id, data) => api.put(`/users/${id}`, data)
};

// Resources endpoints
export const resourcesAPI = {
  create: (data) => api.post('/resources', data),
  list: () => api.get('/resources'),
  get: (id) => api.get(`/resources/${id}`),
  update: (id, data) => api.put(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`)
};

// Dashboard endpoints
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getAuditLogs: (params) => api.get('/dashboard/audit-logs', { params })
};

export default api;
