'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import { socketManager } from '@/lib/socket';
import { Job } from '@/types';
import { CheckCircle2, XCircle, Loader2, Download, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

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
    const variants: Record<string, any> = {
      queued: { variant: 'secondary', icon: Loader2 },
      processing: { variant: 'default', icon: Loader2 },
      completed: { variant: 'success', icon: CheckCircle2 },
      failed: { variant: 'destructive', icon: XCircle },
    };

    const config = variants[job.status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {job.status}
      </Badge>
    );
  };

  const handleExport = async () => {
    // Export functionality would be implemented here
    toast.success('Export functionality coming soon!');
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