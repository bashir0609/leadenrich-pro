// frontend/src/lib/api/client.ts
import axios, { AxiosInstance } from 'axios';
import toast from 'react-hot-toast';

class ApiClient {
  private client: AxiosInstance;
  static client: any;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available (use a different method to get token)
        const token = typeof window !== 'undefined' 
          ? window.localStorage.getItem('auth_token') 
          : null;
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
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
        console.error('API Error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });

        if (error.response) {
          const message = error.response.data?.error?.message 
            || error.response.data?.message 
            || 'An error occurred';
          
          // More detailed error handling
          switch (error.response.status) {
            case 400:
              toast.error(`Bad Request: ${message}`);
              break;
            case 401:
              toast.error('Unauthorized. Please log in again.');
              // Potentially trigger logout logic
              break;
            case 403:
              toast.error('You do not have permission to perform this action.');
              break;
            case 404:
              toast.error('Requested resource not found.');
              break;
            case 500:
              toast.error('Server error. Please try again later.');
              break;
            default:
              toast.error(message);
          }
        } else if (error.request) {
          toast.error('Network error. Please check your connection.');
        } else {
          toast.error('An unexpected error occurred.');
        }
        return Promise.reject(error);
      }
    );
  }

  // Add post method
  async post<T = any>(url: string, data: any): Promise<T> {
    try {
      const response = await this.client.post(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Add get method
  async get<T = any>(url: string, params?: any): Promise<T> {
    try {
      const response = await this.client.get(url, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
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

  async executeProvider(providerId: string, data: { operation: string; params: any }) {
    console.log('Execute Provider Request:', {
      providerId,
      data
    });

    try {
      const response = await this.client.post(`/api/providers/${providerId}/execute`, data);
      return response.data;
    } catch (error) {
      const err = error as any;
      console.error('Execute Provider Error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      throw error;
    }
  }
}

export const useCreateBulkJob = () => {
  return useMutation({
    async createBulkJob(providerId: string, data: any) {
      return ApiClient.client.post(`/api/providers/${providerId}/bulk`, data).then((res: any) => res.data);
    },

    async getJobStatus(jobId: string) {
      return ApiClient.client.get(`/api/jobs/${jobId}`).then((res: any) => res.data);
    },

    async getJobLogs(jobId: string) {
      return ApiClient.client.get(`/api/jobs/${jobId}/logs`).then((res: any) => res.data);
    },

    async checkHealth() {
      return ApiClient.client.get('/health/detailed').then((res: any) => res.data);
    }
  });
};

function useMutation(arg0: {
    createBulkJob(providerId: string, data: any): Promise<any>;
    // Job methods
    getJobStatus(jobId: string): Promise<any>;
    getJobLogs(jobId: string): Promise<any>;
    // Health check
    checkHealth(): Promise<any>;
  }) {
    throw new Error('Function not implemented.');
  }

export const apiClient = new ApiClient();