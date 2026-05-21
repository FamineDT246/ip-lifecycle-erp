'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShieldCheck, ShieldQuestion, Users, Settings, Loader2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export default function OpsAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthorized, isLoading } = usePermissions(['ops_admin']);

  const navItems = [
    { name: 'Dashboard', href: '/ops-admin', exact: true, icon: LayoutDashboard },
    { name: 'IP Vault', href: '/ops-admin/vault', exact: false, icon: ShieldCheck },
    { name: 'Creator Apps', href: '/ops-admin/applications', exact: false, icon: ShieldQuestion },
    { name: 'User Management', href: '/ops-admin/users', exact: false, icon: Users },
    { name: 'Settings', href: '/ops-admin/settings', exact: false, icon: Settings },
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
          <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group inline-flex items-center whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
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

      <div className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Operations Control</h1>
            <p className="mt-1 text-sm text-foreground opacity-70">
              System administration and master records
            </p>
          </div>
        </div>
        
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}