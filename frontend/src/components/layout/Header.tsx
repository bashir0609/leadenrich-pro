'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, User } from 'lucide-react';

export function Header() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">LeadEnrich Pro</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-primary-foreground/10 px-3 py-1.5 rounded-full">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:inline-block">
                  {user?.name || user?.email}
                </span>
              </div>
              <Button variant="secondary" size="sm" onClick={logout} className="font-medium">
                Logout
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" variant="secondary" className="font-medium">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}