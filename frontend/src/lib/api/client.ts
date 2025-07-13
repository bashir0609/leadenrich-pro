import axios, { AxiosInstance } from 'axios';
import toast from 'react-hot-toast';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available (only on client side)
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const message = error.response.data?.error?.message || 'An error occurred';
          toast.error(message);
        } else if (error.request) {
          toast.error('Network error. Please check your connection.');
        } else {
          toast.error('An unexpected error occurred.');
        }
        return Promise.reject(error);
      }
    );
  }

  // Provider methods
  async getProviders() {
    const response = await this.client.get('/api/providers');
    return response.data;
  }

  async testProvider(providerId: string) {
    const response = await this.client.post(`/api/providers/${providerId}/test`);
    return response.data;
  }

  async executeProvider(providerId: string, data: any) {
    const response = await this.client.post(`/api/providers/${providerId}/execute`, data);
    return response.data;
  }

  async createBulkJob(providerId: string, data: any) {
    const response = await this.client.post(`/api/providers/${providerId}/bulk`, data);
    return response.data;
  }

  // Job methods
  async getJobStatus(jobId: string) {
    const response = await this.client.get(`/api/jobs/${jobId}`);
    return response.data;
  }

  async getJobLogs(jobId: string) {
    const response = await this.client.get(`/api/jobs/${jobId}/logs`);
    return response.data;
  }

  // Health check
  async checkHealth() {
    const response = await this.client.get('/health/detailed');
    return response.data;
  }
}

export const apiClient = new ApiClient();