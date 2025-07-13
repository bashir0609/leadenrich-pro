# 1. Updated ProviderDetails Component with Navigation

```typescript

'use client';

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Provider } from '@/types';
import { useProviderStore } from '@/lib/stores/providerStore';
import { Building2, Mail, Brain, Users } from 'lucide-react';

const categoryIcons = {
  'major-database': Building2,
  'email-finder': Mail,
  'ai-research': Brain,
  'social-enrichment': Users,
};

interface ProviderDetailsProps {
  provider: Provider;
  onClose: () => void;
}

export function ProviderDetails({ provider, onClose }: ProviderDetailsProps) {
  const router = useRouter();
  const { setSelectedProvider } = useProviderStore();
  const Icon = categoryIcons[provider.category as keyof typeof categoryIcons] || Building2;

  const handleSelect = () => {
    setSelectedProvider(provider);
    onClose();
    
    // Navigate to the provider landing page instead of enrichment
    router.push(`/providers/${provider.name}`);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Icon className="h-6 w-6 text-primary" />
            {provider.displayName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Available Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {provider.features.map((feature) => (
                <div key={feature.featureId} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{feature.featureName}</h4>
                    <Badge variant="secondary">{feature.creditsPerRequest} credits</Badge>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {feature.category}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSelect} className="flex-1">
              Select Provider
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


```

# 2. Provider Landing Page

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useProviderStore } from '@/lib/stores/providerStore';
import { useProviders } from '@/lib/api/providers';

export default function ProviderPage() {
  const router = useRouter();
  const params = useParams();
  const providerName = params.name as string;
  
  const { selectedProvider, setSelectedProvider } = useProviderStore();
  const { data: providers } = useProviders();
  
  // If we don't have a selected provider, try to find it from the URL
  useEffect(() => {
    if (!selectedProvider && providers) {
      const provider = providers.find(p => p.name === providerName);
      if (provider) {
        setSelectedProvider(provider);
      }
    }
  }, [providerName, providers, selectedProvider, setSelectedProvider]);
  
  // If we still don't have a provider, show loading or redirect
  if (!selectedProvider) {
    return <div>Loading...</div>;
  }
  
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
              Enrich contact data with additional information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Add emails, phones, social profiles and more to your contacts
            </p>
            <Button 
              className="w-full"
              onClick={() => router.push(`/providers/${selectedProvider.name}/people-enrichment`)}
            >
              Use People Enrichment
            </Button>
          </CardContent>
        </Card>
        
        {/* Company Search */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4">
            <CardTitle>Company Search</CardTitle>
            <CardDescription>
              Find companies based on various criteria
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Search for companies by industry, size, location and more
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
              Enrich company data with additional information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Add firmographics, technologies, and more to your company data
            </p>
            <Button 
              className="w-full"
              onClick={() => router.push(`/providers/${selectedProvider.name}/company-enrichment`)}
            >
              Use Company Enrichment
            </Button>
          </CardContent>
        </Card>
        
        {/* Company Lookalike */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4">
            <CardTitle>Company Lookalike</CardTitle>
            <CardDescription>
              Find similar companies to a given company
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Discover companies with similar attributes, industries, or technologies
            </p>
            <Button 
              className="w-full"
              onClick={() => router.push(`/providers/${selectedProvider.name}/company-lookalike`)}
            >
              Use Company Lookalike
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

```

# 3. People Search Feature Page


```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import { useProviderStore } from '@/lib/stores/providerStore';
import { useProviders } from '@/lib/api/providers';
import { useExecuteProvider } from '@/lib/api/providers';
import toast from 'react-hot-toast';

export default function PeopleSearchPage() {
  const router = useRouter();
  const params = useParams();
  const providerName = params.name as string;
  
  const { selectedProvider, setSelectedProvider, setSelectedOperation } = useProviderStore();
  const { data: providers } = useProviders();
  const executeProvider = useExecuteProvider();
  
  const [searchParams, setSearchParams] = useState({
    companyDomain: '',
    jobTitle: '',
    seniority: '',
    location: '',
  });
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // If we don't have a selected provider, try to find it from the URL
  useEffect(() => {
    if (!selectedProvider && providers) {
      const provider = providers.find(p => p.name === providerName);
      if (provider) {
        setSelectedProvider(provider);
      }
    }
    
    // Set the selected operation
    setSelectedOperation('search-people');
  }, [providerName, providers, selectedProvider, setSelectedProvider, setSelectedOperation]);
  
  // If we still don't have a provider, show loading or redirect
  if (!selectedProvider) {
    return <div>Loading...</div>;
  }
  
  const handleSearch = async () => {
    if (!searchParams.companyDomain) {
      toast.error('Company domain is required');
      return;
    }
    
    try {
      const result = await executeProvider.mutateAsync({
        providerId: selectedProvider.name,
        data: {
          operation: 'search-people',
          params: {
            companyDomains: [searchParams.companyDomain],
            jobTitles: searchParams.jobTitle ? [searchParams.jobTitle] : undefined,
            seniorities: searchParams.seniority ? [searchParams.seniority] : undefined,
          },
        },
      });
      
      if (result.success && result.data?.data) {
        setSearchResults(result.data.data);
        toast.success(`Found ${result.data.data.length} results`);
      } else {
        toast.error(result.error?.message || 'No results found');
      }
    } catch (error) {
      toast.error('Search failed');
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams({
      ...searchParams,
      [e.target.name]: e.target.value,
    });
  };
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/providers/${selectedProvider.name}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">People Search</h1>
            <p className="text-muted-foreground">
              {selectedProvider.displayName}
            </p>
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Search for People</CardTitle>
          <CardDescription>
            Find contacts based on various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyDomain">Company Domain *</Label>
                <Input 
                  id="companyDomain"
                  name="companyDomain"
                  placeholder="example.com"
                  value={searchParams.companyDomain}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input 
                  id="jobTitle"
                  name="jobTitle"
                  placeholder="VP of Marketing"
                  value={searchParams.jobTitle}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="seniority">Seniority Level</Label>
                <Select 
                  value={searchParams.seniority}
                  onValueChange={(value) => setSearchParams({...searchParams, seniority: value})}
                >
                  <SelectTrigger id="seniority">
                    <SelectValue placeholder="Select seniority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Seniority</SelectItem>
                    <SelectItem value="C-Level">C-Level</SelectItem>
                    <SelectItem value="VP">VP</SelectItem>
                    <SelectItem value="Director">Director</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location"
                  name="location"
                  placeholder="San Francisco, CA"
                  value={searchParams.location}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <Button 
              className="w-full mt-4" 
              onClick={handleSearch}
              disabled={executeProvider.isPending}
            >
              {executeProvider.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Results</h3>
              <div className="border rounded-md divide-y">
                {searchResults.map((person, index) => (
                  <div key={index} className="p-4">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">{person.fullName || `${person.firstName} ${person.lastName}`}</h4>
                        <p className="text-sm text-muted-foreground">{person.jobTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{person.companyName}</p>
                        {person.email && (
                          <p className="text-sm text-primary">{person.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

```