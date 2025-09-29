import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' 
  : 'http://localhost:3000';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
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

    // Handle token expiration
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async getActiveCalls() {
    const response = await this.api.get('/active-calls');
    return response.data;
  }

  async getAllNotes() {
    const response = await this.api.get('/all-notes');
    return response.data;
  }

  async getCallNotes(callSid) {
    const response = await this.api.get(`/call-notes/${callSid}`);
    return response.data;
  }

  async endCall(callSid) {
    const response = await this.api.post(`/end-call/${callSid}`);
    return response.data;
  }

  async getAudioFiles() {
    const response = await this.api.get('/audio-files');
    return response.data;
  }

  async downloadAudio(callSid) {
    try {
      // First check if the file exists and is accessible using axios
      await this.api.head(`/download-audio/${callSid}`);

      // Get token for direct fetch
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Construct the full URL
      const baseURL = this.api.defaults.baseURL || API_BASE_URL;
      const downloadUrl = `${baseURL}/download-audio/${callSid}`;

      console.log('Downloading from URL:', downloadUrl);

      // Use fetch with proper error handling
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Download response status:', response.status);
      console.log('Download response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          throw new Error('Authentication failed');
        }
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Check if we got the right content type
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('audio')) {
        console.error('Unexpected content type:', contentType);
        throw new Error('Received unexpected file type instead of audio');
      }

      // Get the blob data
      const blob = await response.blob();
      console.log('Downloaded blob size:', blob.size, 'type:', blob.type);

      // Get filename from response headers or create default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `call_${callSid}.wav`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log('Download completed successfully:', filename);
      return { success: true, filename };
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();