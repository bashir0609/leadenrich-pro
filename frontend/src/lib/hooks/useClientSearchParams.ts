'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useClientSearchParams() {
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return new URLSearchParams(); // Return empty params during SSR
  }

  return searchParams;
}