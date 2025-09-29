import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' 
  : 'http://localhost:3000';

class AuthService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/auth`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if available
    this.api.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle token expiration
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.removeToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token) {
    this.token = token;
  }

  getToken() {
    return this.token || localStorage.getItem('token');
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async login(credentials) {
    const response = await this.api.post('/login', credentials);
    return response.data;
  }

  async register(userData) {
    const response = await this.api.post('/register', userData);
    return response.data;
  }

  async getProfile() {
    const response = await this.api.get('/me');
    return response.data;
  }

  async updateProfile(userData) {
    const response = await this.api.put('/me', userData);
    return response.data;
  }

  async changePassword(passwordData) {
    const response = await this.api.put('/change-password', passwordData);
    return response.data;
  }
}

export const authService = new AuthService();