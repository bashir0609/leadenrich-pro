// frontend/src/components/layout/MainLayout.tsx
'use client';

import { Header } from './Header';
import { Navigation } from './Navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top header with user menu */}
      <Header />
      
      {/* Main navigation with dropdown menus - only show when authenticated */}
      {isAuthenticated && (
        <div className="border-b bg-background py-2">
          <div className="container">
            <Navigation />
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}