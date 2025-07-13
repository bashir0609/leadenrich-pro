'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ComparisonProps {
  providers: any[];
  operation: string;
}

export function ProviderComparison({ providers, operation }: ComparisonProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="grid gap-4">
      {providers.map((comparison) => (
        <Card key={comparison.provider}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{comparison.provider}</CardTitle>
              <Badge variant="outline" className={getScoreColor(comparison.metrics.successRate)}>
                {comparison.metrics.successRate.toFixed(1)}% success
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Response Time</p>
                <p className="font-medium">{comparison.metrics.responseTime}ms</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credit Cost</p>
                <p className="font-medium">{comparison.metrics.creditCost} credits</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Quality</p>
                <Progress value={comparison.metrics.dataCompleteness} className="mt-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className={`font-bold ${getScoreColor(85)}`}>85/100</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Pros
                </h4>
                <ul className="text-sm space-y-1">
                  {comparison.pros.map((pro: string, idx: number) => (
                    <li key={idx} className="text-muted-foreground">• {pro}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Cons
                </h4>
                <ul className="text-sm space-y-1">
                  {comparison.cons.map((con: string, idx: number) => (
                    <li key={idx} className="text-muted-foreground">• {con}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                Best For
              </h4>
              <div className="flex flex-wrap gap-2">
                {comparison.bestFor.map((use: string, idx: number) => (
                  <Badge key={idx} variant="secondary">{use}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}