import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from './client';

export const useProviders = () => {
  return useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching providers...');
        const response = await apiClient.getProviders();
        console.log('📦 Raw API response:', response);
        console.log('📦 Response type:', typeof response);
        console.log('📦 Response keys:', Object.keys(response || {}));
        
        // Check for different response formats
        if (response && response.success && response.data) {
          console.log('✅ Found success + data format');
          console.log('✅ Data:', response.data);
          console.log('✅ Data type:', typeof response.data);
          console.log('✅ Is array:', Array.isArray(response.data));
          return response.data;
        }
        
        if (Array.isArray(response)) {
          console.log('✅ Found direct array format');
          return response;
        }
        
        if (response && response.providers) {
          console.log('✅ Found providers property format');
          return response.providers;
        }
        
        console.error('❌ Unexpected response format:', response);
        console.error('❌ Response constructor:', response?.constructor?.name);
        throw new Error(`Invalid response format: ${JSON.stringify(response)}`);
      } catch (error) {
        if (error instanceof Error) {
          // Inside this block, TypeScript knows 'error' is an Error object.
          console.error('❌ Error in queryFn:', error);
          console.error('❌ Error type:', error.constructor.name);
          console.error('❌ Error message:', error.message);
        } else {
          // Handle cases where a non-Error object was thrown.
          console.error('❌ An unknown error was thrown in queryFn:', error);
        }
        throw error;
      }
    },
    retry: false, // Disable retry for debugging
    staleTime: 0, // Always fresh for debugging
  });
};

export const useTestProvider = () => {
  return useMutation({
    mutationFn: async (providerId: string) => {
      const response = await apiClient.testProvider(providerId);
      return response.data;
    },
  });
};

export const useExecuteProvider = () => {
  return useMutation({
    mutationFn: async ({ providerId, operation, params, options }: {
      providerId: string;
      operation: string;
      params: any;
      options?: any;
    }) => {
      const response = await apiClient.executeProvider(providerId, {
        operation,
        params,
        ...(options !== undefined && { options }),
      });
      return response;
    },
  });
};

export const useCreateBulkJob = () => {
  return useMutation({
    mutationFn: async ({ providerId, data }: { providerId: string; data: any }) => {
      const response = await apiClient.post(`/api/providers/${providerId}/bulk`, data);
      return response;
    },
  });
};
