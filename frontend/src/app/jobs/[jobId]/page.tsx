// frontend/src/app/jobs/[jobId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import { socketManager } from '@/lib/socket';
import { Job, CompanyData, PersonData } from '@/types';
import { CheckCircle2, XCircle, Loader2, Download, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Papa from 'papaparse';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial job status
    const fetchJob = async () => {
      try {
        const response = await apiClient.getJobStatus(jobId);
        setJob(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch job:', error);
        setLoading(false);
      }
    };

    fetchJob();
    
    // Subscribe to real-time updates
    socketManager.subscribeToJob(jobId);
    
    // Poll for updates every 2 seconds
    const interval = setInterval(fetchJob, 2000);
    
    return () => {
      clearInterval(interval);
      socketManager.unsubscribeFromJob(jobId);
    };
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Job not found</p>
      </div>
    );
  }

  const progressPercentage = job.progress.total > 0
    ? Math.round((job.progress.processed / job.progress.total) * 100)
    : 0;

  const getStatusBadge = () => {
    const statusToShow = job.displayStatus || job.status;
    
    const variants: Record<string, any> = {
      queued: { variant: 'secondary', icon: Loader2 },
      processing: { variant: 'default', icon: Loader2 },
      completed: { variant: 'success', icon: CheckCircle2 },
      failed: { variant: 'destructive', icon: XCircle },
      expired: { variant: 'outline', icon: CheckCircle2 }, // New variant for expired jobs
    };

    const config = variants[statusToShow] || variants.queued;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {statusToShow}
      </Badge>
    );
  };

  const handleExport = () => {
    // Diagnostic log to see the raw data
    console.log('Inspecting job.results for export:', job?.results);

    if (job?.status !== 'completed' || !job.results || job.results.length === 0) {
      toast.error('No successful results to export.');
      return;
    }

    try {
      let dataToExport;

      if (job.jobType === 'enrich-person') {
        dataToExport = (job.results as PersonData[]).map(p => ({
          'Full Name': p.fullName,
          'First Name': p.firstName,
          'Last Name': p.lastName,
          'Email': p.email,
          'Phone': p.phone,
          'Job Title': p.title,
          'Company Name': p.company,
          'Company Domain': p.companyDomain,
          'LinkedIn URL': p.linkedinUrl,
          'Location': p.location,
          // --- THE CRITICAL FIX IS HERE: Flatten the additionalData ---
          'Seniority': p.additionalData?.seniorities?.join('; '),
          'Departments': p.additionalData?.departments?.join('; '),
        }));
      } else if (job.jobType === 'enrich-company') {
        // --- THIS IS THE FINAL, CORRECT MAPPING ---
        dataToExport = (job.results as CompanyData[]).map(c => ({
          // Use optional chaining and nullish coalescing (??) for safety
          'Name': c.name ?? '',
          'Domain': c.domain ?? '',
          'Description': c.description ?? '',
          'Industry': c.industry ?? '',
          'Size': c.size ?? '',
          'Location': c.location ?? '',
          'LinkedIn URL': c.linkedinUrl ?? '',
          
          // Correctly and safely access nested additionalData
          'Employee Count': c.additionalData?.employeeCount ?? 'N/A',
          'Founded': c.additionalData?.founded ?? 'N/A',
          'Revenue': c.additionalData?.revenue ?? 'N/A',
          'HQ Country': c.additionalData?.hqCountry ?? 'N/A',
          'Is Public': c.additionalData?.isPublic ?? 'N/A',
          
          'Technologies': c.technologies?.join('; ') ?? '',
          'Phones': c.additionalData?.phones?.join('; ') ?? '',
          'Websites': c.additionalData?.websites?.join('; ') ?? '',
        }));
      } else {
        // Fallback for unknown job types
        dataToExport = job.results;
        toast.success("Exporting raw JSON for unknown job type.");
      }

      // --- 2. USE THE FLATTENED DATA FOR THE EXPORT ---
      const csv = Papa.unparse(dataToExport);

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `job-results-${jobId}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Results exported successfully!');

    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast.error('An error occurred during export.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/jobs')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Job Details</h1>
            <p className="text-muted-foreground">ID: {jobId}</p>
          </div>
        </div>
        {job.status === 'completed' && (
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Progress</CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>
            Started {format(new Date(job.createdAt), 'PPp')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{job.progress.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{job.progress.processed}</p>
              <p className="text-sm text-muted-foreground">Processed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {job.progress.successful}
              </p>
              <p className="text-sm text-muted-foreground">Successful</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {job.progress.failed}
              </p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </div>

          {job.completedAt && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Completed {format(new Date(job.completedAt), 'PPp')}
              </p>
              <p className="text-sm text-muted-foreground">
                Duration: {Math.round(
                  (new Date(job.completedAt).getTime() -
                    new Date(job.createdAt).getTime()) /
                    1000
                )}{' '}
                seconds
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {job.logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
            <CardDescription>Real-time processing logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {job.logs.map((log) => (
                <div
                  key={log.id}
                  className={`text-sm p-2 rounded ${
                    log.level === 'error'
                      ? 'bg-red-50 text-red-700'
                      : log.level === 'warn'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="font-mono text-xs">
                    {format(new Date(log.timestamp), 'HH:mm:ss')}
                  </span>{' '}
                  {log.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}