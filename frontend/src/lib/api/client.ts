const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseURL: string;
  private getToken: () => string | null;

  constructor() {
    this.baseURL = BASE_URL;
    this.getToken = () => {
      // This ensures we can run this code on the server (during build) without errors.
      if (typeof window !== 'undefined') {
        return localStorage.getItem('authToken');
      }
      return null;
    };
    console.log('API Client initialized with URL:', this.baseURL);
  }

  private async request(url: string, options: RequestInit) {
    const token = this.getToken();
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    // --- THE CRITICAL FIX IS HERE ---
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseURL}${url}`, {
      ...options,
      headers,
    });

    if (response.status === 204) {
        return { success: true, data: null };
    }

    const responseData = await response.json();

    if (!response.ok) {
        // Use the error structure from the backend
        throw new Error(responseData.error?.message || `HTTP error! status: ${response.status}`);
    }
    
    return responseData;
  }

  async get(url: string, options?: RequestInit) {
    console.log('🌐 Making GET request to:', url);
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url: string, data?: any, options?: RequestInit) {
    return this.request(url, { ...options, method: 'POST', body: data ? JSON.stringify(data) : undefined });
  }

  async put(url: string, data?: any, options?: RequestInit) {
    return this.request(url, { ...options, method: 'PUT', body: data ? JSON.stringify(data) : undefined });
  }

  async delete(url: string, options?: RequestInit) {
    return this.request(url, { ...options, method: 'DELETE' });
  }
  
  // Your specific methods can now be simpler
  async getJobs() {
    console.log('2. [apiClient] getJobs() method called.');
    const response = this.get(`/api/jobs`);
    console.log('3. [apiClient] get(/api/jobs) promise returned.');
    return response;
  }
  async getJobStatus(jobId: string) { return this.get(`/api/jobs/${jobId}`); }
  async getProviders() { return this.get('/api/providers'); }
  async testProvider(providerId: string) { return this.post(`/api/providers/${providerId}/test`); }
  async executeProvider(providerId: string, data: any) { return this.post(`/api/providers/${providerId}/execute`, data); }
}

export const apiClient = new ApiClient();
export default apiClient;