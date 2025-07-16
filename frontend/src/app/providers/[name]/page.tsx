// frontend/src/app/providers/[name]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useProviderStore } from '@/lib/stores/providerStore';
import { useProviders } from '@/lib/api/providers';

export default function ProviderPage() {
  // Navigation and routing
  const router = useRouter();
  const params = useParams();
  const providerName = params.name as string;
  
  const { selectedProvider, setSelectedProvider } = useProviderStore();
  const { data: providers, isLoading, error } = useProviders();
  
  // Track whether we've attempted to set the provider
  const [providerSet, setProviderSet] = useState(false);

  useEffect(() => {
    // Only attempt to set provider if:
    // 1. Providers have been loaded
    // 2. We haven't already set the provider
    // 3. The URL provider name matches
    if (providers && !providerSet && providerName) {
      const provider = providers.find(p => p.name === providerName);
      if (provider) {
        setSelectedProvider(provider);
        setProviderSet(true);
      }
    }
  }, [providers, providerName, providerSet, setSelectedProvider]);

  // Loading state
  if (isLoading) {
    return <div>Loading provider details...</div>;
  }

  // Error state
  if (error || !selectedProvider) {
    return (
      <div>
        <p>Unable to load provider details.</p>
        <Button onClick={() => router.push('/')}>Back to Providers</Button>
      </div>
    );
  }

  // Render provider details
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{selectedProvider.displayName}</h1>
            <p className="text-muted-foreground">
              {selectedProvider.category}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* People Search */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4">
            <CardTitle>People Search</CardTitle>
            <CardDescription>
              Search for people based on various criteria
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Find contacts by company, title, location and more
            </p>
            <Button 
              className="w-full"
              onClick={() => router.push(`/providers/${selectedProvider.name}/people-search`)}
            >
              Use People Search
            </Button>
          </CardContent>
        </Card>

        {/* People Enrichment */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4">
            <CardTitle>People Enrichment</CardTitle>
            <CardDescription>
              Enrich your people data with additional information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Find contacts by company, title, location and more
            </p>
            <Button 
              className="w-full"
              onClick={() => router.push(`/providers/${selectedProvider.name}/people-enrichment`)}
            >
              Use People Enrichment
            </Button>
          </CardContent>
        </Card>
        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        

        {/* Company Search */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4">
            <CardTitle>Company Search</CardTitle>
            <CardDescription>
              Search for Companies based on various criteria
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Find contacts by company, title, location and more
            </p>
            <Button 
              className="w-full"
              onClick={() => router.push(`/providers/${selectedProvider.name}/company-search`)}
            >
              Use Company Search
            </Button>
          </CardContent>
        </Card>

        {/* Company Enrichment */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4">
            <CardTitle>Company Enrichment</CardTitle>
            <CardDescription>
              Enrich your company data with additional information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Find contacts by company, title, location and more
            </p>
            <Button 
              className="w-full"
              onClick={() => router.push(`/providers/${selectedProvider.name}/company-enrichment`)}
            >
              Use Company Enrichment
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Company Lookalike */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4">
            <CardTitle>Company Lookalike</CardTitle>
            <CardDescription>
              Find companies similar to your existing ones
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Find contacts by company, title, location and more
            </p>
            <Button 
              className="w-full"
              onClick={() => router.push(`/providers/${selectedProvider.name}/company-lookalike`)}
            >
              Use Company Enrichment
            </Button>
          </CardContent>
        </Card>
        {/* Similar cards for other features */}
      </div>
    </div>
  );
}