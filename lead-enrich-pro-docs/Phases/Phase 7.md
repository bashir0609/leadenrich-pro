# Phase 7: Feature-Specific Pages & Advanced UI

## 📋 Prerequisites
- ✅ Phase 6 security and production setup ready for implementation
- ✅ Provider selection functionality working correctly
- ✅ Core enrichment functionality implemented
- ✅ Provider marketplace UI operational

## 🎯 Phase 7 Goals
1. Create provider-specific landing pages
2. Implement feature-specific operation pages
3. Add advanced search and filtering capabilities
4. Improve the user experience with guided workflows
5. Create reusable form components for different operations

---

## 📝 Step 7.1: Provider-Specific Landing Page

Create a dedicated landing page for each provider that showcases all available features and operations.

Create `frontend/src/app/providers/[name]/page.tsx`:
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

## 📝 Step 7.2: People Search Feature Page

Create `frontend/src/app/providers/[name]/people-search/page.tsx`:
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

## 📝 Step 7.3: People Enrichment Feature Page

Create `frontend/src/app/providers/[name]/people-enrichment/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/common/FileUpload';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { useProviderStore } from '@/lib/stores/providerStore';
import { useProviders } from '@/lib/api/providers';
import { useExecuteProvider } from '@/lib/api/providers';
import toast from 'react-hot-toast';

export default function PeopleEnrichmentPage() {
  const router = useRouter();
  const params = useParams();
  const providerName = params.name as string;
  
  const { selectedProvider, setSelectedProvider, setSelectedOperation } = useProviderStore();
  const { data: providers } = useProviders();
  const executeProvider = useExecuteProvider();
  
  const [singleParams, setSingleParams] = useState({
    email: '',
    firstName: '',
    lastName: '',
    companyDomain: '',
    linkedinUrl: '',
  });
  
  const [enrichmentResult, setEnrichmentResult] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // If we don't have a selected provider, try to find it from the URL
  useEffect(() => {
    if (!selectedProvider && providers) {
      const provider = providers.find(p => p.name === providerName);
      if (provider) {
        setSelectedProvider(provider);
      }
    }
    
    // Set the selected operation
    setSelectedOperation('enrich-person');
  }, [providerName, providers, selectedProvider, setSelectedProvider, setSelectedOperation]);
  
  // If we still don't have a provider, show loading or redirect
  if (!selectedProvider) {
    return <div>Loading...</div>;
  }
  
  const handleSingleEnrichment = async () => {
    // Require at least one identifier
    if (!singleParams.email && !singleParams.linkedinUrl && 
        !(singleParams.firstName && singleParams.lastName && singleParams.companyDomain)) {
      toast.error('Please provide at least one way to identify the person');
      return;
    }
    
    try {
      const result = await executeProvider.mutateAsync({
        providerId: selectedProvider.name,
        data: {
          operation: 'enrich-person',
          params: singleParams,
        },
      });
      
      if (result.success && result.data) {
        setEnrichmentResult(result.data);
        toast.success('Enrichment successful');
      } else {
        toast.error(result.error?.message || 'Enrichment failed');
      }
    } catch (error) {
      toast.error('Enrichment failed');
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSingleParams({
      ...singleParams,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    // Continue with bulk upload process
    router.push(`/enrichment?provider=${selectedProvider.name}`);
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
            <h1 className="text-3xl font-bold">People Enrichment</h1>
            <p className="text-muted-foreground">
              {selectedProvider.displayName}
            </p>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Enrichment</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Enrichment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="single" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrich a Single Contact</CardTitle>
              <CardDescription>
                Provide at least one identifier to find and enrich the contact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      name="email"
                      placeholder="john.doe@example.com"
                      value={singleParams.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                    <Input 
                      id="linkedinUrl"
                      name="linkedinUrl"
                      placeholder="https://linkedin.com/in/johndoe"
                      value={singleParams.linkedinUrl}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName"
                      name="firstName"
                      placeholder="John"
                      value={singleParams.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      value={singleParams.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyDomain">Company Domain</Label>
                    <Input 
                      id="companyDomain"
                      name="companyDomain"
                      placeholder="example.com"
                      value={singleParams.companyDomain}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-4"
                  onClick={handleSingleEnrichment}
                  disabled={executeProvider.isPending}
                >
                  {executeProvider.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enriching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Enrich Contact
                    </>
                  )}
                </Button>
              </div>
              
              {enrichmentResult && (
                <div className="mt-6 border rounded-md p-4">
                  <h3 className="text-lg font-semibold mb-4">Enrichment Result</h3>
                  <div className="grid grid-cols-2 gap-y-2">
                    <div className="text-sm font-medium">Full Name</div>
                    <div>{enrichmentResult.fullName}</div>
                    
                    <div className="text-sm font-medium">Email</div>
                    <div>{enrichmentResult.email || 'Not found'}</div>
                    
                    <div className="text-sm font-medium">Phone</div>
                    <div>{enrichmentResult.phone || 'Not found'}</div>
                    
                    <div className="text-sm font-medium">Title</div>
                    <div>{enrichmentResult.title || 'Not found'}</div>
                    
                    <div className="text-sm font-medium">Company</div>
                    <div>{enrichmentResult.company || 'Not found'}</div>
                    
                    <div className="text-sm font-medium">LinkedIn</div>
                    <div>{enrichmentResult.linkedinUrl || 'Not found'}</div>
                    
                    <div className="text-sm font-medium">Location</div>
                    <div>{enrichmentResult.location || 'Not found'}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bulk" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Enrichment</CardTitle>
              <CardDescription>
                Upload a CSV file with contacts to enrich
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload onFileSelect={handleFileSelect} />
              
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file to continue with the bulk enrichment process.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## 📝 Step 7.4: Company Search Feature Page

Create `frontend/src/app/providers/[name]/company-search/page.tsx` with a similar structure as the People Search page but adapted for company search parameters.

## 📝 Step 7.5: Company Enrichment Feature Page

Create `frontend/src/app/providers/[name]/company-enrichment/page.tsx` with a similar structure as the People Enrichment page but adapted for company enrichment parameters.

## 📝 Step 7.6: Company Lookalike Feature Page

Create `frontend/src/app/providers/[name]/company-lookalike/page.tsx` with a similar structure but adapted for finding similar companies.

## 🔄 Step 7.7: Update the ProviderDetails Component

Update `frontend/src/components/providers/ProviderDetails.tsx` to navigate to the provider landing page:

```typescript
const handleSelect = () => {
  setSelectedProvider(provider);
  onClose();
  
  // Navigate to the provider landing page
  router.push(`/providers/${provider.name}`);
};
```

## 📝 Step 7.8: Create Reusable Form Components

To improve code reusability, create common form components:

- `frontend/src/components/forms/PersonSearchForm.tsx`
- `frontend/src/components/forms/PersonEnrichmentForm.tsx` 
- `frontend/src/components/forms/CompanySearchForm.tsx`
- `frontend/src/components/forms/CompanyEnrichmentForm.tsx`
- `frontend/src/components/forms/LookalikeForm.tsx`

## 🎯 Phase 7 Completion Checklist

- [ ] Provider landing page showing all features
- [ ] People Search feature page implemented
- [ ] People Enrichment feature page implemented
- [ ] Company Search feature page implemented
- [ ] Company Enrichment feature page implemented
- [ ] Company Lookalike feature page implemented
- [ ] Navigation between pages working correctly
- [ ] All forms functioning properly with the API
- [ ] Provider selection persisting correctly

## 📋 Next Steps for Phase 8

After completing Phase 7, the next phase will focus on:

1. User management and teams
2. Usage tracking and analytics dashboard
3. Saved searches and templates
4. Advanced export options
5. Webhook integrations