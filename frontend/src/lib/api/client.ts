// frontend/src/lib/api/client.ts
import axios, { AxiosInstance } from 'axios';
import toast from 'react-hot-toast';

// Replace the entire ApiClient class in frontend/src/lib/api/client.ts

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.error?.message || 'An error occurred';
        toast.error(message);
        return Promise.reject(error);
      }
    );
  }
  
  // vvv THIS METHOD WAS MISSING vvv
  async post<T = any>(url: string, data: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }
  // ^^^ END OF MISSING METHOD ^^^

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
    const response = await this.post(`/api/providers/${providerId}/execute`, data);
    return response;
  }

  async createBulkJob(providerId: string, data: any) {
    const response = await this.post(`/api/providers/${providerId}/bulk`, data);
    return response;
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
}

export const apiClient = new ApiClient();