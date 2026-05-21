'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, KanbanSquare, Loader2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Container } from '@/components/ui/Container';

export default function SalesCrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthorized, isLoading } = usePermissions(['sales_rep', 'ops_admin']);

  const navItems = [
    { name: 'Sales Dashboard', href: '/sales-crm', exact: true, icon: LayoutDashboard },
    { name: 'Pipeline Board', href: '/sales-crm/pipeline', exact: false, icon: KanbanSquare },
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
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b border-border bg-surface">
        <Container isWide>
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
        </Container>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}