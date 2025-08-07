// src/lib/api/keys.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client'; // Assuming you have a central api client
import toast from 'react-hot-toast';

// == TYPES ==
export interface ApiKey {
  id: number;
  label: string;
  isActive: boolean;
  createdAt: string;
}

// == QUERIES (Fetching Data) ==

// Hook to get all API keys for a specific provider
export const useApiKeys = (providerId: number) => {
  return useQuery<ApiKey[]>({
    queryKey: ['apiKeys', providerId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/providers/${providerId}/keys`);
      console.log('API Response:', response);
      return response.data;
    },
    enabled: !!providerId, // Only run the query if providerId is available
  });
};


// == MUTATIONS (Changing Data) ==

// Hook to add a new API key
export const useAddApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ providerId, label, apiKey }: { providerId: number; label: string; apiKey: string }) => {
      const response = await apiClient.post(`/api/providers/${providerId}/keys`, { label, apiKey });
      return response.data;
    },
    onSuccess: (data) => {
      // When a key is added, refetch the list of keys for that provider
      queryClient.invalidateQueries({ queryKey: ['apiKeys', data.providerId] });
      toast.success('API Key added successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to add API key.');
    },
  });
};

// Hook to set an API key as active
export const useSetActiveApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ providerId, keyId }: { providerId: number; keyId: number }) => {
      const response = await apiClient.put(`/api/providers/${providerId}/keys/${keyId}/activate`);
      return response.data;
    },
    onSuccess: (data) => {
      // Refetch the list of keys to show the new active key
      queryClient.invalidateQueries({ queryKey: ['apiKeys', data.providerId] });
      toast.success('Active key updated!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update active key.');
    },
  });
};

// Hook to delete an API key
export const useDeleteApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ providerId, keyId }: { providerId: number; keyId: number }) => {
      await apiClient.delete(`/api/providers/${providerId}/keys/${keyId}`);
      return { providerId }; // Pass providerId to onSuccess
    },
    onSuccess: ({ providerId }) => {
      // Refetch the list of keys after one is deleted
      queryClient.invalidateQueries({ queryKey: ['apiKeys', providerId] });
      toast.success('API Key deleted.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete API key.');
    },
  });
};
// Hook to update an existing API key
export const useUpdateApiKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ providerId, keyId, label, apiKey }: { 
      providerId: number; 
      keyId: number; 
      label: string; 
      apiKey: string; 
    }) => {
      const response = await apiClient.put(`/api/providers/${providerId}/keys/${keyId}`, { 
        label, 
        apiKey 
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Refetch the list of keys to show the updated key
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('API Key updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update API key.');
    },
  });
};
