// frontend/src/lib/api/providers.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from './client';
import { Provider } from '@/types';
import axios from 'axios';

export const useProviders = () => {
  return useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const response = await apiClient.getProviders();
      return response.data as Provider[];
    },
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

// Create a bulk enrichment job for a provider
export const useCreateBulkJob = () => {
  return useMutation({
    mutationFn: async ({ providerId, data }: { providerId: string; data: any }) => {
      const response = await apiClient.post(`/api/providers/${providerId}/bulk`, data);
      return response;
    },
  });
};