import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface DashboardStats {
  providers: {
    total: number;
    active: number;
  };
  jobs: {
    recent: number;
    total: Record<string, number>;
    recentJobs: Array<{
      id: string;
      status: string;
      provider: string;
      createdAt: string;
      totalRecords: number;
      processedRecords: number;
    }>;
  };
  credits: {
    remaining: number;
    used: number;
    total: number;
    thisMonth?: number;
  };
}

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    try {
      console.log('🔍 Dashboard API: Starting request...');
      
      // Check if auth token exists
      const token = localStorage.getItem('authToken');
      console.log('🔑 Auth token exists:', !!token);
      
      const response = await apiClient.get('/api/dashboard/stats');
      console.log('📊 Dashboard API response:', response);
      
      if (!response || !response.data) {
        throw new Error('No data received from dashboard API');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Dashboard API error:', error);
      throw error;
    }
  },
};

// React Query hook for dashboard stats
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
