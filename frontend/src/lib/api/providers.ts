import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from './client';
import { Provider } from '@/types';

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
    mutationFn: async ({ providerId, data }: { providerId: string; data: any }) => {
      const response = await apiClient.executeProvider(providerId, data);
      return response;
    },
  });
};

export const useCreateBulkJob = () => {
  return useMutation({
    mutationFn: async ({ providerId, data }: { providerId: string; data: any }) => {
      const response = await apiClient.createBulkJob(providerId, data);
      return response.data;
    },
  });
};