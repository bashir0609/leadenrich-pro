// frontend/src/app/providers/[name]/page.tsx
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

// Import necessary hooks and services
import { useProviderStore } from '@/lib/stores/providerStore';
import { useProviders } from '@/lib/api/providers';
import { useExecuteProvider } from '@/lib/api/providers';
import { DataCleaningService } from '@/utils/dataCleaning';

export default function PeopleSearchPage() {
  // Navigation and routing
  const router = useRouter();
  const params = useParams();
  const urlProviderName = params.name as string;

  // State management hooks
  const { selectedProvider, setSelectedProvider } = useProviderStore();
  const { data: providers, isLoading: isProvidersLoading } = useProviders();
  const executeProvider = useExecuteProvider();

  // Hydration-safe state
  const [isClient, setIsClient] = useState(false);

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
    
    // Configuration
    limit: 25,
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
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalResults: 0,
    nextPageToken: '',
  });

  // Loading state
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Hydration effect
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Provider selection effect
  useEffect(() => {
    if (isClient && providers && urlProviderName) {
      const provider = providers.find(p => p.name === urlProviderName);
      if (provider) {
        setSelectedProvider(provider);
      }
    }
  }, [isClient, providers, urlProviderName, setSelectedProvider]);
  
  

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

  // Prevent hydration errors
  if (!isClient) {
    return null;
  }

  // Validation and search handler
  const handleSearch = async () => {
    // Validate before searching
    if (!searchParams.companyDomains || searchParams.companyDomains.length === 0  ) {
      toast.error('Company domain is required');
      return;
    }

    // Ensure we have a provider
    if (!selectedProvider) {
      toast.error('Please select a provider');
      return;
    }

    // Start loading
    setIsSearchLoading(true);

    try {
      // Construct Surfe-specific payload
      const surfePayload = {
        companies: {
          domains: [searchParams.companyDomains],
          countries: searchParams.companyCountries ? [searchParams.companyCountries] : [],
          // Optional additional company filters can be added here
          employeeCount: {
            from: 1,
            to: 999999999999999
          }
        },
        people: {
          jobTitles: searchParams.jobTitles ? [searchParams.jobTitles] : [],
          seniorities: searchParams.seniorities ? [searchParams.seniorities] : [],
          departments: searchParams.departments ? [searchParams.departments] : [],
          countries: searchParams.peopleCountries ? [searchParams.peopleCountries] : []
        },
        limit: 10,
        pageToken: pagination.nextPageToken || '',
        peoplePerCompany: 5
      };

      const result = await executeProvider.mutateAsync({
        providerId: selectedProvider.name,
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
          peoplePerCompany: searchParams.peoplePerCompany,
          pageToken: "",
        },
      });

      // Process successful search
      if (result.success && result.data?.people) {
        setSearchResults(result.data.people);
        setPagination(prev => ({
          ...prev,
          totalResults: result.data.total || result.data.people.length,
          nextPageToken: result.data.nextPageToken || '',
        }));

        // Notify success
        toast.success(`Found ${result.data.total || result.data.people.length} results`);
      } else {
        // Handle no results
        toast.error(result.error?.message || 'No results found');
        setSearchResults([]);
      }
    } catch (error) {
      // Handle search error
      toast.error('Search failed. Please try again.');
      console.error(error);
    } finally {
      // Stop loading
      setIsSearchLoading(false);
    }
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (pagination.nextPageToken) {
      handleSearch();
    }
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
            Find contacts across companies using multiple filters
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
                  <Label>Seniority Levels</Label>
                  <Select 
                    value={searchParams.seniorities[0] || ''}
                    onValueChange={(value) => setSearchParams(prev => ({
                      ...prev, 
                      seniorities: value ? [value] : []
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select seniority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Any">Any Seniority</SelectItem>
                      <SelectItem value="Founder">Founder</SelectItem>
                      <SelectItem value="C-Level">C-Level</SelectItem>
                      <SelectItem value="VP">VP</SelectItem>
                      <SelectItem value="Director">Director</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Departments</Label>
                  <Select 
                    value={searchParams.departments[0] || ''}
                    onValueChange={(value) => setSearchParams(prev => ({
                      ...prev, 
                      departments: value ? [value] : []
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Any">Any Department</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Management">Management</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>People Location</Label>
                  <Select 
                    value={searchParams.peopleCountries[0] || ''}
                    onValueChange={(value) => setSearchParams(prev => ({
                      ...prev, 
                      peopleCountries: value ? [value] : []
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Any">Any Country</SelectItem>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="fr">France</SelectItem>
                      <SelectItem value="gb">United Kingdom</SelectItem>
                      <SelectItem value="de">Germany</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="company" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Include Domains</Label>
                  <div className="flex items-center gap-2">
                    <textarea
                      className="w-full h-24 p-2 border rounded-md resize-none text-sm"
                      placeholder="google.com&#10;microsoft.com&#10;apple.com"
                      value={searchParams.companyDomains.join('\n')}
                      onChange={(e) => handleTextareaChange('companyDomains', e.target.value)}
                    />

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
                  <p className="text-xs text-muted-foreground">{searchParams.companyDomains.length} domains</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Exclude Domains</Label>
                  <div className="flex items-center gap-2">
                    <textarea
                      className="w-full h-24 p-2 border rounded-md resize-none text-sm"
                      placeholder="competitor.com&#10;exclude.com"
                      value={searchParams.excludeDomains.join('\n')}
                      onChange={(e) => handleTextareaChange('excludeDomains', e.target.value)}
                    />

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
      {searchResults.length > 0 && (
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
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {pagination.totalResults} people found
            </CardDescription>
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
                disabled={!pagination.nextPageToken}
                onClick={handleNextPage}
              >
                Next Page
              </Button>
              <span>
                Total Results: {pagination.totalResults}
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