import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' 
  : 'http://localhost:3000';

class AdminService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/admin`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle token expiration and admin access
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (error.response?.status === 403) {
          // Access denied - redirect to main dashboard
          window.location.href = '/dashboard';
        }
        return Promise.reject(error);
      }
    );
  }

  async getStats() {
    const response = await this.api.get('/stats');
    return response.data;
  }

  async getUsers(params = {}) {
    const response = await this.api.get('/users', { params });
    return response.data;
  }

  async getUser(userId) {
    const response = await this.api.get(`/users/${userId}`);
    return response.data;
  }

  async updateUser(userId, userData) {
    const response = await this.api.put(`/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId) {
    const response = await this.api.delete(`/users/${userId}`);
    return response.data;
  }

  async getCalls(params = {}) {
    const response = await this.api.get('/calls', { params });
    return response.data;
  }

  async getLogs() {
    const response = await this.api.get('/logs');
    return response.data;
  }

  async bulkUserOperation(action, userIds) {
    const response = await this.api.post('/users/bulk', { action, userIds });
    return response.data;
  }

  // System Settings API methods
  async getSystemSettings() {
    const response = await this.api.get('/settings');
    return response.data;
  }

  async getSystemSetting(settingName) {
    const response = await this.api.get(`/settings/${settingName}`);
    return response.data;
  }

  async updateSystemSetting(settingName, value, description = '') {
    const response = await this.api.put(`/settings/${settingName}`, {
      value,
      description
    });
    return response.data;
  }

  async toggleRegistration() {
    const response = await this.api.post('/settings/registration/toggle');
    return response.data;
  }
}

export const adminService = new AdminService();