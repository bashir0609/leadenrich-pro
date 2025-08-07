'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Loader2, Building, MapPin, ExternalLink, TrendingUp, Users, DollarSign, Download } from 'lucide-react';
import toast from 'react-hot-toast';

// Import your actual API hooks
import { useProviders, useExecuteProvider } from '@/lib/api/providers';
import { useProviderStore } from '@/lib/stores/providerStore';
import { Provider } from '@/types';

export default function CompanyLookalikePage() {
  const router = useRouter();
  const params = useParams();
  const providerName = params.name as string;
  
  const { selectedProvider, setSelectedProvider } = useProviderStore();
  const { data: providers } = useProviders() as { data: Provider[] | undefined };
  const executeProvider = useExecuteProvider();
  
  const [searchParams, setSearchParams] = useState({
    domains: [''],
    names: [''],
    maxResults: 5,
    filters: {
      employeeCounts: [] as string[],
      industries: [] as string[],
      keywords: [] as string[],
      locations: [] as string[],
      revenues: [] as string[],
      technologies: [] as string[]
    }
  });
  
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedProvider && Array.isArray(providers) && providers.length > 0) {
      const provider = providers.find(p => p.name === providerName);
      if (provider) {
        setSelectedProvider(provider);
      }
    }
  }, [providerName, providers, selectedProvider, setSelectedProvider]);



  const employeeCountOptions = [
    "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001+"
  ];

  const industryOptions = [
    "Software", "Technology", "Healthcare", "Finance", "Manufacturing", 
    "Retail", "Education", "Aerospace", "Automotive", "Energy"
  ];

  const revenueOptions = [
    "0-1M", "1-10M", "10-50M", "50-100M", "100-500M", "500M+"
  ];

  const locationOptions = [
    "us", "ca", "gb", "fr", "de", "es", "it", "nl", "au", "jp", "sg", "in"
  ];

  const handleInputChange = (field: string, value: string, index: number = 0) => {
    if (field === 'domains' || field === 'names') {
      const newArray = [...searchParams[field]];
      newArray[index] = value;
      setSearchParams(prev => ({ ...prev, [field]: newArray }));
    } else if (field === 'maxResults') {
      setSearchParams(prev => ({ ...prev, maxResults: parseInt(value) || 5 }));
    }
  };

  const addDomain = () => {
    setSearchParams(prev => ({
      ...prev,
      domains: [...prev.domains, '']
    }));
  };

  const addName = () => {
    setSearchParams(prev => ({
      ...prev,
      names: [...prev.names, '']
    }));
  };

  const removeDomain = (index: number) => {
    setSearchParams(prev => ({
      ...prev,
      domains: prev.domains.filter((_, i) => i !== index)
    }));
  };

  const removeName = (index: number) => {
    setSearchParams(prev => ({
      ...prev,
      names: prev.names.filter((_, i) => i !== index)
    }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setSearchParams(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterType]: prev.filters[filterType as keyof typeof prev.filters].includes(value)
          ? prev.filters[filterType as keyof typeof prev.filters].filter(item => item !== value)
          : [...prev.filters[filterType as keyof typeof prev.filters], value]
      }
    }));
  };

  const handleSearch = async () => {
    if (!selectedProvider) {
      toast.error('Provider not found');
      return;
    }

    const nonEmptyDomains = searchParams.domains.filter(d => d.trim());
    const nonEmptyNames = searchParams.names.filter(n => n.trim());

    if (nonEmptyDomains.length === 0 && nonEmptyNames.length === 0) {
      toast.error('Please provide at least one company domain or name');
      return;
    }

    setIsLoading(true);
    try {
      const result = await executeProvider.mutateAsync({
        providerId: selectedProvider.name,
        operation: 'find-lookalike',
        params: {
          ...(nonEmptyDomains.length > 0 && { domains: nonEmptyDomains }),
          ...(nonEmptyNames.length > 0 && { names: nonEmptyNames }),
          maxResults: searchParams.maxResults,
          filters: Object.fromEntries(
            Object.entries(searchParams.filters).filter(([_, value]) => value.length > 0)
          )
        }
      });

      if (result.success && result.data) {
        setResults(result.data.organizations || []);
        toast.success(`Found ${result.data.organizations?.length || 0} similar companies!`);
      } else {
        // Show the exact error from your backend
        const errorMessage = result.error?.message || 'Search failed';
        console.error('🔍 Backend error response:', result.error);
        
        // Handle specific error messages
        if (errorMessage.includes('QUOTA_EXCEEDED')) {
          toast.error('Lookalike Search Quota Exceeded - Please upgrade your Surfe plan');
        } else if (errorMessage.includes('AUTHENTICATION_ERROR')) {
          toast.error('Authentication failed - Please check your Surfe API key');
        } else {
          toast.error(errorMessage);
        }
        
        setResults([]);
      }
    } catch (error: any) {
      console.error('🔍 Lookalike search error:', error);
      
      // Extract the exact error message from the response
      let errorMessage = 'Search failed';
      
      if (error?.response?.data?.message) {
        // Direct API error message
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        // General error message
        errorMessage = error.message;
      }
      
      // Handle specific Surfe error codes with user-friendly messages
      if (errorMessage.includes('QUOTA_EXCEEDED')) {
        if (errorMessage.includes('ORGANIZATION_LOOKALIKE_SEARCH')) {
          errorMessage = 'Lookalike Search Quota Exceeded - Please upgrade your Surfe plan or contact support';
        } else {
          errorMessage = 'API Quota Exceeded - Please check your Surfe plan limits';
        }
      }
      
      toast.error(errorMessage);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchParams({
      domains: [''],
      names: [''],
      maxResults: 5,
      filters: {
        employeeCounts: [],
        industries: [],
        keywords: [],
        locations: [],
        revenues: [],
        technologies: []
      }
    });
    setResults([]);
  };

  const exportToCSV = () => {
    if (results.length === 0) {
      toast.error('No results to export');
      return;
    }

    // Generate filename with lookalike domains/names
    const seedCompanies = [
      ...searchParams.domains.filter(d => d.trim()),
      ...searchParams.names.filter(n => n.trim())
    ];
    
    const seedIdentifier = seedCompanies.length > 0 
      ? seedCompanies.slice(0, 2).join('-').replace(/[^a-zA-Z0-9-]/g, '') 
      : 'companies';
    
    const dateStamp = new Date().toISOString().split('T')[0];
    const filename = `lookalike-${seedIdentifier}-${dateStamp}.csv`;

    const csvHeaders = [
      'Company Name',
      'Website', 
      'Description',
      'Employee Count',
      'Annual Revenue',
      'Primary Industry',
      'Primary Location',
      'Founded',
      'Phone',
      'LinkedIn URL',
      'Keywords',
      'Digital Presence'
    ];

    const csvData = results.map(company => [
      company.name || '',
      company.website || '',
      (company.description || '').replace(/"/g, '""').replace(/\n/g, ' '),
      company.size || '',
      company.annualRevenueRange || '',
      company.industries?.[0]?.industry || '',
      company.addresses?.find((addr: any) => addr.isPrimary)?.raw || company.addresses?.[0]?.raw || '',
      company.founded || '',
      company.phones?.[0] || '',
      company.linkedinUrl || '',
      (company.keywords || []).slice(0, 10).join('; '),
      (company.digitalPresence || []).map((dp: any) => `${dp.name}: ${dp.url}`).join('; ')
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => 
        row.map(field => 
          typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))
            ? `"${field}"`
            : field
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${results.length} companies to ${filename}`);
  };

  if (!selectedProvider) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/providers/${providerName}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Company Lookalike Search</h1>
          <p className="text-muted-foreground">
            {selectedProvider.displayName} • Find companies similar to your target organizations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Form */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seed Companies</CardTitle>
              <CardDescription>
                Provide example companies to find similar organizations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Domains */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Company Domains</Label>
                {searchParams.domains.map((domain, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      placeholder="e.g., google.com"
                      value={domain}
                      onChange={(e) => handleInputChange('domains', e.target.value, index)}
                    />
                    {searchParams.domains.length > 1 && (
                      <Button variant="outline" size="sm" onClick={() => removeDomain(index)}>
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addDomain}>
                  + Add Domain
                </Button>
              </div>

              {/* Company Names */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Company Names</Label>
                {searchParams.names.map((name, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      placeholder="e.g., Google"
                      value={name}
                      onChange={(e) => handleInputChange('names', e.target.value, index)}
                    />
                    {searchParams.names.length > 1 && (
                      <Button variant="outline" size="sm" onClick={() => removeName(index)}>
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addName}>
                  + Add Name
                </Button>
              </div>

              {/* Max Results */}
              <div>
                <Label htmlFor="maxResults">Max Results</Label>
                <Select value={searchParams.maxResults.toString()} onValueChange={(value) => handleInputChange('maxResults', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 results</SelectItem>
                    <SelectItem value="10">10 results</SelectItem>
                    <SelectItem value="20">20 results</SelectItem>
                    <SelectItem value="50">50 results</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Refine your search with specific criteria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Employee Count */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Employee Count</Label>
                <div className="flex flex-wrap gap-1">
                  {employeeCountOptions.map(option => (
                    <Button
                      key={option}
                      variant={searchParams.filters.employeeCounts.includes(option) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('employeeCounts', option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Industries */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Industries</Label>
                <div className="flex flex-wrap gap-1">
                  {industryOptions.map(option => (
                    <Button
                      key={option}
                      variant={searchParams.filters.industries.includes(option) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('industries', option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Revenue */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Annual Revenue</Label>
                <div className="flex flex-wrap gap-1">
                  {revenueOptions.map(option => (
                    <Button
                      key={option}
                      variant={searchParams.filters.revenues.includes(option) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('revenues', option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Locations</Label>
                <div className="flex flex-wrap gap-1">
                  {locationOptions.map(option => (
                    <Button
                      key={option}
                      variant={searchParams.filters.locations.includes(option) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('locations', option)}
                    >
                      {option.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  placeholder="e.g., AI, Machine Learning, SaaS"
                  onChange={(e) => {
                    const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
                    setSearchParams(prev => ({
                      ...prev,
                      filters: { ...prev.filters, keywords }
                    }));
                  }}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSearch} disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Find Lookalikes
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={clearSearch}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Similar Companies</CardTitle>
                  <CardDescription>
                    {results.length > 0 ? `Found ${results.length} similar companies` : 'Results will appear here after search'}
                  </CardDescription>
                </div>
                {results.length > 0 && (
                  <Button onClick={exportToCSV} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((company, index) => (
                    <Card key={index} className="border">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                              {company.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{company.name}</h3>
                              {company.website && (
                                <a 
                                  href={`https://${company.website}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                >
                                  {company.website}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {company.isPublic && <Badge variant="default">Public</Badge>}
                            {company.founded && <Badge variant="outline">{company.founded}</Badge>}
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-4 text-sm">
                          {company.description}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{company.size} employees</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{company.annualRevenueRange}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{company.industries?.[0]?.industry || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{company.addresses?.[0]?.raw?.split(',').slice(-2).join(',').trim() || 'N/A'}</span>
                          </div>
                        </div>

                        {company.keywords && company.keywords.length > 0 && (
                          <div className="mb-4">
                            <Label className="text-sm font-medium mb-2 block">Keywords</Label>
                            <div className="flex flex-wrap gap-1">
                              {company.keywords.slice(0, 6).map((keyword: string, idx: number) => (
                                <Badge key={idx} variant="secondary">{keyword}</Badge>
                              ))}
                              {company.keywords.length > 6 && (
                                <Badge variant="outline">+{company.keywords.length - 6} more</Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {company.linkedinUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                  LinkedIn
                                </a>
                              </Button>
                            )}
                            {company.digitalPresence?.map((presence: any, idx: number) => (
                              <Button key={idx} variant="outline" size="sm" asChild>
                                <a href={presence.url} target="_blank" rel="noopener noreferrer">
                                  {presence.name}
                                </a>
                              </Button>
                            ))}
                          </div>
                          {company.followersCountLinkedin && (
                            <div className="text-sm text-muted-foreground">
                              {company.followersCountLinkedin.toLocaleString()} LinkedIn followers
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Provide seed companies and click "Find Lookalikes" to discover similar organizations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}