// frontend/src/app/providers/[name]/company-search/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ArrowLeft, Search, Loader2, Download, FileUp } from 'lucide-react';
import toast from 'react-hot-toast';

// Import necessary hooks and services
import { useProviderStore } from '@/lib/stores/providerStore';
import { useProviders } from '@/lib/api/providers';
import { useExecuteProvider } from '@/lib/api/providers';
import { DataCleaningService } from '@/utils/dataCleaning';
import axios from 'axios';

// TypeScript interfaces with enhanced typing
interface CompanySearchFilters {
  domains?: string[];
  domainsExcluded?: string[];
  names?: string[];
  industries?: string[];
  countries?: string[];
  employeeCount?: {
    from: number;
    to: number;
  };
  revenue?: {
    from: number;
    to: number;
  };
}

interface Company {
  name: string;
  domain: string;
  employeeCount: number;
  countries: string[];
  industries: string[];
  revenue: string;
}

interface CompanySearchResponse {
  companies: Company[];
  total?: number;
  nextPageToken?: string;
}

export default function CompanySearchPage() {
  // Navigation and routing
  const router = useRouter();
  const params = useParams();
  const urlProviderName = params.name as string;

  // State management hooks
  const { selectedProvider, setSelectedProvider } = useProviderStore();
  const { data: providers } = useProviders();
  const executeProvider = useExecuteProvider();

  // CSV Import State
  const [csvImportModal, setCsvImportModal] = useState<{
    show: boolean;
    headers: string[];
    lines: string[];
    field: 'domains' | 'domainsExcluded';
    selectedColumn: string;
  }>({
    show: false,
    headers: [],
    lines: [],
    field: 'domains',
    selectedColumn: ''
  });

  // Search State
  const [searchParams, setSearchParams] = useState<{
    domains: string[];
    domainsExcluded: string[];
    industries: string[];
    countries: string[];
    minEmployees: string;
    maxEmployees: string;
    minRevenue: string;
    maxRevenue: string;
    limit: number;
  }>({
    domains: [],
    domainsExcluded: [],
    industries: [],
    countries: [],
    minEmployees: '',
    maxEmployees: '',
    minRevenue: '',
    maxRevenue: '',
    limit: 50
  });

  // Results and Pagination State
  const [companyResults, setCompanyResults] = useState<Company[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalResults: 0,
    nextPageToken: '',
  });

  // Loading State
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // CSV Domain Upload Handler
  const handleDomainCsvUpload = (field: 'domains' | 'domainsExcluded', event: React.ChangeEvent<HTMLInputElement>) => {
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

  // Import Columns Handler
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

  // Company Search Handler
  const handleCompanySearch = async () => {
  // Validate provider selection
  if (!selectedProvider) {
    toast.error('Please select a provider before searching');
    return;
  }
  
  // Validate domain input
  const cleanedDomains = searchParams.domains
    .map(domain => DataCleaningService.cleanDomain(domain))
    .filter((domain): domain is string => domain !== null);

  const cleanedExcludedDomains = searchParams.domainsExcluded
    .map(domain => DataCleaningService.cleanDomain(domain))
    .filter((domain): domain is string => domain !== null);

  // Add search criteria validation HERE
  const hasSearchCriteria = 
    cleanedDomains.length > 0 ||
    cleanedExcludedDomains.length > 0 ||
    searchParams.industries.length > 0 ||
    searchParams.countries.length > 0 ||
    searchParams.minEmployees !== '' ||
    searchParams.maxEmployees !== '' ||
    searchParams.minRevenue !== '' ||
    searchParams.maxRevenue !== '';

  if (!hasSearchCriteria) {
    toast.error('Please provide at least one search filter');
    return;
  }

  setIsSearchLoading(true);

  try {
    if (!selectedProvider) {
      toast.error('No provider selected');
      setIsSearchLoading(false);
      return;
    }

    // Comprehensive debugging payload
    const payload = {
      providerId: selectedProvider.name,
      operation: 'search-companies',
      params: {
        domains: cleanedDomains,
        excludedDomains: cleanedExcludedDomains,
        industries: searchParams.industries,
        countries: searchParams.countries,
        employeeCountMin: searchParams.minEmployees 
          ? parseInt(searchParams.minEmployees) 
          : undefined,
        employeeCountMax: searchParams.maxEmployees 
          ? parseInt(searchParams.maxEmployees) 
          : undefined,
        revenueMin: searchParams.minRevenue 
          ? parseInt(searchParams.minRevenue) 
          : undefined,
        revenueMax: searchParams.maxRevenue 
          ? parseInt(searchParams.maxRevenue) 
          : undefined,
        limit: Math.min(Math.max(1, searchParams.limit), 200),
        pageToken: pagination.nextPageToken || ''
      }
    };

    // Remove undefined values
    const cleanedParams = Object.fromEntries(
      Object.entries(payload.params).filter(([_, value]) => 
        value !== undefined && 
        (Array.isArray(value) ? value.length > 0 : true)
      )
    );

    // Updated payload with cleaned params
    const finalPayload = {
      providerId: selectedProvider.name,
      operation: 'search-companies',
      params: cleanedParams
    };

    console.log('Final Payload:', finalPayload);

    // Extensive logging
    console.group('Company Search Debug');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('Selected Provider:', selectedProvider);
    console.log('Search Params:', searchParams);
    console.log('Cleaned Domains:', cleanedDomains);
    console.log('Cleaned Excluded Domains:', cleanedExcludedDomains);
    console.groupEnd();

    try {
      const result = await executeProvider.mutateAsync(finalPayload);

      // More detailed result logging
      console.group('Search Result');
      console.log('Raw Result:', result);
      console.log('Success:', result.success);
      console.log('Data:', result.data);
      console.log('Error:', result.error);
      console.groupEnd();

      // Process search results
      if (result.success && result.data?.companies) {
        const searchResponse = result.data as CompanySearchResponse;
        
        setCompanyResults(searchResponse.companies);
        setPagination(prev => ({
          ...prev,
          totalResults: searchResponse.total || searchResponse.companies.length,
          nextPageToken: searchResponse.nextPageToken || '',
        }));

        toast.success(`Found ${searchResponse.total || searchResponse.companies.length} companies`);
      } else {
        // More detailed error handling
        const errorMessage = result.error?.message || 'No companies found';
        toast.error(errorMessage);
        setCompanyResults([]);
      }
    } catch (mutationError: any) {
      // Axios or other mutation-specific error handling
      console.group('Mutation Error');
      console.error('Mutation Error:', mutationError);
      
      // Check if it looks like an AxiosError
      const isAxiosError = mutationError.isAxiosError === true;

      if (isAxiosError) {
        console.log('Axios Error Details:', {
          response: mutationError.response?.data,
          status: mutationError.response?.status,
          headers: mutationError.response?.headers
        });

        // More specific error messages
        if (mutationError.response) {
          // The request was made and the server responded with a status code
          toast.error(`API Error: ${mutationError.response.status} - ${JSON.stringify(mutationError.response.data)}`);
        } else if (mutationError.request) {
          // The request was made but no response was received
          toast.error('No response received from server');
        } else {
          // Something happened in setting up the request
          toast.error(`Error: ${mutationError.message}`);
        }
      } else {
        // Non-Axios error
        toast.error(`Search failed: ${mutationError.message}`);
      }
      console.groupEnd();
    }
  } catch (error) {
    console.group('Unexpected Error');
    console.error('Unexpected Error:', error);
    console.groupEnd();

    toast.error('An unexpected error occurred during company search');
  } finally {
    setIsSearchLoading(false);
  }
};

  // Export Results to CSV
  const handleExport = () => {
    if (companyResults.length === 0) {
      toast.error('No results to export');
      return;
    }
    
    const csvContent = [
      ['Name', 'Domain', 'Countries', 'Industries', 'Employee Count', 'Revenue'].join(','),
      ...companyResults.map(company => [
        `"${company.name}"`,
        `"${company.domain}"`,
        `"${company.countries.join('|')}"`,
        `"${company.industries.join('|')}"`,
        `"${company.employeeCount}"`,
        `"${company.revenue}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `company-search-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Companies exported to CSV');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/providers/${selectedProvider?.name || urlProviderName}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          Company Search - {selectedProvider?.displayName || 'Provider'}
        </h1>
      </div>

      {/* Search Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Company Search Filters</CardTitle>
          <CardDescription>
            Find companies using multiple search criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Domains */}
            <div className="space-y-2">
              <Label>Include Domains</Label>
              <div className="flex items-center gap-2">
                <textarea
                  className="w-full h-24 p-2 border rounded-md resize-none text-sm"
                  placeholder="google.com&#10;microsoft.com&#10;apple.com"
                  value={searchParams.domains.join('\n')}
                  onChange={(e) => {
                    const domains = e.target.value.split('\n').map(domain => domain.trim()).filter(Boolean);
                    setSearchParams(prev => ({ ...prev, domains }));
                  }}
                />
                <div>
                  <Label className="block mb-2">Import CSV</Label>
                  <Input 
                    type="file" 
                    accept=".csv" 
                    className="w-full"
                    onChange={(e) => handleDomainCsvUpload('domains', e)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{searchParams.domains.length} domains</p>
            </div>

            {/* Excluded Domains */}
            <div className="space-y-2">
              <Label>Exclude Domains</Label>
              <div className="flex items-center gap-2">
                <textarea
                  className="w-full h-24 p-2 border rounded-md resize-none text-sm"
                  placeholder="competitor.com&#10;exclude.com"
                  value={searchParams.domainsExcluded.join('\n')}
                  onChange={(e) => {
                    const domains = e.target.value.split('\n').map(domain => domain.trim()).filter(Boolean);
                    setSearchParams(prev => ({ ...prev, domainsExcluded: domains }));
                  }}
                />
                <div>
                  <Label className="block mb-2">Import CSV</Label>
                  <Input 
                    type="file" 
                    accept=".csv" 
                    className="w-full"
                    onChange={(e) => handleDomainCsvUpload('domainsExcluded', e)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{searchParams.domainsExcluded.length} excluded domains</p>
            </div>

            {/* Industries */}
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

            {/* Countries */}
            <div className="space-y-2">
              <Label>Countries</Label>
              <Input 
                placeholder="US, FR, GB"
                value={searchParams.countries.join(', ')}
                onChange={(e) => setSearchParams(prev => ({
                  ...prev,
                  countries: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }))}
              />
            </div>

            {/* Employee Count */}
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

            {/* Revenue */}
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

            {/* Results Limit */}
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
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Button */}
          <Button 
            className="w-full mt-6" 
            onClick={handleCompanySearch}
            disabled={isSearchLoading}
            size="lg"
          >
            {isSearchLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching Companies...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Companies
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Search Results */}
      {companyResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Company Search Results</CardTitle>
                <CardDescription>
                  Found {companyResults.length} companies
                  {pagination.totalResults > companyResults.length && 
                    ` (${pagination.totalResults.toLocaleString()} total available)`}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                {pagination.nextPageToken && (
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      // Trigger search with next page token
                      setIsSearchLoading(true);
                      try {
                        if (!selectedProvider) {
                          toast.error('No provider selected');
                          setIsSearchLoading(false);
                          return;
                        }
                        const result = await executeProvider.mutateAsync({
                          providerId: selectedProvider.name,
                          data: {
                            operation: 'search-companies',
                            params: {
                              filters: {
                                domains: searchParams.domains,
                                domainsExcluded: searchParams.domainsExcluded,
                                industries: searchParams.industries,
                                countries: searchParams.countries,
                                employeeCount: searchParams.minEmployees || searchParams.maxEmployees 
                                  ? {
                                      from: parseInt(searchParams.minEmployees) || 1,
                                      to: parseInt(searchParams.maxEmployees) || 999999999
                                    } 
                                  : undefined,
                                revenue: searchParams.minRevenue || searchParams.maxRevenue
                                  ? {
                                      from: parseInt(searchParams.minRevenue) || 1,
                                      to: parseInt(searchParams.maxRevenue) || 999999999
                                    }
                                  : undefined,
                              },
                              limit: searchParams.limit,
                              pageToken: pagination.nextPageToken
                            }
                          },
                        } as any);

                        if (result.success && result.data?.companies) {
                          const newResults = [...companyResults, ...result.data.companies];
                          setCompanyResults(newResults);
                          setPagination(prev => ({
                            ...prev,
                            nextPageToken: result.data.nextPageToken || '',
                          }));
                        }
                      } catch (error) {
                        toast.error('Failed to load more results');
                        console.error(error);
                      } finally {
                        setIsSearchLoading(false);
                      }
                    }}
                  >
                    Load More
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Countries</TableHead>
                  <TableHead>Industries</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyResults.map((company, index) => (
                  <TableRow key={index}>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>
                      {company.domain && (
                        <a 
                          href={`https://${company.domain}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {company.domain}
                        </a>
                      )}
                    </TableCell>
                    <TableCell>{company.countries.join(', ')}</TableCell>
                    <TableCell>{company.industries.join(', ')}</TableCell>
                    <TableCell>{company.employeeCount.toLocaleString()}</TableCell>
                    <TableCell>{company.revenue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* CSV Import Modal */}
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

            {/* Preview of first few rows */}
            <div className="mb-4">
              <Label>Data Preview:</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    {csvImportModal.headers.map(header => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvImportModal.lines.slice(1, 4).map((line, index) => {
                    const values = line.split(/[,;]\s*/);
                    return (
                      <TableRow key={index}>
                        {values.map((value, colIndex) => (
                          <TableCell key={colIndex}>{value}</TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
