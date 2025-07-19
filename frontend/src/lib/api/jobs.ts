// frontend/src/lib/api/jobs.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import { Job } from '@/types';

export const useJobStatus = (jobId: string | null) => {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const response = await apiClient.getJobStatus(jobId);
      return response.data as Job;
    },
    // This will automatically poll the backend for updates every 2 seconds
    // as long as the job is still running.
    refetchInterval: (query) => {
      const job = query.state.data;
      if (!job) return false;
      const isRunning = job.status === 'queued' || job.status === 'processing';
      return isRunning ? 2000 : false;
    },
    enabled: !!jobId, // The query will not run until the jobId is available
  });
};