'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Search, Loader2, Copy, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Provider, CompanyData } from '@/types'; // Use your detailed CompanyData type

// Import necessary hooks and services
import { useProviderStore } from '@/lib/stores/providerStore';
import { useExecuteProvider, useProviders, useCreateBulkJob } from '@/lib/api/providers';
import { useJobStore } from '@/lib/stores/jobStore';
import { FileUpload } from '@/components/common/FileUpload';
import { ColumnMapping } from '@/components/enrichment/ColumnMapping';

// Define the shape of the data returned by your smart CSV parser
interface ParsedFileData {
  headers: string[];
  totalRows: number;
  preview: Record<string, any>[];
  columnTypes: Record<string, string>;
  suggestions: Array<{ sourceColumn: string; targetField: string; isRequired: boolean; }>;
}

export default function CompanyEnrichmentPage() {
  const router = useRouter();
  const params = useParams();
  const urlProviderName = params.name as string;

  // State management hooks
  const { selectedProvider, setSelectedProvider } = useProviderStore();
  const { data: providers } = useProviders() as { data: Provider[] | undefined };
  const executeProvider = useExecuteProvider();
  const createBulkJob = useCreateBulkJob();
  const { addJob } = useJobStore();

  const [activeTab, setActiveTab] = useState('single');
  
  // State for Single Enrichment
  const [domainInput, setDomainInput] = useState('');
  const [isSingleLoading, setIsSingleLoading] = useState(false);
  const [enrichmentResult, setEnrichmentResult] = useState<CompanyData | null>(null); // Use the strong type
  const [error, setError] = useState<string | null>(null);

  // State for Bulk Enrichment
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    if (Array.isArray(providers) && providers.length > 0 && urlProviderName) {
      const provider = providers.find(p => p.name === urlProviderName);
      if (provider) setSelectedProvider(provider);
    }
  }, [providers, urlProviderName, setSelectedProvider]);

  if (!selectedProvider) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  // SINGLE ENRICHMENT LOGIC
  const handleCompanyEnrichment = async () => {
    if (!domainInput.trim()) { toast.error('Please enter a valid domain.'); return; }
    setIsSingleLoading(true);
    setError(null);
    setEnrichmentResult(null);
    try {
      const result = await executeProvider.mutateAsync({
        providerId: selectedProvider.name,
        operation: 'enrich-company',
        params: { domain: domainInput.trim() },
      });
      if (result.success && result.data) {
        setEnrichmentResult(result.data);
        toast.success('Company enriched successfully!');
      } else {
        throw new Error(result.error?.message || 'Failed to enrich company');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSingleLoading(false);
    }
  };

  // ASYNCHRONOUS BULK ENRICHMENT LOGIC
  const handleFileSelect = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large (max 5MB).'); return; }
    setIsBulkLoading(true);
    setParsedData(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetFields', 'domain');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/csv`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to parse file on server.');
      
      const result = await response.json();
      if (result.success) {
        setParsedData(result.data);
        const initialMapping: Record<string, string> = {};
        result.data.suggestions.forEach((s: any) => { initialMapping[s.targetField] = s.sourceColumn; });
        setMapping(initialMapping);
        toast.success(`${result.data.totalRows} records found. Please map the domain column.`);
      } else {
        throw new Error(result.error?.message || 'Failed to parse file.');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const targetFields = [{ field: 'domain', label: 'Company Domain', required: true }];

  const handleStartEnrichment = async () => {
    if (!selectedProvider || !parsedData) return;
    if (!mapping.domain) { toast.error('Please map the "Company Domain" column.'); return; }

    const records = parsedData.preview
      .map(row => ({ domain: row[mapping.domain] }))
      .filter(record => record.domain && typeof record.domain === 'string' && record.domain.trim() !== '');

    if (records.length === 0) { toast.error('No valid domains to enrich.'); return; }
    if (records.length > 500) { toast.error('Maximum 500 domains per batch.'); return; }
    
    setIsBulkLoading(true);
    try {
      const result = await createBulkJob.mutateAsync({
        providerId: selectedProvider.name,
        data: {
          operation: 'enrich-company',
          records,
          options: { columnMapping: mapping },
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
        toast.success('Bulk company enrichment job started!');
        router.push(`/jobs/${result.data.jobId}`);
      } else {
        throw new Error(result.error?.message || 'Failed to start job.');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsBulkLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Company Enrichment - {selectedProvider.displayName}</h1>
          <p className="text-muted-foreground">Enrich company data with comprehensive information</p>
        </div>
      </div>
      
      {error && ( <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert> )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Enrichment</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Enrichment</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Single Company Enrichment</CardTitle>
              <CardDescription>Enter a domain to enrich one company at a time.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input placeholder="e.g., google.com" value={domainInput} onChange={(e) => setDomainInput(e.target.value)} disabled={isSingleLoading} />
                <Button onClick={handleCompanyEnrichment} disabled={isSingleLoading || !domainInput.trim()}>
                  {isSingleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Enrich Company
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {isSingleLoading && !enrichmentResult && (
            <div className="flex items-center justify-center p-6 mt-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {enrichmentResult && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {enrichmentResult.name || enrichmentResult.additionalData?.name || 'Company'}
                      {enrichmentResult.additionalData?.isPublic && (
                        <Badge variant="outline">Public</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{enrichmentResult.description || enrichmentResult.additionalData?.description}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(JSON.stringify(enrichmentResult, null, 2))}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy JSON
                  </Button>
                </div>
              </CardHeader>
              
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-6 border-t border-b -mx-6 px-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="financials">Financials</TabsTrigger>
                  <TabsTrigger value="digital">Digital</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                  <TabsTrigger value="raw">Raw Data</TabsTrigger>
                </TabsList>
                
                {/* OVERVIEW TAB - Core Company Info */}
                <TabsContent value="overview" className="p-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-base mb-3">Basic Information</h4>
                      <div><Label className="font-medium">Company Name</Label><p>{enrichmentResult.name || enrichmentResult.additionalData?.name || 'N/A'}</p></div>
                      <div><Label className="font-medium">Domain</Label><p className="font-mono text-xs bg-muted px-2 py-1 rounded">{enrichmentResult.domain}</p></div>
                      <div><Label className="font-medium">Industry</Label><p>{enrichmentResult.industry || enrichmentResult.additionalData?.industry || 'N/A'}</p></div>
                      <div><Label className="font-medium">Sub-Industry</Label><p>{enrichmentResult.additionalData?.subIndustry || 'N/A'}</p></div>
                      <div><Label className="font-medium">Founded</Label><p>{enrichmentResult.additionalData?.founded || 'N/A'}</p></div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-base mb-3">Size & Scale</h4>
                      <div><Label className="font-medium">Employee Count</Label><p className="text-lg font-semibold text-primary">{enrichmentResult.additionalData?.employeeCount?.toLocaleString() || enrichmentResult.size || 'N/A'}</p></div>
                      <div><Label className="font-medium">Revenue</Label><p className="text-lg font-semibold text-green-600">{enrichmentResult.additionalData?.revenue || 'N/A'}</p></div>
                      <div><Label className="font-medium">LinkedIn Followers</Label><p>{enrichmentResult.additionalData?.followersCountLinkedin?.toLocaleString() || 'N/A'}</p></div>
                      <div><Label className="font-medium">Public Company</Label><p>{enrichmentResult.additionalData?.isPublic ? '✅ Yes' : '❌ No'}</p></div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-base mb-3">Location</h4>
                      <div><Label className="font-medium">Headquarters</Label><p>{enrichmentResult.location || enrichmentResult.additionalData?.hqAddress || 'N/A'}</p></div>
                      <div><Label className="font-medium">HQ Country</Label><p>{enrichmentResult.additionalData?.hqCountry || 'N/A'}</p></div>
                      <div><Label className="font-medium">External ID</Label><p className="font-mono text-xs">{enrichmentResult.additionalData?.externalID || 'N/A'}</p></div>
                      <div><Label className="font-medium">Status</Label><Badge variant="outline">{enrichmentResult.additionalData?.providerStatus || enrichmentResult.additionalData?.status || 'N/A'}</Badge></div>
                    </div>
                  </div>
                </TabsContent>

                {/* FINANCIALS TAB - Investment & Financial Data */}
                <TabsContent value="financials" className="p-6 space-y-6">
                  {/* Stock Information */}
                  {enrichmentResult.additionalData?.stocks && enrichmentResult.additionalData.stocks.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-base mb-3">Stock Information</h4>
                      <div className="grid gap-3">
                        {enrichmentResult.additionalData.stocks.map((stock: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <Badge variant="default">{stock.ticker}</Badge>
                              <span className="text-sm">listed on {stock.exchange}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* IPO Information */}
                  {enrichmentResult.additionalData?.ipo && (
                    <div>
                      <h4 className="font-semibold text-base mb-3">IPO Information</h4>
                      <div className="p-4 border rounded-lg space-y-2">
                        <div><Label className="font-medium">IPO Date</Label><p>{enrichmentResult.additionalData.ipo.date || 'N/A'}</p></div>
                        <div><Label className="font-medium">Share Price</Label><p>{enrichmentResult.additionalData.ipo.sharePrice} {enrichmentResult.additionalData.ipo.sharePriceCurrency}</p></div>
                      </div>
                    </div>
                  )}

                  {/* Funding Rounds */}
                  <div>
                    <h4 className="font-semibold text-base mb-3">Funding History</h4>
                    {Array.isArray(enrichmentResult.additionalData?.fundingRounds) && enrichmentResult.additionalData.fundingRounds.length > 0 ? (
                      <div className="space-y-3">
                        {enrichmentResult.additionalData.fundingRounds.map((round: any, index: number) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary">{round.name}</Badge>
                              <span className="font-semibold text-green-600">
                                {round.amount?.toLocaleString()} {round.amountCurrency}
                              </span>
                            </div>
                            <div><Label className="font-medium">Date</Label><p>{round.announcedDate}</p></div>
                            <div><Label className="font-medium">Lead Investors</Label><p>{round.leadInvestors?.join(', ') || 'N/A'}</p></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No funding rounds available</p>
                    )}
                  </div>

                  {/* Parent Organization */}
                  {enrichmentResult.additionalData?.parentOrganization && (
                    <div>
                      <h4 className="font-semibold text-base mb-3">Parent Organization</h4>
                      <div className="p-4 border rounded-lg space-y-2">
                        <div><Label className="font-medium">Name</Label><p>{enrichmentResult.additionalData.parentOrganization.name}</p></div>
                        <div><Label className="font-medium">Website</Label><a href={enrichmentResult.additionalData.parentOrganization.website} target="_blank" className="text-blue-600 hover:underline">{enrichmentResult.additionalData.parentOrganization.website}</a></div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* DIGITAL TAB - Online Presence */}
                <TabsContent value="digital" className="p-6 space-y-6">
                  {/* LinkedIn */}
                  <div>
                    <h4 className="font-semibold text-base mb-3">LinkedIn</h4>
                    <div className="space-y-2">
                      <div><Label className="font-medium">LinkedIn URL</Label>
                        {(enrichmentResult.linkedinUrl || enrichmentResult.additionalData?.linkedInURL) ? (
                          <a href={enrichmentResult.linkedinUrl || enrichmentResult.additionalData?.linkedInURL} target="_blank" className="text-blue-600 hover:underline block">
                            {enrichmentResult.linkedinUrl || enrichmentResult.additionalData?.linkedInURL}
                          </a>
                        ) : (
                          <p className="text-muted-foreground">N/A</p>
                        )}
                      </div>
                      <div><Label className="font-medium">LinkedIn Followers</Label><p>{enrichmentResult.additionalData?.followersCountLinkedin?.toLocaleString() || 'N/A'}</p></div>
                    </div>
                  </div>

                  {/* Websites */}
                  <div>
                    <h4 className="font-semibold text-base mb-3">Websites</h4>
                    {enrichmentResult.additionalData?.websites && enrichmentResult.additionalData.websites.length > 0 ? (
                      <div className="space-y-1">
                        {enrichmentResult.additionalData.websites.map((website: string, index: number) => (
                          <a key={index} href={`https://${website}`} target="_blank" className="text-blue-600 hover:underline block text-sm">
                            {website}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No additional websites</p>
                    )}
                  </div>

                  {/* Digital Presence */}
                  <div>
                    <h4 className="font-semibold text-base mb-3">Digital Presence</h4>
                    {enrichmentResult.additionalData?.digitalPresence && enrichmentResult.additionalData.digitalPresence.length > 0 ? (
                      <div className="grid gap-2">
                        {enrichmentResult.additionalData.digitalPresence.map((presence: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="font-medium">{presence.name}</span>
                            <a href={presence.url} target="_blank" className="text-blue-600 hover:underline text-sm">
                              Visit →
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No digital presence data</p>
                    )}
                  </div>

                  {/* Keywords/Technologies */}
                  <div>
                    <h4 className="font-semibold text-base mb-3">Keywords & Technologies</h4>
                    <div className="flex flex-wrap gap-2">
                      {(enrichmentResult.technologies || enrichmentResult.additionalData?.keywords)?.map((tech: string) => (
                        <Badge key={tech} variant="secondary">{tech}</Badge>
                      )) || <p className="text-sm text-muted-foreground">No keywords available</p>}
                    </div>
                  </div>
                </TabsContent>

                {/* ADVANCED TAB - Technical & Additional Data */}
                <TabsContent value="advanced" className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-base mb-3">Technical Details</h4>
                      <div className="space-y-3 text-sm">
                        <div><Label className="font-medium">External ID</Label><p className="font-mono text-xs bg-muted px-2 py-1 rounded">{enrichmentResult.additionalData?.externalID || 'N/A'}</p></div>
                        <div><Label className="font-medium">Provider Status</Label><Badge variant="outline">{enrichmentResult.additionalData?.providerStatus || enrichmentResult.additionalData?.status || 'N/A'}</Badge></div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-base mb-3">Additional Metrics</h4>
                      <div className="space-y-3 text-sm">
                        <div><Label className="font-medium">Public Status</Label><p>{enrichmentResult.additionalData?.isPublic ? 'Publicly Traded' : 'Private Company'}</p></div>
                        <div><Label className="font-medium">Sub-Industry</Label><p>{enrichmentResult.additionalData?.subIndustry || 'N/A'}</p></div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* CONTACT TAB - Contact Information */}
                <TabsContent value="contact" className="p-6 space-y-4">
                  <div>
                    <h4 className="font-semibold text-base mb-3">Phone Numbers</h4>
                    {enrichmentResult.additionalData?.phones && enrichmentResult.additionalData.phones.length > 0 ? (
                      <div className="space-y-2">
                        {enrichmentResult.additionalData.phones.map((phone: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <Badge variant="outline">Phone {index + 1}</Badge>
                            <a href={`tel:${phone}`} className="hover:underline">{phone}</a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No phone numbers available</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-base mb-3">Address</h4>
                    <div className="space-y-2 text-sm">
                      <div><Label className="font-medium">Headquarters</Label><p>{enrichmentResult.location || enrichmentResult.additionalData?.hqAddress || 'N/A'}</p></div>
                      <div><Label className="font-medium">Country</Label><p>{enrichmentResult.additionalData?.hqCountry || 'N/A'}</p></div>
                    </div>
                  </div>
                </TabsContent>

                {/* RAW DATA TAB - Complete JSON */}
                <TabsContent value="raw" className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="font-semibold text-base">Complete API Response</Label>
                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(JSON.stringify(enrichmentResult, null, 2))}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy JSON
                    </Button>
                  </div>
                  <pre className="text-xs bg-muted rounded-md p-4 overflow-auto max-h-96 border">
                    {JSON.stringify(enrichmentResult, null, 2)}
                  </pre>
                </TabsContent>
              </Tabs>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="bulk" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Upload Your Company List</CardTitle>
              <CardDescription>Upload a CSV file with a column of company domains.</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload onFileSelect={handleFileSelect} disabled={isBulkLoading} uploading={isBulkLoading} />
              <div className="mt-4 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                <p>• Required: A column containing company domains (e.g., google.com).</p>
                <p>• File size limit: 5MB. Maximum 500 domains per batch.</p>
              </div>
            </CardContent>
          </Card>

          {parsedData && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Map Your Domain Column</CardTitle>
                  <CardDescription>Confirm which column in your file contains the company domains.</CardDescription>
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

              <Button size="lg" onClick={handleStartEnrichment} disabled={isBulkLoading} className="w-full">
                {isBulkLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isBulkLoading ? 'Starting Job...' : `Enrich ${parsedData.totalRows} Companies`}
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}