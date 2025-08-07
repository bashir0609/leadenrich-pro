'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Job } from '@/types'; // Your shared Job type
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// A new API client function to get all jobs for the user
const fetchJobs = async (): Promise<Job[]> => {
  try {
    console.log('1. [fetchJobs] Attempting to call apiClient.getJobs()...');
    const response = await apiClient.getJobs();
    console.log('4. [fetchJobs] Received response from apiClient:', response);

    if (response.success && Array.isArray(response.data)) {
      console.log('5. [fetchJobs] Success! Returning data.');
      return response.data;
    }
    
    // This will be caught by React Query
    throw new Error(response.error?.message || 'Failed to fetch jobs: Invalid data format.');
  } catch (error) {
    console.error('X. [fetchJobs] Caught an error:', error);
    // Re-throw the error so React Query knows the fetch failed.
    throw error;
  }
};

export default function JobsListPage() {
  const router = useRouter();
  // --- 3. GET THE QUERY CLIENT ---
  const queryClient = useQueryClient();

  // Use React Query to fetch and cache the list of jobs
  const { data: jobs, isLoading, error, refetch } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
  });

  const handleRefreshAndClearCache = () => {
    // This will invalidate the cache and force a re-fetch
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    // You can also call refetch directly if you prefer
    // refetch();
    toast.success('Refreshing job list...');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">Error loading jobs. Please try again.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Enrichment Jobs</h1>
        
        <div>
          {/* --- 4. ADD A MANUAL REFRESH BUTTON --- */}
          <Button onClick={handleRefreshAndClearCache} variant="outline" className="mr-2">
            Refresh
          </Button>
          <Button onClick={() => router.push('/')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Start New Job
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job History</CardTitle>
          <CardDescription>A list of your recent bulk enrichment jobs.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Records</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs && jobs.length > 0 ? (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs">{job.id}</TableCell>
                    <TableCell>
                      <Badge variant={
                        job.displayStatus === 'expired' ? 'outline' : 
                        job.status === 'completed' ? 'success' : 
                        job.status === 'failed' ? 'destructive' : 'default'
                      }>
                        {job.displayStatus || job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{job.progress.total}</TableCell>
                    <TableCell>{format(new Date(job.createdAt), 'PPp')}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/jobs/${job.id}`)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    You haven't started any jobs yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}