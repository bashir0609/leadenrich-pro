import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Provider } from '@/types';
import { useProviderStore } from '@/lib/stores/providerStore';
import { Building2, Mail, Brain, Users } from 'lucide-react';

const categoryIcons = {
  'major-database': Building2,
  'email-finder': Mail,
  'ai-research': Brain,
  'social-enrichment': Users,
};

interface ProviderCardProps {
  provider: Provider;
  onSelect: () => void;
}

export function ProviderCard({ provider, onSelect }: ProviderCardProps) {
  const Icon = categoryIcons[provider.category as keyof typeof categoryIcons] || Building2;
  
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>{provider.displayName}</CardTitle>
              <CardDescription>{provider.category}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary">{provider.features.length} features</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Available operations:
          </p>
          <div className="flex flex-wrap gap-1">
            {provider.features.slice(0, 3).map((feature) => (
              <Badge key={feature.featureId} variant="outline" className="text-xs">
                {feature.featureName}
              </Badge>
            ))}
            {provider.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{provider.features.length - 3} more
              </Badge>
            )}
          </div>
        </div>
        <Button className="w-full mt-4" variant="secondary">
          Select Provider
        </Button>
      </CardContent>
    </Card>
  );
}