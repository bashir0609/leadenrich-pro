'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Provider } from '@/types';
import { useProviderStore } from '@/lib/stores/providerStore';
import { Building2, Mail, Brain, Users, X } from 'lucide-react';

const categoryIcons = {
  'major-database': Building2,
  'email-finder': Mail,
  'ai-research': Brain,
  'social-enrichment': Users,
};

interface ProviderDetailsProps {
  provider: Provider;
  onClose: () => void;
}

export function ProviderDetails({ provider, onClose }: ProviderDetailsProps) {
  const { setSelectedProvider } = useProviderStore();
  const Icon = categoryIcons[provider.category as keyof typeof categoryIcons] || Building2;

  const handleSelect = () => {
    setSelectedProvider(provider);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Icon className="h-6 w-6 text-primary" />
            {provider.displayName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Available Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {provider.features.map((feature) => (
                <div key={feature.featureId} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{feature.featureName}</h4>
                    <Badge variant="secondary">{feature.creditsPerRequest} credits</Badge>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {feature.category}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSelect} className="flex-1">
              Select Provider
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}