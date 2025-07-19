// frontend/src/app/providers/[name]/company-enrichment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Search, Loader2, Copy, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Papa from 'papaparse';

// Import necessary hooks and services
import { useProviderStore } from '@/lib/stores/providerStore';
import { useExecuteProvider, useProviders, useCreateBulkJob } from '@/lib/api/providers';
import { useJobStatus } from '@/lib/api/jobs'; // Import the job status hook
import { DataCleaningService } from '@/utils/dataCleaning';
import { FileUpload } from '@/components/common/FileUpload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell  } from '@/components/ui/table';

// TypeScript interfaces
interface DigitalPresence {
  name: string;
  url: string;
}

interface FundingRound {
  amount: number;
  amountCurrency: string;
  announcedDate: string;
  leadInvestors: string[];
  name: string;
}

interface ParentOrganization {
  name: string;
  website: string;
}

interface Stock {
  exchange: string;
  ticker: string;
}

interface CompanyEnrichmentResponse {
  domain: string;
  description: string;
  digitalPresence: DigitalPresence[];
  employeeCount: number;
  externalID?: string;
  followersCountLinkedin: number;
  founded: string;
  fundingRounds?: FundingRound[];
  hqAddress: string;
  hqCountry: string;
  industry: string;
  subIndustry?: string;
  keywords: string[];
  linkedInURL: string;
  name: string;
  parentOrganization?: ParentOrganization;
  phones: string[];
  revenue: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  stocks?: Stock[];
  websites: string[];
  logoUrl?: string;
  isPublic?: boolean;
  error?: string;
}

// Enhanced error interface
interface EnrichmentError {
  error: string;
  operation: string;
  requestId: string;
  responseTime: number;
  service: string;
  timestamp: string;
  details?: any;
}

