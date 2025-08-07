// frontend/src/app/providers/[name]/people-search/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ArrowLeft, Search, Loader2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { Provider, PersonSearchResult, PeopleSearchApiResponse } from '@/types';

// Import necessary hooks and services
import { useProviderStore } from '@/lib/stores/providerStore';
import { useProviders } from '@/lib/api/providers';
import { useExecuteProvider } from '@/lib/api/providers';
import { DataCleaningService } from '@/utils/dataCleaning';
import { ProviderError } from '@/components/ui/provider-error';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { getSeniorityOptions, getDepartmentOptions, getIndustryOptions, getCountryOptions } from '@/lib/constants/filterData';

export default function PeopleSearchPage() {
  // Navigation and routing
  const router = useRouter();
  const params = useParams();
  const urlProviderName = params.name as string;

  // State management hooks
  const { selectedProvider, setSelectedProvider } = useProviderStore();
  
  const { data: providers, isLoading: isProvidersLoading } = useProviders() as { 
    data: Provider[] | undefined; 
    isLoading: boolean;
  };

  const executeProvider = useExecuteProvider();

  // Hydration-safe state
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  
  // Provider selection effect
  useEffect(() => {
    if (isClient && Array.isArray(providers) && providers.length > 0 && urlProviderName) {
      const provider = providers.find(p => p.name === urlProviderName);
      if (provider) {
        setSelectedProvider(provider);
      }
    }
  }, [isClient, providers, urlProviderName, setSelectedProvider]);

  // Search state
  const [searchParams, setSearchParams] = useState({
    // Company filters
    companyDomains: [] as string[],
    excludeDomains: [] as string[],
    companyNames: [] as string[],
    industries: [] as string[],
    companyCountries: [] as string[],
    minEmployees: '',
    maxEmployees: '',
    minRevenue: '',
    maxRevenue: '',
    
    // People filters  
    jobTitles: [] as string[],
    seniorities: [] as string[],
    departments: [] as string[],
    peopleCountries: [] as string[],
    
    // Pagination and configuration
    pageToken: '', // For pagination with Surfe API
    limit: 10,
    peoplePerCompany: 5,
  });

  const handleTextareaChange = (field: string, value: string) => {
    let lines: string[];
    
    // For domain-related fields, use the domain cleaning method
    if (field.includes('Domains')) {
      lines = value
        .split('\n')
        .map(line => DataCleaningService.cleanDomain(line))
        .filter((domain): domain is string => domain !== null);
    } else {
      lines = value.split('\n').filter(line => line.trim()).slice(0, 100);
    }

    setSearchParams(prev => ({
      ...prev,
      [field]: Array.from(new Set(lines)), // Remove duplicates
    }));
  };

  const [totalResults, setTotalResults] = useState(0);

  // Results and pagination state
  const [searchResults, setSearchResults] = useState<PersonSearchResult[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalResults: 0,
    nextPageToken: '',
  });
  
  // Function to load more results using pageToken
  const handleLoadMore = async () => {
    if (!pagination.nextPageToken) {
      toast('No more results available');
      return;
    }
    
    setIsSearchLoading(true);
    
    try {
      const result = await executeProvider.mutateAsync({
        providerId: selectedProvider?.name || '',
        operation: 'search-people',
        params: {
          companies: {
            domains: searchParams.companyDomains.length > 0 ? searchParams.companyDomains : undefined,
            domainsExcluded: searchParams.excludeDomains.length > 0 ? searchParams.excludeDomains : undefined,
            names: searchParams.companyNames.length > 0 ? searchParams.companyNames : undefined,
            industries: searchParams.industries.length > 0 ? searchParams.industries : undefined,
            countries: searchParams.companyCountries.length > 0 ? searchParams.companyCountries : undefined,
            employeeCount: (searchParams.minEmployees || searchParams.maxEmployees) ? {
              from: parseInt(searchParams.minEmployees) || 1,
              to: parseInt(searchParams.maxEmployees) || 999999999
            } : undefined,
            revenue: (searchParams.minRevenue || searchParams.maxRevenue) ? {
              from: parseInt(searchParams.minRevenue) || 1,
              to: parseInt(searchParams.maxRevenue) || 999999999
            } : undefined,
          },
          people: {
            jobTitles: searchParams.jobTitles.length > 0 ? searchParams.jobTitles : undefined,
            seniorities: searchParams.seniorities.length > 0 ? searchParams.seniorities : undefined,
            departments: searchParams.departments.length > 0 ? searchParams.departments : undefined,
            countries: searchParams.peopleCountries.length > 0 ? searchParams.peopleCountries : undefined,
          },
          limit: searchParams.limit,
          pageToken: pagination.nextPageToken,
          peoplePerCompany: searchParams.peoplePerCompany,
        },
      });

      console.log('🔍 RAW API RESULT:', result);
      console.log('🔍 Result success:', result.success);
      console.log('🔍 Result data:', result.data);
      console.log('🔍 Result data type:', typeof result.data);
      console.log('🔍 Is people array?', Array.isArray(result.data?.people));
      console.log('🔍 People length:', result.data?.people?.length);
      
      if (result.success && result.data && Array.isArray(result.data.people) && result.data.people.length > 0) {
        const searchResponse = result.data as PeopleSearchApiResponse;
        
        // Append new results to existing results
        setSearchResults(prev => [...prev, ...(searchResponse.people || [])]);
        
        // Update pagination
        setPagination(prev => ({
          ...prev,
          nextPageToken: searchResponse.nextPageToken || '',
          currentPage: prev.currentPage + 1,
        }));
        
        // Update search params with the new nextPageToken
        setSearchParams(prev => ({
          ...prev,
          pageToken: searchResponse.nextPageToken || ''
        }));
        
        toast.success(`Loaded ${searchResponse.people?.length || 0} more results`);
      } else {
        toast.error(result.error?.message || 'Failed to load more results');
      }
    } catch (error: any) {
      toast.error(error.message || 'A network error occurred while loading more results');
      console.error("Load more failed:", error);
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Loading state
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Search error state
  const [searchError, setSearchError] = useState<{
    message: string;
    isProviderError: boolean;
  } | null>(null);

  const [csvImportModal, setCsvImportModal] = useState<{
    show: boolean;
    headers: string[];
    lines: string[];
    field: 'companyDomains' | 'excludeDomains';
    selectedColumn: string;
  }>({
    show: false,
    headers: [],
    lines: [],
    field: 'companyDomains',
    selectedColumn: ''
  });

  const [domainInput, setDomainInput] = useState({
    companyDomains: '',
    excludeDomains: '',
  });

  const [domainValidationErrors, setDomainValidationErrors] = useState({
    companyDomains: [] as string[],
    excludeDomains: [] as string[],
  });

  // Prevent hydration errors
  if (!isClient) {
    return null;
  }

  // Validation and search handler
  const handleSearch = async () => {
    // Ensure we have a provider first
    if (!selectedProvider) {
      toast.error('Please select a provider');
      return;
    }

    // For people search, we need at least one company identifier
    const hasCompanyIdentifier = (
      searchParams.companyDomains.length > 0 ||
      searchParams.companyNames.length > 0 ||
      searchParams.industries.length > 0 ||
      searchParams.companyCountries.length > 0 ||
      searchParams.minEmployees ||
      searchParams.maxEmployees ||
      searchParams.minRevenue ||
      searchParams.maxRevenue
    );

    const hasPeopleFilters = (
      searchParams.jobTitles.length > 0 ||
      searchParams.seniorities.length > 0 ||
      searchParams.departments.length > 0 ||
      searchParams.peopleCountries.length > 0
    );

    const canDoSearch = hasCompanyIdentifier || hasPeopleFilters;

    if (!canDoSearch) {
      toast.error('Please provide either company filters OR people filters to search');
      return;
    }

    setIsSearchLoading(true);
    
    // Clear results only for new searches (not pagination)
    if (!searchParams.pageToken) {
      setSearchResults([]);
      // Reset pagination for new searches
      setPagination(prev => ({
        ...prev,
        currentPage: 1,
        nextPageToken: '',
      }));
    }
    
    // Add a small delay before making the request to improve user experience
    // This gives the loading state time to render and prevents the UI from feeling jumpy
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Build request payload according to Surfe API v2 documentation
      // https://api.surfe.com/v2/people/search endpoint structure
      // Build request payload according to Surfe API v2 documentation
      const result = await executeProvider.mutateAsync({
        providerId: selectedProvider.name,
        operation: 'search-people',
        params: {
          // Companies section - required for Surfe API
          companies: {
            // Company identifiers (at least one is required)
            domains: searchParams.companyDomains.length > 0 ? searchParams.companyDomains : undefined,
            domainsExcluded: searchParams.excludeDomains.length > 0 ? searchParams.excludeDomains : undefined,
            names: searchParams.companyNames.length > 0 ? searchParams.companyNames : undefined,
            
            // Company filters
            industries: searchParams.industries.length > 0 ? searchParams.industries : undefined,
            countries: searchParams.companyCountries.length > 0 ? searchParams.companyCountries : undefined,
            
            // Range filters with proper structure
            employeeCount: (searchParams.minEmployees || searchParams.maxEmployees) ? {
              from: parseInt(searchParams.minEmployees) || 1,
              to: parseInt(searchParams.maxEmployees) || 999999999
            } : undefined,
            revenue: (searchParams.minRevenue || searchParams.maxRevenue) ? {
              from: parseInt(searchParams.minRevenue) || 1,
              to: parseInt(searchParams.maxRevenue) || 999999999
            } : undefined,
          },
          // People section - optional filters
          people: {
            jobTitles: searchParams.jobTitles.length > 0 ? searchParams.jobTitles : undefined,
            seniorities: searchParams.seniorities.length > 0 ? searchParams.seniorities : undefined,
            departments: searchParams.departments.length > 0 ? searchParams.departments : undefined,
            countries: searchParams.peopleCountries.length > 0 ? searchParams.peopleCountries : undefined,
          },
          // Pagination and limits
          limit: searchParams.limit || 10,
          pageToken: searchParams.pageToken || '', // Include pageToken for pagination support
          peoplePerCompany: searchParams.peoplePerCompany || 5,
        },
      });

      // Handle the Surfe API response
      if (result.success && result.data && Array.isArray(result.data.people) && result.data.people.length > 0) {
        const searchResponse = result.data as PeopleSearchApiResponse;

        console.log('🔍 Frontend received data:', searchResponse);
console.log('🔍 People array:', searchResponse.people);
console.log('🔍 Total:', searchResponse.total);
        
        // Update search results - append for pagination, replace for new searches
        if (searchParams.pageToken) {
          // Append results for pagination
          setSearchResults(prev => [...prev, ...(searchResponse.people || [])]);
        } else {
          // Replace results for new searches
          setSearchResults(searchResponse.people || []);
        }
        
        // Update pagination state with nextPageToken from Surfe API
        setPagination(prev => ({
          ...prev,
          totalResults: searchResponse.total || (searchResponse.people?.length || 0),
          nextPageToken: searchResponse.nextPageToken || '',
          currentPage: searchParams.pageToken ? prev.currentPage + 1 : 1,
        }));
        
        // Update search params with the nextPageToken for subsequent searches
        setSearchParams(prev => ({
          ...prev,
          pageToken: searchResponse.nextPageToken || ''
        }));

        // Show appropriate success message
        if (searchParams.pageToken) {
          toast.success(`Loaded ${searchResponse.people?.length || 0} more results`);
        } else {
          toast.success(`Found ${searchResponse.total || (searchResponse.people?.length || 0)} results`);
        }
      } else {
        // Handle API errors where success is false
        const errorMessage = result.error?.message || 'No results found or an error occurred.';
        
        // Clear previous search results
        setSearchResults([]);
        
        // Add a delay before showing the error to improve user experience
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if it's a Surfe provider error (500 Internal Server Error)
        if (errorMessage.includes('Surfe provider error') || errorMessage.includes('500')) {
          // Set the error state for the ProviderError component
          setSearchError({
            message: 'The Surfe API is currently experiencing issues. This is not an issue with your search parameters or our application. Please try again later or contact Surfe support if the problem persists.',
            isProviderError: true
          });
          
          // Still show a toast for immediate feedback
          toast.error('Surfe API error: The service is currently unavailable', { duration: 3000 });
        } else {
          // Set a generic error
          setSearchError({
            message: errorMessage,
            isProviderError: false
          });
          toast.error(errorMessage);
        }
      }
    } catch (error: any) {
      // Handle network errors or other exceptions
      console.error("Search failed:", error);
      
      // Clear previous search results
      setSearchResults([]);
      
      // Add a delay before showing the error to improve user experience
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Provide more specific error messages based on error type
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
        setSearchError({
          message: 'Network connection error. Please check your internet connection and try again.',
          isProviderError: false
        });
        toast.error('Network connection error');
      } else if (error.message?.includes('Surfe') || error.message?.includes('500')) {
        setSearchError({
          message: 'The Surfe API is currently experiencing issues. Please try again later or contact Surfe support if the problem persists.',
          isProviderError: true
        });
        toast.error('Surfe API error: The service is currently unavailable', { duration: 3000 });
      } else {
        setSearchError({
          message: error.message || 'A network error occurred. Please check your connection and try again.',
          isProviderError: false
        });
        toast.error(error.message || 'A network error occurred', { duration: 3000 });
      }
    } finally {
      // 5. Unset Loading State
      setIsSearchLoading(false);
    }
  };

  // Pagination handlers
  const handleNextPage = () => {
    // Use the new handleLoadMore function for pagination
    handleLoadMore();
  };
  
  const handleExport = () => {
    if (searchResults.length === 0) {
      toast.error('No results to export');
      return;
    }
    
    const csvContent = [
      ['Name', 'Title', 'Company', 'Domain', 'Country', 'LinkedIn'].join(','),
      ...searchResults.map(person => [
        `"${person.firstName} ${person.lastName}"`,
        `"${person.jobTitle || ''}"`,
        `"${person.companyName || ''}"`,
        `"${person.companyDomain || ''}"`,
        `"${person.country || ''}"`,
        `"${person.linkedInUrl || ''}"`,
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `people-search-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Results exported to CSV');
  };

  const handleDomainCsvUpload = (field: 'companyDomains' | 'excludeDomains', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/);
      
      if (lines.length > 0) {
        const headers = lines[0].split(/[,;]\s*/);
        
        setCsvImportModal({
          show: true,
          headers,
          lines,
          field,
          selectedColumn: headers[0]
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImportColumns = () => {
    if (!csvImportModal.selectedColumn) {
      toast.error('Please select a column');
      return;
    }

    const columnIndex = csvImportModal.headers.indexOf(csvImportModal.selectedColumn);
    
    const domains = csvImportModal.lines
      .slice(1)
      .map(line => {
        const values = line.split(/[,;]\s*/);
        return DataCleaningService.cleanDomain(values[columnIndex]);
      })
      .filter((domain): domain is string => domain !== null);

    setSearchParams(prev => ({
      ...prev,
      [csvImportModal.field]: Array.from(new Set([...prev[csvImportModal.field], ...domains]))
    }));

    toast.success(`Imported ${domains.length} valid domains`);
    setCsvImportModal(prev => ({ ...prev, show: false, selectedColumn: '' }));
  };

  // New method to handle domain input changes
  const handleDomainChange = (field: 'companyDomains' | 'excludeDomains', value: string) => {
    // Update input value
    setDomainInput(prev => ({
      ...prev,
      [field]: value
    }));

    // Process domains
    const domains = value.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');

    // Validate domains
    const validationErrors: string[] = [];
    const cleanedDomains = domains.filter(domain => {
      const validation = DataCleaningService.validateDomainFeedback(domain);
      if (!validation.isValid) {
        validationErrors.push(`${domain}: ${validation.message}`);
        return false;
      }
      return true;
    });

    // Set validation errors
    setDomainValidationErrors(prev => ({
      ...prev,
      [field]: validationErrors
    }));

    // Update search parameters with cleaned domains
    setSearchParams(prev => ({
      ...prev,
      [field]: cleanedDomains
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/providers/${selectedProvider?.name || urlProviderName}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            People Search - {selectedProvider?.displayName || urlProviderName || 'Provider'}
          </h1>
        </div>
        </div>
      </div>

      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle>Search People</CardTitle>
          <CardDescription>
            Find contacts across companies using multiple filters. <strong>Note:</strong> You can search by company filters (domains, names, industries) OR by people filters (job titles, departments, seniority) or both.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="people" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="people">People Filters</TabsTrigger>
              <TabsTrigger value="company">Company Filters</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>
            
            <TabsContent value="people" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Titles</Label>
                  <textarea
                    className="w-full h-24 p-2 border rounded-md resize-none text-sm"
                    placeholder="VP of Marketing&#10;Head of Sales&#10;CEO"
                    value={searchParams.jobTitles.join('\n')}
                    onChange={(e) => handleTextareaChange('jobTitles', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">One title per line (max 100)</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Seniority Level</Label>
                  <SearchableSelect
                    options={getSeniorityOptions()}
                    value={searchParams.seniorities}
                    onValueChange={(value) => setSearchParams(prev => ({
                      ...prev, 
                      seniorities: value
                    }))}
                    placeholder="Select seniority levels..."
                    searchPlaceholder="Search seniorities..."
                    multiple={true}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Departments</Label>
                  <SearchableSelect
                    options={getDepartmentOptions()}
                    value={searchParams.departments}
                    onValueChange={(value) => setSearchParams(prev => ({
                      ...prev, 
                      departments: value
                    }))}
                    placeholder="Select departments..."
                    searchPlaceholder="Search departments..."
                    multiple={true}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>People Location</Label>
                  <SearchableSelect
                    options={getCountryOptions()}
                    value={searchParams.peopleCountries}
                    onValueChange={(value) => setSearchParams(prev => ({
                      ...prev, 
                      peopleCountries: value
                    }))}
                    placeholder="Select countries..."
                    searchPlaceholder="Search countries..."
                    multiple={true}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="company" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Include Domains</Label>
                  <div className="flex flex-col">
                    <textarea
                      className="w-full h-24 p-2 border rounded-md resize-none text-sm"
                      placeholder="google.com&#10;microsoft.com&#10;apple.com"
                      value={domainInput.companyDomains}
                      onChange={(e) => handleDomainChange('companyDomains', e.target.value)}
                    />
                    {domainValidationErrors.companyDomains.length > 0 && (
                      <div className="text-red-500 text-xs mt-1">
                        {domainValidationErrors.companyDomains.map((error, index) => (
                          <p key={index}>{error}</p>
                        ))}
                      </div>
                    )}

                    <div>
                      <Label className="block mb-2">Import CSV</Label>
                      <Input 
                        type="file" 
                        accept=".csv" 
                        className="w-full"
                        onChange={(e) => handleDomainCsvUpload('companyDomains', e)} // Add this
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{searchParams.companyDomains.length} valid domains</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Exclude Domains</Label>
                  <div className="flex items-center gap-2">
                    <textarea
                      className="w-full h-24 p-2 border rounded-md resize-none text-sm"
                      placeholder="competitor.com&#10;exclude.com"
                      value={domainInput.excludeDomains}
                      onChange={(e) => handleDomainChange('excludeDomains', e.target.value)}
                    />
                    {domainValidationErrors.excludeDomains.length > 0 && (
                      <div className="text-red-500 text-xs mt-1">
                        {domainValidationErrors.excludeDomains.map((error, index) => (
                          <p key={index}>{error}</p>
                        ))}
                      </div>
                    )}

                    <div>
                      <Label className="block mb-2">Import CSV</Label>
                      <Input 
                        type="file" 
                        accept=".csv" 
                        className="w-full"
                        onChange={(e) => handleDomainCsvUpload('excludeDomains', e)} // Add this
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{searchParams.excludeDomains.length} excluded</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Company Names</Label>
                  <textarea
                    className="w-full h-20 p-2 border rounded-md resize-none text-sm"
                    placeholder="Google&#10;Microsoft&#10;Apple"
                    value={searchParams.companyNames.join('\n')}
                    onChange={(e) => handleTextareaChange('companyNames', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Industries</Label>
                  <Input 
                    placeholder="Software, Technology, SaaS"
                    value={searchParams.industries.join(', ')}
                    onChange={(e) => setSearchParams(prev => ({
                      ...prev,
                      industries: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Company Countries</Label>
                  <Select 
                    value={searchParams.companyCountries[0] || ''}
                    onValueChange={(value) => setSearchParams(prev => ({
                      ...prev, 
                      companyCountries: value ? [value] : []
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Any">Any Country</SelectItem>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="fr">France</SelectItem>
                      <SelectItem value="gb">United Kingdom</SelectItem>
                      <SelectItem value="de">Germany</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Industries</Label>
                    <SearchableSelect
                      options={getIndustryOptions()}
                      value={searchParams.industries}
                      onValueChange={(value) => setSearchParams(prev => ({
                        ...prev, 
                        industries: value
                      }))}
                      placeholder="Select industries..."
                      searchPlaceholder="Search industries..."
                      multiple={true}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Company Location</Label>
                    <SearchableSelect
                      options={getCountryOptions()}
                      value={searchParams.companyCountries}
                      onValueChange={(value) => setSearchParams(prev => ({
                        ...prev, 
                        companyCountries: value
                      }))}
                      placeholder="Select countries..."
                      searchPlaceholder="Search countries..."
                      multiple={true}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Min Employees</Label>
                    <Input 
                      type="number"
                      placeholder="1"
                      value={searchParams.minEmployees}
                      onChange={(e) => setSearchParams(prev => ({...prev, minEmployees: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Employees</Label>
                    <Input 
                      type="number"
                      placeholder="10000"
                      value={searchParams.maxEmployees}
                      onChange={(e) => setSearchParams(prev => ({...prev, maxEmployees: e.target.value}))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Min Revenue ($)</Label>
                    <Input 
                      type="number"
                      placeholder="1000000"
                      value={searchParams.minRevenue}
                      onChange={(e) => setSearchParams(prev => ({...prev, minRevenue: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Revenue ($)</Label>
                    <Input 
                      type="number"
                      placeholder="100000000"
                      value={searchParams.maxRevenue}
                      onChange={(e) => setSearchParams(prev => ({...prev, maxRevenue: e.target.value}))}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="config" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Results Limit</Label>
                  <Select 
                    value={searchParams.limit.toString()}
                    onValueChange={(value) => setSearchParams(prev => ({...prev, limit: parseInt(value)}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>People per Company</Label>
                  <Select 
                    value={searchParams.peoplePerCompany.toString()}
                    onValueChange={(value) => setSearchParams(prev => ({...prev, peoplePerCompany: parseInt(value)}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 person</SelectItem>
                      <SelectItem value="2">2 people</SelectItem>
                      <SelectItem value="3">3 people</SelectItem>
                      <SelectItem value="4">4 people</SelectItem>
                      <SelectItem value="5">5 people</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <Button 
            className="w-full mt-6" 
            onClick={handleSearch}
            disabled={executeProvider.isPending}
            size="lg"
          >
            {executeProvider.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search People
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {searchError ? (
         <ProviderError 
           message={searchError.message} 
           isProviderError={searchError.isProviderError} 
           providerName="Surfe"
           supportEmail="api.support@surfe.com"
           onRetry={() => {
             setSearchError(null);
             handleSearch();
           }}
         />
       ) : searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>
                  Found {searchResults.length} contacts{totalResults > searchResults.length && ` (${totalResults.toLocaleString()} total available)`}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>LinkedIn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((person, index) => (
                  <TableRow key={index}>
                    <TableCell>{`${person.firstName} ${person.lastName}`}</TableCell>
                    <TableCell>{person.jobTitle}</TableCell>
                    <TableCell>{person.companyName}</TableCell>
                    <TableCell>{person.departments?.join(', ') || 'N/A'}</TableCell>
                    <TableCell>
                      {person.linkedInUrl ? (
                        <a 
                          href={person.linkedInUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline"
                        >
                          View Profile
                        </a>
                      ) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <Button 
                variant="outline"
                disabled={!pagination.nextPageToken || isSearchLoading}
                onClick={handleLoadMore}
              >
                {isSearchLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  <>Load More Results</>
                )}
              </Button>
              <span>
                Showing {searchResults.length} of {pagination.totalResults} results
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {csvImportModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-xl w-full">
            <h2 className="text-xl font-bold mb-4">Select Domain Column</h2>
            
            <div className="space-y-2 mb-4">
              <Label>Available Columns:</Label>
              <Select 
                value={csvImportModal.selectedColumn}
                onValueChange={(value) => 
                  setCsvImportModal(prev => ({ ...prev, selectedColumn: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {csvImportModal.headers.map(header => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setCsvImportModal(prev => ({ ...prev, show: false }))}
              >
                Cancel
              </Button>
              <Button onClick={handleImportColumns}>
                Import
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}