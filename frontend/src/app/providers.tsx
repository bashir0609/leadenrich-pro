// frontend/src/app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, useRef } from 'react';
import { socketManager } from '@/lib/socket';
import { useJobStore } from '@/lib/stores/jobStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('Providers effect running');
    
    // Ensure this runs only on client side
    if (typeof window !== 'undefined') {
      console.log('Window is defined, setting up socket');
      
      const { updateJob } = useJobStore.getState();
      console.log('Update job callback retrieved');
      
      socketManager.setUpdateJobCallback(updateJob);
      socketManager.connect();

      return () => {
        console.log('Cleaning up socket connection');
        socketManager.disconnect();
        isInitializedRef.current = false;
      };
    }

    // Cleanup if window is undefined
    return () => {
      isInitializedRef.current = false;
    };
  }, []); // Empty dependency array ensures this runs only once

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}