export default function CompanyEnrichmentPage() {
  // Add hydration safety
  const [isClient, setIsClient] = useState(false);

  // Component State
  const [domainInput, setDomainInput] = useState('');
  const [enrichmentResults, setEnrichmentResults] = useState<CompanyEnrichmentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [enrichmentId, setEnrichmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [csvImportModal, setCsvImportModal] = useState<{
    show: boolean;
    headers: string[];
    lines: {[key: string]: string}[]; // Changed from string[]
    selectedColumn: string;
  }>({
    show: false,
    headers: [],
    lines: [],
    selectedColumn: ''
  });
  // Navigation and routing
  const router = useRouter();
  const params = useParams();

  // Get URL provider name
  const urlProviderName = params.name as string;

  // State management hooks
  const { selectedProvider, setSelectedProvider } = useProviderStore();
  const { data: providers } = useProviders();
  const executeProvider = useExecuteProvider();

  // Add these new state variables at the top of your component:

  const [bulkDomains, setBulkDomains] = useState<string[]>([]);
  const [bulkResults, setBulkResults] = useState<CompanyEnrichmentResponse[]>([]);
  const [bulkEnrichmentStatus, setBulkEnrichmentStatus] = useState<{
    status: string;
    completed: number;
    total: number;
    percentCompleted: number;
  }>({
    status: 'idle',
    completed: 0,
    total: 0,
    percentCompleted: 0
  });
  const [activeTab, setActiveTab] = useState<string>('single');
  
  // Add this new state variable at the top of your component
  const [importErrors, setImportErrors] = useState<{domain: string, message: string}[]>([]);

  // Add hydration effect
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Provider selection effect - make it depend on isClient
  useEffect(() => {
    if (isClient && providers && urlProviderName) {
      const provider = providers.find(p => p.name === urlProviderName);
      if (provider) {
        setSelectedProvider(provider);
      }
    }
  }, [isClient, providers, urlProviderName, setSelectedProvider]);

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Company Enrichment</h1>
            <p className="text-muted-foreground">Loading provider...</p>
          </div>
        </div>
      </div>
    );
  }

  // Safe display name function
  const getProviderDisplayName = () => {
    if (selectedProvider?.displayName) {
      return selectedProvider.displayName;
    }
    // Fallback: capitalize the URL provider name
    if (urlProviderName) {
      return urlProviderName.charAt(0).toUpperCase() + urlProviderName.slice(1);
    }
    return 'Provider';
  };

  // Copy to clipboard utility
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Enhanced domain validation
  const validateDomain = (domain: string): boolean => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    return domainRegex.test(domain);
  };

  // Error handling utility
  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    
    let errorMessage = 'An unexpected error occurred';
    
    // Handle different error formats
    if (error?.response?.data) {
      const errorData = error.response.data;
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData.error) {
        errorMessage = `${errorData.error}${errorData.requestId ? ` (Request ID: ${errorData.requestId})` : ''}`;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else {
        errorMessage = JSON.stringify(errorData);
      }
    } else if (error?.data) {
      const errorData = error.data;
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData.error) {
        errorMessage = `${errorData.error}${errorData.requestId ? ` (Request ID: ${errorData.requestId})` : ''}`;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else {
        errorMessage = JSON.stringify(errorData);
      }
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      // Try to extract useful information from the error object
      if (error.error) {
        errorMessage = error.error;
      } else if (error.details) {
        errorMessage = JSON.stringify(error.details);
      } else {
        errorMessage = JSON.stringify(error);
      }
    }
    
    setError(errorMessage);
    toast.error(errorMessage);
    setIsLoading(false);
    setEnrichmentId(null);
  };

  const mapCompanyDataToResponse = (companyData: any): CompanyEnrichmentResponse => {
    const safeGet = (value: any, fallback: any = '') => {
      if (value === null || value === undefined) return fallback;
      if (typeof value === 'string' && value.trim() === '') return fallback;
      return value;
    };

    return {
      name: safeGet(companyData.name, 'Unknown Company'),
      domain: safeGet(companyData.domain || companyData.additionalData?.websites?.[0], ''),
      description: safeGet(companyData.description, 'No description available'),
      industry: safeGet(companyData.industry, 'Unknown Industry'),
      subIndustry: safeGet(companyData.additionalData?.subIndustry, ''),
      employeeCount: companyData.additionalData?.employeeCount ?? (companyData.size ? parseInt(companyData.size) : 0),
      founded: safeGet(companyData.additionalData?.founded, 'Not available'),
      revenue: safeGet(companyData.additionalData?.revenue, 'Not available'),
      hqAddress: safeGet(companyData.location, '') || safeGet(companyData.additionalData?.hqAddress, 'Not available'),
      hqCountry: safeGet(companyData.additionalData?.hqCountry, 'Not available'),
      linkedInURL: safeGet(companyData.linkedinUrl, ''),
      websites: companyData.additionalData?.websites || [],
      phones: companyData.additionalData?.phones || [],
      keywords: companyData.technologies || [],
      digitalPresence: companyData.additionalData?.digitalPresence || [],
      fundingRounds: companyData.additionalData?.fundingRounds || [],
      parentOrganization: companyData.additionalData?.parentOrganization,
      stocks: companyData.additionalData?.stocks || [],
      isPublic: companyData.additionalData?.isPublic ?? false,
      followersCountLinkedin: companyData.additionalData?.followersLinkedIn ?? 0,
      logoUrl: companyData.additionalData?.logoUrl,
      status: 'COMPLETED' as const,
      externalID: companyData.additionalData?.externalID
    };
  };

  // Enhanced enrichment handler - backend handles polling internally
  const handleCompanyEnrichment = async () => {
    // Reset previous state
    setError(null);
    setEnrichmentResults(null);
    setRetryCount(0);

    // Validate provider selection
    if (!selectedProvider) {
      const errorMsg = 'Please select a provider';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Enhanced domain validation
    const cleanedDomain = DataCleaningService.cleanDomain(domainInput);
    if (!cleanedDomain || !validateDomain(cleanedDomain)) {
      const errorMsg = 'Please enter a valid domain (e.g., google.com)';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);

    try {
      // Prepare enrichment payload - backend handles polling internally
      const enrichmentPayload = {
        providerId: selectedProvider.name,
        operation: 'enrich-company', // Changed to singular
        params: {
          companies: [{ domain: cleanedDomain }] // Backend expects single domain parameter
        }
      };

      console.log('Starting enrichment with payload:', enrichmentPayload);

      // Single call - backend handles the polling internally
      const result = await executeProvider.mutateAsync(enrichmentPayload);

      console.log('Enrichment result:', result);

      // Replace the mapping section in your handleCompanyEnrichment function
      // Find this section and replace it with this corrected version:

      if (result.success && result.data) {
        const companyData = Array.isArray(result.data) ? result.data[0] : result.data;
        
      if (companyData) {
          // Use the reusable helper function for consistency
          const mappedData = mapCompanyDataToResponse(companyData);
          setEnrichmentResults(mappedData);
          toast.success('Company enrichment completed successfully');
        } else {
          throw new Error('No company data found in response');
        }
      } else {
        const errorMsg = result.error?.message || result.message || 'Failed to enrich company';
        throw new Error(errorMsg);
      }

    } catch (error) {
      handleError(error, 'company enrichment');
    } finally {
      setIsLoading(false);
    }
  };

  // Replace the entire handleDomainCsvUpload function
  const handleDomainCsvUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File too large. Please upload files smaller than 5MB.');
      return;
    }

    // Use PapaParse to robustly handle the file
    Papa.parse(file, {
      header: true, // Automatically use the first row as headers
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields;
        if (!headers || results.errors.length > 0) {
          toast.error('Error parsing CSV file. Please check the format.');
          console.error("CSV Parsing Errors:", results.errors);
          return;
        }
        
        setCsvImportModal({
          show: true,
          headers: headers,
          lines: results.data as {[key: string]: string}[],
          selectedColumn: headers[0] || '',
        });
      },
      error: (err) => {
        toast.error('A critical error occurred while parsing the file.');
        console.error('PapaParse Error:', err);
      },
    });
  };

  // Replace the entire handleImportColumns function
  const handleImportColumns = async () => {
    if (!csvImportModal.selectedColumn) {
      toast.error('Please select a column containing domains');
      return;
    }

    setImportErrors([]);
    
    const validDomains = new Set<string>();
    const invalidEntries: {domain: string, message: string}[] = [];

    // Process each row object from PapaParse
    csvImportModal.lines.forEach(row => {
      const rawDomain = row[csvImportModal.selectedColumn]; // Access data by header name

      // The validation logic remains the same
      if (rawDomain) {
        const validationResult = DataCleaningService.validateDomainFeedback(rawDomain);
        if (validationResult.isValid && validationResult.cleaned) {
          validDomains.add(validationResult.cleaned);
        } else if (validationResult.message) {
          invalidEntries.push({ domain: rawDomain, message: validationResult.message });
        }
      }
    });

    const uniqueValidDomains = Array.from(validDomains);

    if (uniqueValidDomains.length === 0) {
      toast.error('No valid domains found in the selected column.');
      setImportErrors(invalidEntries.slice(0, 10));
      return;
    }

    // FIX: Added the check for the new 500 domain limit
    if (uniqueValidDomains.length > 500) {
      toast.error('Maximum 500 domains allowed per batch.');
      return;
    }

    if (invalidEntries.length > 0) {
      toast.success(
        `${uniqueValidDomains.length} valid domains loaded. ${invalidEntries.length} invalid rows were ignored.`, 
        { duration: 5000 }
      );
      setImportErrors(invalidEntries.slice(0, 10));
    } else {
      toast.success(`${uniqueValidDomains.length} domains loaded and ready for enrichment.`);
    }

    setBulkDomains(uniqueValidDomains);
    setCsvImportModal(prev => ({ ...prev, show: false }));
  };

  // Replace the entire handleBulkEnrichment function
  const handleBulkEnrichment = async () => {
    console.log('🚀 Starting bulk enrichment...');
    
    if (!selectedProvider) {
      toast.error('Please select a provider');
      return;
    }

    if (!bulkDomains || bulkDomains.length === 0) {
      toast.error('No domains to enrich. Please upload a CSV file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setBulkResults([]);

    try {
      const bulkEnrichmentPayload = {
        providerId: selectedProvider.name,
        operation: 'enrich-company',
        params: {
          companies: bulkDomains.map(domain => ({ domain }))
        }
      };

      console.log(`📤 Sending bulk request for ${bulkDomains.length} domains...`);
      const result = await executeProvider.mutateAsync(bulkEnrichmentPayload);
      console.log('📥 Received final bulk result from backend:', result);

      if (result.success && result.data) {
        // The backend now returns the final, complete array of results directly.
        setBulkResults(result.data.map(mapCompanyDataToResponse));
        toast.success(`Enrichment complete! Found data for ${result.data.length} companies.`);
      } else {
        throw new Error(result.error?.message || 'Bulk enrichment failed');
      }

    } catch (error) {
      console.error('💥 Bulk enrichment error:', error);
      handleError(error, 'bulk enrichment');
    } finally {
      setIsLoading(false);
    }
  };

  // Replace the entire pollBulkEnrichmentResults function
  const pollBulkEnrichmentResults = async (enrichmentId: string) => {
    console.log('🔄 Starting polling for enrichment ID:', enrichmentId);
    const maxAttempts = 120; // 10 minute timeout (120 attempts * 5 seconds)
    let attempts = 0;

    const poll = async () => {
      if (!enrichmentId || attempts >= maxAttempts) {
        if (attempts >= maxAttempts) {
          console.error('⏰ Bulk enrichment timeout after', maxAttempts, 'attempts');
          setError('Bulk enrichment timeout');
          setIsLoading(false);
          setEnrichmentId(null);
        }
        return;
      }

      try {
        console.log(`📊 Polling attempt ${attempts + 1}/${maxAttempts} for ID: ${enrichmentId}`);
        
        attempts++;
        const statusResult = await executeProvider.mutateAsync({
          providerId: selectedProvider?.name || 'surfe',
          operation: 'check-enrichment-status',
          params: { enrichmentId }
        });

        // Add detailed logging to see the exact response from the backend
        console.log('📥 Raw status result from backend:', JSON.stringify(statusResult, null, 2));

        if (statusResult.success && statusResult.data) {
          // FIX: Robustly unwrap the nested data structure from the backend.
          // The backend response is nested as { success, data: { success, data: { status, ... } } }
          const responseData = statusResult.data.data ? statusResult.data.data : statusResult.data;
          
          // Check if the unwrapped data has the properties we need
          if (typeof responseData.status === 'undefined') {
            console.error("❌ Polling response is missing 'status' field. Full response:", responseData);
            throw new Error('Invalid polling response format from server.');
          }

          const { status, companies, percentCompleted } = responseData;

          console.log(`✅ Parsed status: ${status}, Percent: ${percentCompleted}`);

          setBulkEnrichmentStatus({
            status: status,
            completed: companies?.length || 0,
            total: bulkDomains.length,
            percentCompleted: percentCompleted || 0
          });

          if (status === 'COMPLETED') {
            console.log('🎉 Bulk enrichment completed!', companies?.length || 0, 'companies enriched');
            
            // Map the nested backend data to the flat UI-ready format
            setBulkResults((companies || []).map(mapCompanyDataToResponse));
            
            setIsLoading(false);
            setEnrichmentId(null);
            toast.success(`Bulk enrichment completed! ${companies?.length || 0} companies enriched.`);
            return;
          }

          if (status === 'FAILED') {
            throw new Error('Bulk enrichment process failed on the provider side.');
          }

          setTimeout(poll, 5000); // Continue polling
        } else {
          // Handle cases where the top-level API call was not successful
          throw new Error(statusResult.error?.message || 'Invalid response from status check');
        }
      } catch (error: any) {
        console.error('💥 Polling error:', error);
        setError(error.message || 'Failed to check enrichment status.');
        setIsLoading(false);
        setEnrichmentId(null);
      }
    };

    poll();
  };


  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            Company Enrichment - {getProviderDisplayName()}
          </h1>
          <p className="text-muted-foreground">
            {getProviderDisplayName()} - Enrich company data with comprehensive information
          </p>
        </div>
      </div>
      
      <p className="text-muted-foreground">
        Enrich company data using the selected provider's API.
      </p>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="single" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Enrichment</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Enrichment</TabsTrigger>
        </TabsList>

        {/* Single Enrichment Section */}
        <TabsContent value="single" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Single Company Enrichment</CardTitle>
              <CardDescription>
                Enrich a single company by entering its domain (e.g., google.com)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input 
                  placeholder="Enter company domain (e.g. google.com)"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleCompanyEnrichment()}
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleCompanyEnrichment}
                  disabled={isLoading || !domainInput.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enriching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Enrich Company
                    </>
                  )}
                </Button>
              </div>
              
              {isLoading && enrichmentId && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-700">
                    Enrichment in progress... (ID: {enrichmentId})
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Bulk Enrichment Section */}
        <TabsContent value="bulk" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Enrichment</CardTitle>
              <CardDescription>
                Upload a CSV file with company domains to enrich (max 500 domains per batch)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={handleDomainCsvUpload}
                accept={{
                  'text/csv': ['.csv'],
                  'application/vnd.ms-excel': ['.xls'],
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                }}
                disabled={isLoading}
              />

              {importErrors.length > 0 && (
                <div className="mt-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold mb-2">We couldn't import all rows. Here are some examples:</p>
                      <ul className="list-disc pl-5 text-xs">
                        {importErrors.map((error, index) => (
                          <li key={index}>
                            <strong>{error.domain}</strong>: {error.message}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {/* Show loaded domains */}
              {bulkDomains.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800">Ready for Enrichment</h4>
                  <p className="text-sm text-green-700 mt-1">
                    {bulkDomains.length} domains loaded: {bulkDomains.slice(0, 3).join(', ')}
                    {bulkDomains.length > 3 && ` and ${bulkDomains.length - 3} more...`}
                  </p>
                  <Button 
                    onClick={handleBulkEnrichment}
                    disabled={isLoading}
                    className="mt-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enriching...
                      </>
                    ) : (
                      'Start Bulk Enrichment'
                    )}
                  </Button>
                </div>
              )}

              {/* Show enrichment progress */}
              {isLoading && enrichmentId && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800">Enrichment in Progress</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Status: {bulkEnrichmentStatus.status} - {bulkEnrichmentStatus.percentCompleted}% complete
                  </p>
                  <p className="text-sm text-blue-700">
                    Completed: {bulkEnrichmentStatus.completed} / {bulkEnrichmentStatus.total}
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${bulkEnrichmentStatus.percentCompleted}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Show bulk results */}
              {bulkResults.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Enrichment Results ({bulkResults.length} companies)</h4>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => {
                          // This is the existing JSON export logic
                          const dataStr = JSON.stringify(bulkResults, null, 2);
                          const dataBlob = new Blob([dataStr], {type: 'application/json'});
                          const url = URL.createObjectURL(dataBlob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `bulk_enrichment_results_${new Date().toISOString().split('T')[0]}.json`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          toast.success('JSON results exported');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Export JSON
                      </Button>
                      <Button 
                        onClick={() => {
                          // New CSV Export Logic
                          const csv = Papa.unparse(bulkResults);
                          const dataBlob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
                          const url = URL.createObjectURL(dataBlob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `bulk_enrichment_results_${new Date().toISOString().split('T')[0]}.csv`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          toast.success('CSV results exported');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Export CSV
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 max-h-96 overflow-y-auto">
                    {bulkResults.map((company, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium">{company.name}</h5>
                            <p className="text-sm text-muted-foreground">{company.description}</p>
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Industry:</span> {company.industry}<br/>
                              {/* FIX: Correctly render 0 for employee count */}
                              <span className="font-medium">Employees:</span> {company.employeeCount != null ? company.employeeCount.toLocaleString() : 'N/A'}<br/>
                              <span className="font-medium">Revenue:</span> {company.revenue || 'N/A'}
                            </div>
                          </div>
                          <Button 
                            onClick={() => {
                              // Use the mapping function before setting the state
                              const mappedCompany = mapCompanyDataToResponse(company);
                              setEnrichmentResults(mappedCompany);
                              setActiveTab('single'); // Switch to single tab to view details
                            }}
                            variant="outline"
                            size="sm"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">CSV Format Requirements</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Your CSV should include a column with company domains
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Required: Column containing company domains (e.g., google.com)</li>
                  <li>• Optional: Company names, additional information</li>
                  <li>• Maximum: 500 domains per batch</li>
                  <li>• File size limit: 5MB</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Section */}
      {isLoading && !enrichmentResults && (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}
      {activeTab === 'single' && enrichmentResults && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{enrichmentResults.name}</CardTitle>
                <CardDescription>{enrichmentResults.description}</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                {/* Export Buttons */}
                <Button 
                  onClick={() => {
                    const dataStr = JSON.stringify(enrichmentResults, null, 2);
                    const dataBlob = new Blob([dataStr], {type: 'application/json'});
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${enrichmentResults.name || 'company'}_data.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    toast.success('JSON file downloaded');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Export JSON
                </Button>
                
                <Button 
                  onClick={() => {
                    // Convert to CSV format
                    const csvRows = [];
                    
                    // Add basic company info
                    csvRows.push(['Field', 'Value']);
                    csvRows.push(['name', enrichmentResults.name || '']);
                    csvRows.push(['domain', enrichmentResults.domain || '']);
                    csvRows.push(['description', enrichmentResults.description || '']);
                    csvRows.push(['industry', enrichmentResults.industry || '']);
                    csvRows.push(['subIndustry', enrichmentResults.subIndustry || '']);
                    csvRows.push(['founded', enrichmentResults.founded || '']);
                    csvRows.push(['employeeCount', enrichmentResults.employeeCount ?? '']);
                    csvRows.push(['revenue', enrichmentResults.revenue || '']);
                    csvRows.push(['hqAddress', enrichmentResults.hqAddress || '']);
                    csvRows.push(['hqCountry', enrichmentResults.hqCountry || '']);
                    csvRows.push(['linkedInURL', enrichmentResults.linkedInURL || '']);
                    csvRows.push(['isPublic', enrichmentResults.isPublic ? 'Yes' : 'No']);
                    csvRows.push(['followersCountLinkedin', enrichmentResults.followersCountLinkedin || '']);
                    
                    // Add array data
                    csvRows.push(['phones', enrichmentResults.phones?.join('; ') || '']);
                    csvRows.push(['websites', enrichmentResults.websites?.join('; ') || '']);
                    csvRows.push(['keywords', enrichmentResults.keywords?.join('; ') || '']);
                    
                    const csvContent = csvRows.map(row => 
                      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
                    ).join('\n');
                    
                    const dataBlob = new Blob([csvContent], {type: 'text/csv'});
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${enrichmentResults.name || 'company'}_data.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    toast.success('CSV file downloaded');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Export CSV
                </Button>
                
                {enrichmentResults.logoUrl && (
                  <img 
                    src={enrichmentResults.logoUrl} 
                    alt={`${enrichmentResults.name} logo`} 
                    className="h-16 w-16 object-contain"
                  />
                )}
              </div>
            </div>
          </CardHeader>
          
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Company Details</TabsTrigger>
              <TabsTrigger value="digital">Digital Presence</TabsTrigger>
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="p-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="font-semibold">name</Label>
                    <p className="text-sm">{enrichmentResults.name}</p>
                  </div>
                  
                  <div>
                    <Label className="font-semibold">industry</Label>
                    <p className="text-sm">{enrichmentResults.industry}</p>
                  </div>
                  
                  <div>
                    <Label className="font-semibold">subIndustry</Label>
                    <p className="text-sm">{enrichmentResults.subIndustry || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <Label className="font-semibold">founded</Label>
                    <p className="text-sm">{enrichmentResults.founded || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <Label className="font-semibold">employeeCount</Label>
                    <p className="text-sm">
                      {enrichmentResults.employeeCount != null ? enrichmentResults.employeeCount.toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="font-semibold">revenue</Label>
                    <p className="text-sm">{enrichmentResults.revenue || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <Label className="font-semibold">hqAddress</Label>
                    <p className="text-sm">{enrichmentResults.hqAddress || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <Label className="font-semibold">hqCountry</Label>
                    <p className="text-sm">{enrichmentResults.hqCountry || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <Label className="font-semibold">isPublic</Label>
                    <p className="text-sm">{enrichmentResults.isPublic ? 'Yes' : 'No'}</p>
                  </div>
                  
                  <div>
                    <Label className="font-semibold">followersCountLinkedin</Label>
                    <p className="text-sm">{enrichmentResults.followersCountLinkedin?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="p-4">
              <div className="space-y-6">
                <div>
                  <Label className="font-semibold">phones</Label>
                  {enrichmentResults.phones && enrichmentResults.phones.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {enrichmentResults.phones.map((phone, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <p className="text-sm">{phone}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => copyToClipboard(phone)}
                            className="h-6 w-6"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">No phones available</p>
                  )}
                </div>

                <div>
                  <Label className="font-semibold">websites</Label>
                  {enrichmentResults.websites && enrichmentResults.websites.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {enrichmentResults.websites.map((website, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <a 
                            href={website.startsWith('http') ? website : `https://${website}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {website}
                          </a>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => copyToClipboard(website)}
                            className="h-6 w-6"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">No websites available</p>
                  )}
                </div>

                <div>
                  <Label className="font-semibold">fundingRounds</Label>
                  {enrichmentResults.fundingRounds && enrichmentResults.fundingRounds.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {enrichmentResults.fundingRounds.map((round, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <p className="font-medium">{round.name}</p>
                          <p className="text-sm">Amount: {round.amount} {round.amountCurrency}</p>
                          <p className="text-sm">Date: {round.announcedDate}</p>
                          <p className="text-sm">Lead Investors: {round.leadInvestors.join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">No funding rounds available</p>
                  )}
                </div>

                <div>
                  <Label className="font-semibold">parentOrganization</Label>
                  {enrichmentResults.parentOrganization ? (
                    <div className="mt-2">
                      <p className="text-sm font-medium">{enrichmentResults.parentOrganization.name}</p>
                      <a 
                        href={enrichmentResults.parentOrganization.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {enrichmentResults.parentOrganization.website}
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">No parent organization available</p>
                  )}
                </div>

                <div>
                  <Label className="font-semibold">stocks</Label>
                  {enrichmentResults.stocks && enrichmentResults.stocks.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {enrichmentResults.stocks.map((stock, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <p className="text-sm">Exchange: {stock.exchange}</p>
                          <p className="text-sm">Ticker: {stock.ticker}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">No stock information available</p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="digital" className="p-4">
              <div className="space-y-6">
                <div>
                  <Label className="font-semibold">linkedInURL</Label>
                  {enrichmentResults.linkedInURL ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <a 
                        href={enrichmentResults.linkedInURL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {enrichmentResults.linkedInURL}
                      </a>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => copyToClipboard(enrichmentResults.linkedInURL || '')}
                        className="h-6 w-6"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">No LinkedIn URL available</p>
                  )}
                </div>

                <div>
                  <Label className="font-semibold">digitalPresence</Label>
                  {enrichmentResults.digitalPresence && enrichmentResults.digitalPresence.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {enrichmentResults.digitalPresence.map((presence, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{presence.name}:</span>
                          <a 
                            href={presence.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {presence.url}
                          </a>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => copyToClipboard(presence.url)}
                            className="h-6 w-6"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">No digital presence data available</p>
                  )}
                </div>

                <div>
                  <Label className="font-semibold">keywords</Label>
                  {enrichmentResults.keywords && enrichmentResults.keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {enrichmentResults.keywords.map((keyword, index) => (
                        <span 
                          key={index} 
                          className="bg-gray-100 px-2 py-1 rounded-md text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">No keywords available</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="raw" className="p-4">
              <div>
                <Label className="font-semibold">Complete Raw Data</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg overflow-auto">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(enrichmentResults, null, 2)}
                  </pre>
                </div>
                <Button 
                  onClick={() => copyToClipboard(JSON.stringify(enrichmentResults, null, 2))}
                  className="mt-2"
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Raw JSON
                </Button>
              </div>
            </TabsContent>
          </Tabs>
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
              <div className="max-h-40 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {csvImportModal.headers.map(header => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvImportModal.lines.slice(0, 3).map((row, index) => (
                      <TableRow key={index}>
                        {csvImportModal.headers.map(header => (
                          <TableCell key={header}>{row[header]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setCsvImportModal(prev => ({ ...prev, show: false }))}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImportColumns}
                disabled={isLoading || !csvImportModal.selectedColumn}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enriching...
                  </>
                ) : (
                  'Enrich Companies'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}