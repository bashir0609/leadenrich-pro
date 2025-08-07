'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Building2, Briefcase, Users, Settings } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';

export default function Home() {
  const { user } = useAuth();
  
  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to LeadEnrich Pro - Your data enrichment platform
        </p>
      </div>
      
      {/* Welcome Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Welcome{user?.name ? `, ${user.name}` : ''}!</CardTitle>
          <CardDescription>
            Get started with LeadEnrich Pro by exploring our features below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="secondary" className="justify-start">
              <Link href="/providers" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Browse Providers
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>
            <Button asChild variant="secondary" className="justify-start">
              <Link href="/jobs" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                View Jobs
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>
            <Button asChild variant="secondary" className="justify-start">
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configure Settings
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : dashboardStats?.providers.active || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardStats?.providers.active === 0 
                ? 'No providers configured' 
                : 'Ready to use for enrichment'
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : dashboardStats?.jobs.recent || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(dashboardStats?.jobs.recent || 0) === 0 
                ? 'No jobs processed yet' 
                : 'Jobs in the last 30 days'
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">API Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : dashboardStats?.credits.remaining?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardStats?.credits.used 
                ? `${dashboardStats.credits.used} used of ${dashboardStats.credits.total}` 
                : 'Available for enrichment'
              }
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Unable to load dashboard statistics. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}