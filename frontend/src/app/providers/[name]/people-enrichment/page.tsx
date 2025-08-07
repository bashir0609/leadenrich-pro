'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Loader2, Mail, Phone, MapPin, Building, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileUpload } from '@/components/common/FileUpload';
import { useProviders, useExecuteProvider } from '@/lib/api/providers';
import { useClientSearchParams } from '@/lib/hooks/useClientSearchParams';
import { useProviderStore } from '@/lib/stores/providerStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { useCreateBulkJob } from '@/lib/api/providers'; // We need this hook for bulk jobs
import { useJobStore } from '@/lib/stores/jobStore'; // To track the new job
import { ColumnMapping } from '@/components/enrichment/ColumnMapping'; // Assuming you have a reusable mapping component
import { Provider } from '@/types';

interface ParsedFileData {
  headers: string[];
  totalRows: number;
  preview: Record<string, any>[];
  columnTypes: Record<string, string>;
  suggestions: Array<{
    sourceColumn: string;
    targetField: string;
    isRequired: boolean;
  }>;
}

interface PersonEnrichmentRecord {
  email?: string;
  firstName?: string;
  lastName?: string;
  companyDomain?: string;
  linkedinUrl?: string;
  companyName?: string; // Add any other fields you want to map
}

export default function PeopleEnrichmentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useClientSearchParams();
  const providerName = params.name as string;
  
  const { selectedProvider, setSelectedProvider } = useProviderStore();
  
  const { data: providers } = useProviders() as { data: Provider[] | undefined };
  
  const executeProvider = useExecuteProvider();

  const createBulkJob = useCreateBulkJob();
  const { addJob } = useJobStore();
  
  const [activeTab, setActiveTab] = useState('single');
  
  const [singleParams, setSingleParams] = useState({
    email: searchParams.get('email') || '',
    firstName: searchParams.get('firstName') || '',
    lastName: searchParams.get('lastName') || '',
    companyDomain: searchParams.get('company') || '',
    linkedinUrl: searchParams.get('linkedinUrl') || '',
  });

  const [includeOptions, setIncludeOptions] = useState({
    email: true,
    mobile: false,
    linkedInUrl: true,
    jobHistory: false,
  });

  const [enrichmentResult, setEnrichmentResult] = useState<any>(null);

  // --- 2. ADD STATE FOR THE FULL BULK WORKFLOW ---
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [bulkRecords, setBulkRecords] = useState<PersonEnrichmentRecord[]>([]);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  useEffect(() => {
    if (!selectedProvider && Array.isArray(providers) && providers.length > 0) {
      const provider = providers.find(p => p.name === providerName);
      if (provider) {
        setSelectedProvider(provider);
      }
    }
  }, [providerName, providers, selectedProvider, setSelectedProvider]);

  if (!selectedProvider) {
    return <div>Loading...</div>;
  }
  
  const handleSingleEnrichment = async () => {
    // Check if at least one include option is selected
    if (!includeOptions.email && !includeOptions.mobile && !includeOptions.linkedInUrl && !includeOptions.jobHistory) {
      toast.error('Please select at least one data field to enrich');
      return;
    }

    // Require at least one identifier
    if (!singleParams.email && !singleParams.linkedinUrl && 
        !(singleParams.firstName && singleParams.lastName && singleParams.companyDomain)) {
      toast.error('Please provide at least one way to identify the person (email, LinkedIn URL, or name + company)');
      return;
    }
    
    try {
      const result = await executeProvider.mutateAsync({
        providerId: selectedProvider.name,
        operation: 'enrich-person',
        params: {
          ...singleParams,
          include: includeOptions, // Pass the include options
        },
      });

      console.log('Raw API Response:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        console.log('Enrichment Data (raw):', JSON.stringify(result.data, null, 2));
        
        // Handle the response format from the API
        let enrichmentData = result.data.data || result.data;
        console.log('Processed enrichmentData:', JSON.stringify(enrichmentData, null, 2));
        
        // If the data is in the 'people' array format, extract the first person
        if (enrichmentData.people && Array.isArray(enrichmentData.people) && enrichmentData.people.length > 0) {
          console.log('Found people array with length:', enrichmentData.people.length);
          // Take the first person from the people array
          const personData = enrichmentData.people[0];
          
          // Process emails array to match the expected format
          const processedEmails = personData.emails && Array.isArray(personData.emails) 
            ? personData.emails.map((email: any) => ({
                email: email.email || email,
                validationStatus: email.validationStatus || 'UNKNOWN'
              }))
            : [];
          
          // Process mobile phones array to match the expected format
          const processedMobilePhones = personData.mobilePhones && Array.isArray(personData.mobilePhones)
            ? personData.mobilePhones.map((phone: any) => ({
                mobilePhone: phone.mobilePhone || phone,
                confidenceScore: phone.confidenceScore || 0
              }))
            : [];
          
          // Map the API response to the expected frontend format
          const mappedData = {
            firstName: personData.firstName || '',
            lastName: personData.lastName || '',
            fullName: `${personData.firstName || ''} ${personData.lastName || ''}`.trim(),
            jobTitle: personData.jobTitle || '',
            companyName: personData.companyName || '',
            companyDomain: personData.companyDomain || '',
            linkedInUrl: personData.linkedInUrl || '',
            location: personData.location || personData.country || '',
            country: personData.country || '',
            // Map processed arrays
            emails: processedEmails,
            mobilePhones: processedMobilePhones,
            // Map additional fields with fallbacks
            seniorities: personData.seniorities || [],
            departments: personData.departments || [],
            jobHistory: personData.jobHistory || []
          };
          
          console.log('Mapped Enrichment Data:', mappedData);
          setEnrichmentResult(mappedData);
        } else {
          // If not in people array format, log the data for debugging
          console.log('Unexpected data format:', enrichmentData);
          setEnrichmentResult(enrichmentData);
        }
        
        toast.success('Person enriched successfully!');
      } else {
        console.error('Enrichment Error:', result.error);
        toast.error(result.error?.message || 'Enrichment failed');
        setEnrichmentResult(null);
      }
    } catch (error) {
      console.error('Enrichment Error:', error);
      toast.error('Enrichment failed');
      setEnrichmentResult(null);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSingleParams({
      ...singleParams,
      [e.target.name]: e.target.value,
    });
  };
  
  const clearForm = () => {
    setSingleParams({
      email: '',
      firstName: '',
      lastName: '',
      companyDomain: '',
      linkedinUrl: '',
    });
    setEnrichmentResult(null);
  };
  
  const handleFileSelect = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB).');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    // Tell the backend which fields we are targeting for this operation
    const targetFieldNames = 'email,firstName,lastName,companyDomain,companyName,linkedinUrl';
    formData.append('targetFields', targetFieldNames);

    try {
      // Use your backend's smart CSV parsing endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/csv`, {
        method: 'POST',
        // Note: Do not set Content-Type header when using FormData; the browser does it.
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse file on server.');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setParsedData(result.data);

        // Auto-populate the mapping from the backend's suggestions
        const initialMapping: Record<string, string> = {};
        result.data.suggestions.forEach((suggestion: any) => {
          initialMapping[suggestion.targetField] = suggestion.sourceColumn;
        });
        setMapping(initialMapping);
        
        toast.success(`${result.data.totalRows} records found. Please map your columns.`);
      } else {
        throw new Error(result.error?.message || 'Failed to parse file.');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Define the fields the user can map their CSV to
  const targetFields = [
    { field: 'email', label: 'Email Address', required: false },
    { field: 'firstName', label: 'First Name', required: false },
    { field: 'lastName', label: 'Last Name', required: false },
    { field: 'companyDomain', label: 'Company Domain', required: false },
    { field: 'companyName', label: 'Company Name', required: false },
    { field: 'linkedinUrl', label: 'LinkedIn URL', required: false },
  ];

  // --- 4. ADD THE handleStartEnrichment LOGIC ---
  const handleStartEnrichment = async () => {
    if (!selectedProvider) { toast.error('Provider not selected.'); return; }
    if (!parsedData) { toast.error('No file data to process.'); return; }

    // Transform data based on the user's mapping
    const records = parsedData.preview.map((row) => {
      const mapped: PersonEnrichmentRecord = {};
      Object.entries(mapping).forEach(([targetField, sourceColumn]) => {
        if (sourceColumn && row[sourceColumn]) {
          (mapped as any)[targetField] = row[sourceColumn];
        }
      });
      return mapped;
    }).filter(record => Object.keys(record).length > 0);

    if (records.length === 0) {
      toast.error('No valid records to enrich after mapping.');
      return;
    }

    if (records.length > 500) {
      toast.error('Maximum 500 records allowed per batch.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createBulkJob.mutateAsync({
        providerId: selectedProvider.name,
        data: {
          operation: 'enrich-person',
          records,
          options: { 
            columnMapping: mapping,
            include: includeOptions // Pass enrichment options
          },
        },
      });

      if (result.success && result.data.jobId) {
        addJob({
          id: result.data.jobId,
          status: 'queued',
          progress: { total: result.data.totalRecords, processed: 0, successful: 0, failed: 0 },
          createdAt: new Date().toISOString(),
          logs: [],
        });
        toast.success('Bulk enrichment job started!');
        router.push(`/jobs/${result.data.jobId}`); // Redirect to job status page
      } else {
        throw new Error(result.error?.message || 'Failed to start job.');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ... (Header is fine) ... */}
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
              {selectedProvider.displayName} • Enrich contact data with emails, phones, and more
            </p>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Enrichment</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Enrichment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="single" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Provide at least one identifier to enrich the contact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email"
                    name="email"
                    type="email"
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
                
                <div className="grid grid-cols-2 gap-4">
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

                {/* Add this new section */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-base font-medium">Data to Enrich (Credits Required)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeOptions.email}
                        onChange={(e) => setIncludeOptions(prev => ({...prev, email: e.target.checked}))}
                        className="rounded"
                      />
                      <span className="text-sm">Email Address</span>
                      <Badge variant="outline" className="text-xs">1 credit</Badge>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeOptions.mobile}
                        onChange={(e) => setIncludeOptions(prev => ({...prev, mobile: e.target.checked}))}
                        className="rounded"
                      />
                      <span className="text-sm">Mobile Phone</span>
                      <Badge variant="outline" className="text-xs">1 credit</Badge>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeOptions.linkedInUrl}
                        onChange={(e) => setIncludeOptions(prev => ({...prev, linkedInUrl: e.target.checked}))}
                        className="rounded"
                      />
                      <span className="text-sm">LinkedIn URL</span>
                      <Badge variant="outline" className="text-xs">Free</Badge>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeOptions.jobHistory}
                        onChange={(e) => setIncludeOptions(prev => ({...prev, jobHistory: e.target.checked}))}
                        className="rounded"
                      />
                      <span className="text-sm">Job History</span>
                      <Badge variant="outline" className="text-xs">Free</Badge>
                    </label>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Estimated cost: {
                      (includeOptions.email ? 1 : 0) + 
                      (includeOptions.mobile ? 1 : 0)
                    } credits per contact
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    className="flex-1"
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
                  <Button variant="outline" onClick={clearForm}>
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle>Enrichment Results</CardTitle>
                <CardDescription>
                  {enrichmentResult ? 'Contact data found and enriched' : 'Results will appear here after enrichment'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {enrichmentResult ? (
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-3">
                        {`${enrichmentResult.firstName || ''} ${enrichmentResult.lastName || ''}`.trim() || 'Contact Found'}
                        {enrichmentResult.externalID && (
                          <span className="ml-2 text-sm text-muted-foreground font-normal">
                            ID: {enrichmentResult.externalID}
                          </span>
                        )}
                      </h3>
                      
                      {enrichmentResult.jobTitle && (
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <span>{enrichmentResult.jobTitle}</span>
                          {enrichmentResult.status && (
                            <Badge variant="outline">
                              {enrichmentResult.status}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {enrichmentResult.companyName && (
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <span>{enrichmentResult.companyName}</span>
                            {enrichmentResult.companyDomain && (
                              <span className="text-muted-foreground ml-2">
                                ({enrichmentResult.companyDomain})
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    
                    </div>
                    
                    {/* Contact Info */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Contact Information</h4>
                      
                      {/* Email - handle both direct email and emails array */}
                      {enrichmentResult.email ? (
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{enrichmentResult.email}</span>
                        </div>
                      ) : enrichmentResult.emails && Array.isArray(enrichmentResult.emails) && enrichmentResult.emails.length > 0 ? (
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{typeof enrichmentResult.emails[0] === 'string' 
                            ? enrichmentResult.emails[0] 
                            : enrichmentResult.emails[0].email}
                          </span>
                          {enrichmentResult.emails[0].validationStatus && (
                            <Badge variant={enrichmentResult.emails[0].validationStatus === 'VALID' ? 'default' : 'secondary'}>
                              {enrichmentResult.emails[0].validationStatus}
                            </Badge>
                          )}
                        </div>
                      ) : null}
                      
                      {/* Phone - handle direct phone and mobilePhones array */}
                      {enrichmentResult.phone ? (
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{enrichmentResult.phone}</span>
                        </div>
                      ) : enrichmentResult.mobilePhones && Array.isArray(enrichmentResult.mobilePhones) && enrichmentResult.mobilePhones.length > 0 ? (
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{typeof enrichmentResult.mobilePhones[0] === 'string' 
                            ? enrichmentResult.mobilePhones[0] 
                            : enrichmentResult.mobilePhones[0].mobilePhone || enrichmentResult.mobilePhones[0]}
                          </span>
                          {enrichmentResult.mobilePhones[0].confidenceScore && (
                            <Badge variant="outline">
                              {Math.round(enrichmentResult.mobilePhones[0].confidenceScore * 100)}% confidence
                            </Badge>
                          )}
                        </div>
                      ) : null}
                      
                      {/* LinkedIn URL */}
                      {enrichmentResult.linkedInUrl && !enrichmentResult.linkedInUrl.startsWith('http') && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-muted-foreground">LinkedIn:</span>
                          <span>{enrichmentResult.linkedInUrl}</span>
                        </div>
                      )}
                      
                      {enrichmentResult.linkedInUrl && enrichmentResult.linkedInUrl.startsWith('http') && (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={enrichmentResult.linkedInUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              LinkedIn Profile
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Raw Data - For Debugging */}
                    <div className="border rounded-lg p-4 bg-muted/10">
                      <h4 className="font-medium mb-3">Raw Data</h4>
                      <pre className="text-xs p-2 bg-muted/20 rounded overflow-auto max-h-60">
                        {JSON.stringify(enrichmentResult, null, 2)}
                      </pre>
                    </div>

                    {/* Additional Data */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Additional Information</h4>
                      
                      {enrichmentResult.seniorities && enrichmentResult.seniorities.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm text-muted-foreground">Seniority: </span>
                          <div className="flex gap-1 flex-wrap mt-1">
                            {enrichmentResult.seniorities.map((level: string, i: number) => (
                              <Badge key={i} variant="outline">{level}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {enrichmentResult.departments && enrichmentResult.departments.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm text-muted-foreground">Departments: </span>
                          <div className="flex gap-1 flex-wrap mt-1">
                            {enrichmentResult.departments.map((dept: string, i: number) => (
                              <Badge key={i} variant="outline">{dept}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {enrichmentResult.country && (
                        <div className="mb-2">
                          <span className="text-sm text-muted-foreground">Country: </span>
                          <Badge variant="outline">{enrichmentResult.country}</Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Job History */}
                    {enrichmentResult.jobHistory && enrichmentResult.jobHistory.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Job History</h4>
                        <div className="space-y-3">
                          {enrichmentResult.jobHistory.map((job: any, i: number) => (
                            <div key={i} className="border-l-2 border-muted pl-4">
                              <div className="font-medium">{job.jobTitle}</div>
                              <div className="text-sm text-muted-foreground">{job.companyName}</div>
                              {(job.startDate || job.endDate) && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {job.startDate && new Date(job.startDate).getFullYear()} - {job.endDate ? new Date(job.endDate).getFullYear() : 'Present'}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter contact information and click "Enrich Contact" to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="bulk" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Upload Your Contact List</CardTitle>
              <CardDescription>
                Upload a CSV file (max 500 contacts).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">CSV Format Requirements</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Your CSV should include columns for:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>email</strong> - Contact email address</li>
                  <li>• <strong>firstName</strong> - First name</li>
                  <li>• <strong>lastName</strong> - Last name</li>
                  <li>• <strong>companyDomain</strong> - Company domain (example.com)</li>
                  <li>• <strong>linkedinUrl</strong> - LinkedIn profile URL (optional)</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  At least one identifier (email, LinkedIn URL, or name + company) is required per row.
                </p>
              </div>
            </CardContent>
          </Card>

          {parsedData && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Map Your Columns</CardTitle>
                  <CardDescription>
                    Match your CSV columns to the required data fields.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ColumnMapping
                    headers={parsedData.headers}
                    columnTypes={parsedData.columnTypes}
                    suggestions={parsedData.suggestions}
                    targetFields={targetFields}
                    onChange={setMapping}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Step 3: Select Data to Enrich</CardTitle>
                  <CardDescription>
                      Choose which data points you want to find (credits may apply).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <p>{parsedData.preview.length} records detected.</p>
                  {/* Reuse the includeOptions UI from the single enrichment tab */}
                  <div className="grid grid-cols-2 gap-3">
                    <label /* ... for email ... */ >...</label>
                    <label /* ... for mobile ... */ >...</label>
                    <label /* ... for linkedInUrl ... */ >...</label>
                    <label /* ... for jobHistory ... */ >...</label>
                  </div>
                </CardContent>
              </Card>
              <Button
                className="w-full mt-4"
                size="lg"
                onClick={handleStartEnrichment}
                disabled={isLoading}
              >
                {isLoading ? 'Starting Job...' : `Enrich ${parsedData.preview.length} People`}
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}