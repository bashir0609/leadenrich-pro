'use client';

import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function CompanyLookalikePage() {
  const router = useRouter();
  const params = useParams();
  const providerName = params.name as string;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/providers/${providerName}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Company Lookalike</h1>
          <p className="text-muted-foreground">
            Feature coming soon for {providerName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Find Similar Companies</CardTitle>
          <CardDescription>
            This feature is currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Check back later to use the company lookalike feature.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}