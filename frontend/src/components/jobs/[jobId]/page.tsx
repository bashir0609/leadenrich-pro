'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useJobStatus } from '@/lib/api/jobs'; // Import the new hook
import { CheckCircle2, XCircle, Loader2, Download, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  // Use the new hook to fetch and poll data automatically
  const { data: job, isLoading, error } = useJobStatus(jobId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Job not found or an error occurred.</p>
      </div>
    );
  }

  const progressPercentage = job.progress.total > 0
    ? Math.round((job.progress.processed / job.progress.total) * 100)
    : 0;

  const getStatusBadge = () => {
    const variants: Record<string, any> = {
      queued: { variant: 'secondary', icon: Loader2, animate: true },
      processing: { variant: 'default', icon: Loader2, animate: true },
      completed: { variant: 'success', icon: CheckCircle2, animate: false },
      failed: { variant: 'destructive', icon: XCircle, animate: false },
    };

    const config = variants[job.status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className={`h-3 w-3 mr-1 ${config.animate ? 'animate-spin' : ''}`} />
        {job.status}
      </Badge>
    );
  };

  const handleExport = () => {
    toast.success('Export functionality coming soon!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/enrichment')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Job Details</h1>
          <p className="text-muted-foreground text-xs">ID: {jobId}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Job Progress</CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>
            Started {format(new Date(job.createdAt), 'PPp')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-2 bg-muted rounded-md">
              <p className="text-2xl font-bold">{job.progress.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-2 bg-muted rounded-md">
              <p className="text-2xl font-bold">{job.progress.processed}</p>
              <p className="text-sm text-muted-foreground">Processed</p>
            </div>
            <div className="text-center p-2 bg-muted rounded-md">
              <p className="text-2xl font-bold text-green-600">
                {job.progress.successful}
              </p>
              <p className="text-sm text-muted-foreground">Successful</p>
            </div>
            <div className="text-center p-2 bg-muted rounded-md">
              <p className="text-2xl font-bold text-red-600">
                {job.progress.failed}
              </p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </div>

          {job.completedAt && (
            <div className="pt-4 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Completed on {format(new Date(job.completedAt), 'PPp')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

       {job.status === 'completed' && (
          <div className="text-center">
             <Button onClick={handleExport}>
               <Download className="h-4 w-4 mr-2" />
               Export Results
             </Button>
          </div>
       )}
    </div>
  );
}