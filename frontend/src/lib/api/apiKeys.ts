import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { useProviders } from './providers';

// Define the Provider type to match what we get from useProviders
interface Provider {
  id: number;
  name: string;
  displayName: string;
  category: string;
  features?: any[];
}

export interface ApiKey {
  id: string;
  name: string;
  keyValue: string;
  providerId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyRequest {
  name: string;
  keyValue: string;
}

export interface UpdateApiKeyRequest {
  name?: string;
  keyValue?: string;
  isActive?: boolean;
}

// Get all API keys for all providers (aggregated)
export const useAllApiKeys = () => {
  const { data: providers = [], isLoading: providersLoading, error: providersError } = useProviders();
  
  console.log('🔧 useAllApiKeys called');
  console.log('📋 Providers:', providers);
  console.log('⏳ Providers loading:', providersLoading);
  console.log('❌ Providers error:', providersError);
  
  return useQuery({
    queryKey: ['allApiKeys'],
    queryFn: async () => {
      console.log('🔍 Fetching all API keys...');
      console.log('📊 Available providers:', providers);
      
      if (providers.length === 0) {
        console.log('⚠️ No providers available, returning empty array');
        return [];
      }
      
      // Fetch API keys for each provider
      const apiKeyPromises = providers.map(async (provider: Provider) => {
        try {
          console.log(`🔍 Fetching keys for provider ${provider.id} (${provider.displayName})`);
          const response = await apiClient.get(`/api/providers/${provider.id}/keys`);
          console.log(`📦 Response for provider ${provider.id}:`, response);
          
          const keys = response.data || response || [];
          return keys.map((key: any) => ({
            ...key,
            providerId: provider.id,
            providerName: provider.name,
            providerDisplayName: provider.displayName
          }));
        } catch (error) {
          console.error(`❌ Failed to fetch keys for provider ${provider.id}:`, error);
          return [];
        }
      });

      const results = await Promise.all(apiKeyPromises);
      const allKeys = results.flat();
      console.log('✅ All API keys fetched:', allKeys);
      return allKeys;
    },
    enabled: !providersLoading && providers.length > 0,
    staleTime: 0, // Always fetch fresh data for debugging
  });
};

// Create a new API key for a provider
export const useCreateApiKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ providerId, ...data }: CreateApiKeyRequest & { providerId: number }) => {
      console.log('🔧 Creating API key:', { providerId, data });
      const response = await apiClient.post(`/api/providers/${providerId}/keys`, data);
      console.log('✅ API key created:', response);
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allApiKeys'] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
  });
};

// Update an API key
export const useUpdateApiKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      providerId, 
      keyId, 
      data 
    }: { 
      providerId: number; 
      keyId: string; 
      data: UpdateApiKeyRequest 
    }) => {
      const response = await apiClient.put(`/api/providers/${providerId}/keys/${keyId}`, data);
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allApiKeys'] });
    },
  });
};

// Activate an API key
export const useActivateApiKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ providerId, keyId }: { providerId: number; keyId: string }) => {
      const response = await apiClient.put(`/api/providers/${providerId}/keys/${keyId}/activate`);
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allApiKeys'] });
    },
  });
};

// Delete an API key
export const useDeleteApiKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ providerId, keyId }: { providerId: number; keyId: string }) => {
      const response = await apiClient.delete(`/api/providers/${providerId}/keys/${keyId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allApiKeys'] });
    },
  });
};

// Test endpoint
export const useTestApiKey = () => {
  return useMutation({
    mutationFn: async ({ providerId, keyId }: { providerId: number; keyId: string }) => {
      console.log(`🧪 Testing API key ${keyId} for provider ${providerId}`);
      return { success: true, message: 'Test functionality not implemented yet' };
    },
  });
};