// Simple page bypassing all existing components
'use client';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';

export default function TestPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiClient.getProviders()
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div className="p-4">
      <h1>Raw API Test</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}