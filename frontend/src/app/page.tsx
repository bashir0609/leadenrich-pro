import { ProviderMarketplace } from '@/components/providers/ProviderMarketplace';

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Provider Marketplace</h2>
        <p className="text-muted-foreground mt-2">
          Choose from 50+ data providers to enrich your leads
        </p>
      </div>
      <ProviderMarketplace />
    </div>
  );
}