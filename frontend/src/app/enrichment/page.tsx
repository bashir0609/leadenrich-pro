'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/common/FileUpload';
import { ColumnMapping } from '@/components/enrichment/ColumnMapping';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProviderStore } from '@/lib/stores/providerStore';
import { useCreateBulkJob } from '@/lib/api/providers';
import { useJobStore } from '@/lib/stores/jobStore';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

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

export default function EnrichmentPage() {
  const router = useRouter();
  const { selectedProvider } = useProviderStore();
  const { addJob } = useJobStore();
  const createBulkJob = useCreateBulkJob();
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // if (!selectedProvider) {
  //   router.push('/');
  //   return null;
  // }

  const mockProvider = selectedProvider || {
    id: 1,
    name: 'surfe',
    displayName: 'Surfe',
    category: 'major-database',
    features: []
  };

  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/csv`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setParsedData(result.data);

      // Initialize mapping from suggestions
      const initialMapping: Record<string, string> = {};
      result.data.suggestions.forEach((suggestion: any) => {
        initialMapping[suggestion.targetField] = suggestion.sourceColumn;
      });
      setMapping(initialMapping);

      toast.success(`File uploaded successfully! ${result.data.totalRows} rows detected.`);
    } catch (error) {
      toast.error('Failed to upload file');
      setUploadedFile(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const targetFields = [
    { field: 'email', label: 'Email', required: true },
    { field: 'firstName', label: 'First Name', required: false },
    { field: 'lastName', label: 'Last Name', required: false },
    { field: 'company', label: 'Company', required: false },
    { field: 'domain', label: 'Domain', required: false },
    { field: 'phone', label: 'Phone', required: false },
  ];

  const handleStartEnrichment = async () => {
    if (!parsedData || !mockProvider) return;

    // Validate required fields
    const hasRequiredFields = targetFields
      .filter((f) => f.required)
      .every((f) => mapping[f.field]);

    if (!hasRequiredFields) {
      toast.error('Please map all required fields');
      return;
    }

    try {
      // Transform data based on mapping
      const records = parsedData.preview.map((row) => {
        const mapped: Record<string, any> = {};
        Object.entries(mapping).forEach(([target, source]) => {
          mapped[target] = row[source];
        });
        return mapped;
      });

      // Create bulk job
      const result = await createBulkJob.mutateAsync({
        providerId: mockProvider.name,
        data: {
          operation: 'enrich-person',
          records,
          options: {
            columnMapping: mapping,
          },
        },
      });

      // Add to job store
      addJob({
        id: result.jobId,
        status: 'queued',
        progress: {
          total: result.totalRecords,
          processed: 0,
          successful: 0,
          failed: 0,
        },
        createdAt: new Date().toISOString(),
        logs: [],
      });

      toast.success('Enrichment job started!');
      router.push(`/jobs/${result.jobId}`);
    } catch (error) {
      toast.error('Failed to start enrichment');
    }
  };

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
            <h1 className="text-3xl font-bold">Data Enrichment</h1>
            <p className="text-muted-foreground">
              Using {mockProvider.displayName} provider
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="bulk" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Enrichment</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Enrichment</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Single Record Enrichment</CardTitle>
              <CardDescription>
                Enrich a single contact or company
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Single enrichment coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Upload Your Data</CardTitle>
              <CardDescription>
                Upload a CSV file with the leads you want to enrich
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={handleFileSelect}
                uploading={uploading}
                progress={uploadProgress}
              />
            </CardContent>
          </Card>

          {parsedData && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Map Your Columns</CardTitle>
                  <CardDescription>
                    Tell us which columns contain which data
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
                  <CardTitle>Step 3: Preview & Start</CardTitle>
                  <CardDescription>
                    Review your data before starting enrichment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Total Records</p>
                      <p className="text-2xl font-bold">{parsedData.totalRows}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Estimated Credits</p>
                      <p className="text-2xl font-bold">
                        {parsedData.totalRows * 2}
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium mb-2">Data Preview</h4>
                    <div className="overflow-x-auto">
                      <table className="text-sm">
                        <thead>
                          <tr>
                            {Object.keys(mapping).map((field) => (
                              <th key={field} className="px-2 py-1 text-left">
                                {field}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.preview.slice(0, 3).map((row, idx) => (
                            <tr key={idx}>
                              {Object.entries(mapping).map(([field, column]) => (
                                <td key={field} className="px-2 py-1">
                                  {row[column] || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleStartEnrichment}
                    disabled={createBulkJob.isPending}
                  >
                    {createBulkJob.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      'Start Enrichment'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}