'use client';

import * as React from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ProviderErrorProps {
  providerName: string;
  message: string;
  isProviderError: boolean;
  supportEmail?: string;
  supportUrl?: string;
  onRetry?: () => void;
}

export function ProviderError({
  providerName,
  message,
  isProviderError,
  supportEmail,
  supportUrl,
  onRetry
}: ProviderErrorProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="font-medium">{isProviderError ? `${providerName} API Error` : 'Error'}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">{message}</p>
        
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          )}
          
          {supportEmail && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(`mailto:${supportEmail}`, '_blank')}
            >
              Contact Support
            </Button>
          )}
          
          {supportUrl && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(supportUrl, '_blank')}
              className="flex items-center gap-1"
            >
              Visit Help Center <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}