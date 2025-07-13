'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Building2, FileSpreadsheet, Briefcase } from 'lucide-react';

const navigation = [
  { name: 'Providers', href: '/', icon: Building2 },
  { name: 'Enrichment', href: '/enrichment', icon: FileSpreadsheet },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-4">
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md',
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}