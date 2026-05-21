'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, LayoutDashboard, FolderKanban, Loader2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthorized, isLoading } = usePermissions(['buyer', 'creator']);

  const navItems = [
    // Updated to point to /client and added exact matching
    { name: 'Overview', href: '/client', exact: true, icon: LayoutDashboard },
    { name: 'Discover IPs', href: '/client/marketplace', exact: false, icon: ShoppingBag },
    { name: 'My Portfolio', href: '/client/portfolio', exact: false, icon: FolderKanban },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  if (!isAuthorized) return null; 

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {navItems.map((item) => {
              // Updated to use the exact match logic
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-foreground opacity-70 hover:border-border hover:opacity-100'
                  }`}
                >
                  <Icon className={`mr-2 h-4 w-4 ${isActive ? 'text-primary' : 'opacity-50'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}