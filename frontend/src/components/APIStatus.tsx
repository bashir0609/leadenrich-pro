'use client';
import { useEffect } from 'react';
import apiClient from '@/lib/api/client';

export default function APIStatus() {
  useEffect(() => {
    console.log('Environment:', {
      API_URL: process.env.NEXT_PUBLIC_API_URL,
      NodeEnv: process.env.NODE_ENV
    });
    
    apiClient.getProviders()
      .then(data => console.log('API Success:', data))
      .catch(err => console.error('API Error:', err));
  }, []);

  return <div className="p-4 bg-blue-50">Check console for API debug info</div>;
}