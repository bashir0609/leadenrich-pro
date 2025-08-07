'use client';

import { ProviderMarketplace } from '@/components/providers/ProviderMarketplace';

export default function ProvidersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Providers</h1>
        <p className="text-muted-foreground mt-2">
          Browse and select data enrichment providers for your leads
        </p>
      </div>
      
      <ProviderMarketplace />
    </div>
  );
}