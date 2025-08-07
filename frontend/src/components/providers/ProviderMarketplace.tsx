'use client';

import { useState } from 'react';
import { useProviders } from '@/lib/api/providers';
import { Provider } from '@/types';
import { ProviderCard } from './ProviderCard';
import { ProviderDetails } from './ProviderDetails';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

export function ProviderMarketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const { data: providers, isLoading, error } = useProviders() as {
    data: Provider[] | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  console.log('🎯 ProviderMarketplace render:', { providers, isLoading, error });

  if (isLoading) {
    console.log('⏳ Showing loading state...');
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (error) {
    console.error('❌ ProviderMarketplace error:', error);
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load providers</p>
        <p className="text-gray-500 mt-2">Error: {error?.message || 'Unknown error'}</p>
      </div>
    );
  }

  if (!providers || providers.length === 0) {
    console.log('📭 No providers found');
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No providers available</p>
      </div>
    );
  }

  console.log('✅ Providers loaded successfully:', providers);

  const categories = Array.from(new Set(providers?.map((p) => p.category) || []));

  const filteredProviders = providers?.filter((provider) => {
    const matchesSearch = provider.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          provider.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || provider.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Debug info */}
      <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
        Debug: {providers.length} providers loaded, {filteredProviders?.length} filtered
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search providers or features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Provider Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders?.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onSelect={() => setSelectedProvider(provider)}
          />
        ))}
      </div>

      {/* Provider Details Modal */}
      {selectedProvider && (
        <ProviderDetails
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
        />
      )}
    </div>
  );
}
