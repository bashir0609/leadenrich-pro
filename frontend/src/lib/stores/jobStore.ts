import { create } from 'zustand';
import { Job } from '@/types';

interface JobStore {
  activeJobs: Job[];
  addJob: (job: Job) => void;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  removeJob: (jobId: string) => void;
}

export const useJobStore = create<JobStore>((set) => ({
  activeJobs: [],
  addJob: (job) =>
    set((state) => ({
      activeJobs: [...state.activeJobs, job],
    })),
  updateJob: (jobId, updates) =>
    set((state) => ({
      activeJobs: state.activeJobs.map((job) =>
        job.id === jobId ? { ...job, ...updates } : job
      ),
    })),
  removeJob: (jobId) =>
    set((state) => ({
      activeJobs: state.activeJobs.filter((job) => job.id !== jobId),
    })),
}));