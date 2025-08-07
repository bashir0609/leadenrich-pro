'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Eye, EyeOff, Plus, Trash2, Edit, Save, X, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProviders } from '@/lib/api/providers';
import { 
  useAllApiKeys,
  useCreateApiKey, 
  useUpdateApiKey, 
  useDeleteApiKey,
  useActivateApiKey,
  useTestApiKey,
  type CreateApiKeyRequest 
} from '@/lib/api/apiKeys';
import { useDashboardStats } from '@/lib/api/dashboard';

// Define the Provider interface to match the API response
interface Provider {
  id: number;
  name: string;
  displayName: string;
  category: string;
  features?: any[];
}

export default function ApiKeySettings() {
  const { data: providers = [] } = useProviders();
  const { data: apiKeys = [], isLoading, error } = useAllApiKeys();
  const { data: dashboardStats } = useDashboardStats();
  const createApiKeyMutation = useCreateApiKey();
  const updateApiKeyMutation = useUpdateApiKey();
  const deleteApiKeyMutation = useDeleteApiKey();
  const activateApiKeyMutation = useActivateApiKey();
  const testApiKeyMutation = useTestApiKey();

  const [isAddingKey, setIsAddingKey] = useState(false);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState(new Set<string>());
  const [editingKey, setEditingKey] = useState<{
    id: string;
    name: string;
    keyValue: string;
    providerId: number;
  } | null>(null);
  const [newKey, setNewKey] = useState<CreateApiKeyRequest & { providerId: number }>({
    name: '',
    providerId: 0,
    keyValue: '',
  });

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  // Fix the maskApiKey function to handle undefined/null values
  const maskApiKey = (key: string | undefined | null) => {
    if (!key || typeof key !== 'string') return '***';
    if (key.length <= 8) return '***';
    return key.substring(0, 4) + '***' + key.substring(key.length - 4);
  };

  const handleAddKey = async () => {
    if (!newKey.name || !newKey.providerId || !newKey.keyValue) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await createApiKeyMutation.mutateAsync(newKey);
      setNewKey({ name: '', providerId: 0, keyValue: '' });
      setIsAddingKey(false);
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Failed to create API key. Please try again.');
    }
  };

  const handleDeleteKey = async (providerId: number, keyId: string) => {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      try {
        await deleteApiKeyMutation.mutateAsync({ providerId, keyId });
      } catch (error) {
        console.error('Failed to delete API key:', error);
        alert('Failed to delete API key. Please try again.');
      }
    }
  };

  const handleActivateKey = async (providerId: number, keyId: string) => {
    try {
      await activateApiKeyMutation.mutateAsync({ providerId, keyId });
    } catch (error) {
      console.error('Failed to activate API key:', error);
      alert('Failed to activate API key. Please try again.');
    }
  };

  const handleTestKey = async (providerId: number, keyId: string) => {
    try {
      const result = await testApiKeyMutation.mutateAsync({ providerId, keyId });
      alert(result.success ? result.message : 'API key test failed');
    } catch (error) {
      console.error('Failed to test API key:', error);
      alert('Failed to test API key. Please try again.');
    }
  };

  const handleStartEdit = (apiKey: any) => {
    setEditingKey({
      id: apiKey.id,
      name: apiKey.name,
      keyValue: apiKey.keyValue,
      providerId: apiKey.providerId
    });
    setEditingKeyId(apiKey.id);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingKeyId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingKey) return;

    try {
      await updateApiKeyMutation.mutateAsync({
        providerId: editingKey.providerId,
        keyId: editingKey.id,
        data: {
          name: editingKey.name,
          keyValue: editingKey.keyValue
        }
      });
      setEditingKey(null);
      setEditingKeyId(null);
    } catch (error) {
      console.error('Failed to update API key:', error);
      alert('Failed to update API key. Please try again.');
    }
  };

  // Fix the getProviderDisplayName function with proper typing
  const getProviderDisplayName = (providerId: number): string => {
    const provider = (providers as Provider[]).find((p: Provider) => p.id === providerId);
    return provider ? provider.displayName : 'Unknown Provider';
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading API keys...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load API keys: {error?.message || 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  console.log('🔍 Debug - API Keys data:', apiKeys);
  console.log('🔍 Debug - Providers data:', providers);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Key Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your API keys for different data providers
          </p>
        </div>
        <Button 
          onClick={() => setIsAddingKey(true)}
          className="flex items-center gap-2"
          disabled={isAddingKey}
        >
          <Plus className="h-4 w-4" />
          Add API Key
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          API keys are encrypted and stored securely. Only you can see the full key values.
          Make sure to keep your API keys confidential and never share them publicly.
        </AlertDescription>
      </Alert>

      {/* Debug info */}
      <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
        Debug: {apiKeys.length} API keys loaded, {providers.length} providers available
      </div>

      {/* Add New API Key Form */}
      {isAddingKey && (
        <Card>
          <CardHeader>
            <CardTitle>Add New API Key</CardTitle>
            <CardDescription>
              Add an API key for one of your data providers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Production Key, Development Key"
                  value={newKey.name}
                  onChange={(e) => setNewKey(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <select
                  id="provider"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newKey.providerId}
                  onChange={(e) => setNewKey(prev => ({ ...prev, providerId: parseInt(e.target.value) }))}
                >
                  <option value="0">Select a provider</option>
                  {(providers as Provider[]).map((provider: Provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={newKey.keyValue}
                onChange={(e) => setNewKey(prev => ({ ...prev, keyValue: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleAddKey}
                disabled={createApiKeyMutation.isPending}
              >
                {createApiKeyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save API Key
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingKey(false);
                  setNewKey({ name: '', providerId: 0, keyValue: '' });
                }}
                disabled={createApiKeyMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your API Keys</h2>
        
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No API Keys</h3>
              <p className="text-muted-foreground text-center mb-4">
                You haven't added any API keys yet. Add your first API key to start using the providers.
              </p>
              <Button onClick={() => setIsAddingKey(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {apiKeys.map((apiKey: any) => (
              <Card key={apiKey.id}>
                <CardContent className="p-6">
                  {editingKeyId === apiKey.id ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Edit API Key</h3>
                        <Badge variant="outline">
                          {apiKey.providerDisplayName || getProviderDisplayName(apiKey.providerId)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`edit-name-${apiKey.id}`}>Key Name</Label>
                        <Input
                          id={`edit-name-${apiKey.id}`}
                          value={editingKey?.name || ''}
                          onChange={(e) => setEditingKey(prev => prev ? {...prev, name: e.target.value} : null)}
                          placeholder="API Key Name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`edit-key-${apiKey.id}`}>API Key Value</Label>
                        <Input
                          id={`edit-key-${apiKey.id}`}
                          type="password"
                          value={editingKey?.keyValue || ''}
                          onChange={(e) => setEditingKey(prev => prev ? {...prev, keyValue: e.target.value} : null)}
                          placeholder="Enter your API key"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleSaveEdit}
                          disabled={updateApiKeyMutation.isPending}
                        >
                          {updateApiKeyMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancelEdit}
                          disabled={updateApiKeyMutation.isPending}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{apiKey.name || 'Unnamed Key'}</h3>
                          <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                            {apiKey.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            {apiKey.providerDisplayName || getProviderDisplayName(apiKey.providerId)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {visibleKeys.has(apiKey.id) ? (apiKey.keyValue || 'No key value') : maskApiKey(apiKey.keyValue)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {visibleKeys.has(apiKey.id) ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          Created: {apiKey.createdAt ? new Date(apiKey.createdAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEdit(apiKey)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestKey(apiKey.providerId, apiKey.id)}
                          disabled={testApiKeyMutation.isPending}
                        >
                          {testApiKeyMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Test'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivateKey(apiKey.providerId, apiKey.id)}
                          disabled={activateApiKeyMutation.isPending}
                        >
                          {apiKey.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteKey(apiKey.providerId, apiKey.id)}
                          disabled={deleteApiKeyMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>API Usage Overview</CardTitle>
          <CardDescription>
            Monitor your API key usage and limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{apiKeys.filter((k: any) => k.isActive).length}</div>
              <div className="text-sm text-muted-foreground">Active Keys</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{providers.length}</div>
              <div className="text-sm text-muted-foreground">Providers</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {dashboardStats?.credits?.thisMonth?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-muted-foreground">API Calls This Month</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}