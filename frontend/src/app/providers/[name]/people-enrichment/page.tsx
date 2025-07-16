'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/common/FileUpload';
import { ArrowLeft, Sparkles, Loader2, Mail, Phone, MapPin, Building, ExternalLink } from 'lucide-react';
import { useProviderStore } from '@/lib/stores/providerStore';
import { useProviders, useExecuteProvider } from '@/lib/api/providers';
import toast from 'react-hot-toast';
import { useClientSearchParams } from '@/lib/hooks/useClientSearchParams';

export default function PeopleEnrichmentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useClientSearchParams();
  const providerName = params.name as string;
  
  const { selectedProvider, setSelectedProvider } = useProviderStore();
  const { data: providers } = useProviders();
  const executeProvider = useExecuteProvider();
  
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  useEffect(() => {
    if (!selectedProvider && providers) {
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
      
      if (result.success && result.data) {
        setEnrichmentResult(result.data);
        toast.success('Person enriched successfully!');
      } else {
        toast.error(result.error?.message || 'Enrichment failed');
        setEnrichmentResult(null);
      }
    } catch (error) {
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
  
  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    // Navigate to bulk enrichment workflow
    router.push(`/enrichment?provider=${selectedProvider.name}&operation=enrich-person`);
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
              {selectedProvider.displayName} • Enrich contact data with emails, phones, and more
            </p>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="single" className="w-full">
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
                        {enrichmentResult.fullName || `${enrichmentResult.firstName || ''} ${enrichmentResult.lastName || ''}`.trim()}
                      </h3>
                      
                      {enrichmentResult.title && (
                        <p className="text-muted-foreground mb-2">{enrichmentResult.title}</p>
                      )}
                      
                      {enrichmentResult.company && (
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{enrichmentResult.company}</span>
                        </div>
                      )}
                      
                      {enrichmentResult.location && (
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{enrichmentResult.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Contact Info */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Contact Information</h4>
                      
                      {enrichmentResult.email && (
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{enrichmentResult.email}</span>
                          {enrichmentResult.additionalData?.emailValidation && (
                            <Badge variant={enrichmentResult.additionalData.emailValidation === 'VALID' ? 'default' : 'secondary'}>
                              {enrichmentResult.additionalData.emailValidation}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {enrichmentResult.phone && (
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{enrichmentResult.phone}</span>
                          {enrichmentResult.additionalData?.phoneConfidence && (
                            <Badge variant="outline">
                              {Math.round(enrichmentResult.additionalData.phoneConfidence * 100)}% confidence
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {enrichmentResult.linkedinUrl && (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={enrichmentResult.linkedinUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              LinkedIn Profile
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Additional Data */}
                    {enrichmentResult.additionalData && (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Additional Information</h4>
                        
                        {enrichmentResult.additionalData.seniority?.length > 0 && (
                          <div className="mb-2">
                            <span className="text-sm text-muted-foreground">Seniority: </span>
                            <div className="flex gap-1 flex-wrap mt-1">
                              {enrichmentResult.additionalData.seniority.map((level: string, i: number) => (
                                <Badge key={i} variant="outline">{level}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {enrichmentResult.additionalData.departments?.length > 0 && (
                          <div className="mb-2">
                            <span className="text-sm text-muted-foreground">Departments: </span>
                            <div className="flex gap-1 flex-wrap mt-1">
                              {enrichmentResult.additionalData.departments.map((dept: string, i: number) => (
                                <Badge key={i} variant="outline">{dept}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
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
        
        <TabsContent value="bulk" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Enrichment</CardTitle>
              <CardDescription>
                Upload a CSV file with contacts to enrich in bulk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload 
                onFileSelect={handleFileSelect}
                accept={{
                  'text/csv': ['.csv'],
                  'application/vnd.ms-excel': ['.xls'],
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                }}
              />
              
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
        </TabsContent>
      </Tabs>
    </div>
  );
}