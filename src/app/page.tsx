import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { 
  FolderArchive, 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  Users, 
  Settings 
} from 'lucide-react';

export default async function RootDashboard() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, display_name')
    .eq('id', session.user.id)
    .single();

  const role = profile?.role || 'buyer';
  const displayName = profile?.display_name || session.user.user_metadata?.full_name || 'User';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {displayName}</h1>
        <p className="mt-2 text-foreground opacity-70">
          Access your portals and system activities below.
        </p>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Access Portals</h2>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        
        {/* --- OPS ADMIN VIEW --- */}
        {role === 'ops_admin' && (
          <>
            <Link 
              href="/ops-admin/vault" 
              className="group flex flex-col rounded-xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-primary hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <FolderArchive className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Operations Vault</h3>
              <p className="mt-1 text-sm text-foreground opacity-70">
                Manage, review, and approve master IP records.
              </p>
            </Link>

            <Link 
              href="/ops-admin/users" 
              className="group flex flex-col rounded-xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-primary hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">User Directory</h3>
              <p className="mt-1 text-sm text-foreground opacity-70">
                Manage system access and monitor user portfolios.
              </p>
            </Link>

            <Link 
              href="/ops-admin/settings" 
              className="group flex flex-col rounded-xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-primary hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <Settings className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">System Settings</h3>
              <p className="mt-1 text-sm text-foreground opacity-70">
                Configure global parameters and routing logic.
              </p>
            </Link>
          </>
        )}

        {/* --- SALES REP VIEW --- */}
        {role === 'sales_rep' && (
          <Link 
            href="/sales-crm" 
            className="group flex flex-col rounded-xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-primary hover:shadow-md"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Sales Pipeline</h3>
            <p className="mt-1 text-sm text-foreground opacity-70">
              Track licensing deals and manage buyer negotiations.
            </p>
          </Link>
        )}

        {/* --- BUYER / CREATOR VIEW --- */}
        {(role === 'buyer' || role === 'creator') && (
          <Link 
            href="/client" 
            className="group flex flex-col rounded-xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-primary hover:shadow-md"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Client Portal</h3>
            <p className="mt-1 text-sm text-foreground opacity-70">
              View your dashboard, browse the marketplace, and manage requests.
            </p>
          </Link>
        )}

      </div>

      {/* --- RECENT ACTIVITY SECTION --- */}
      <div className="mt-12">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Recent Activity</h2>
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 text-center">
          <Clock className="mb-3 h-8 w-8 text-foreground opacity-30" />
          <p className="text-sm font-medium text-foreground opacity-70">No recent activity to display</p>
          <p className="mt-1 text-xs text-foreground opacity-50">Your system notifications and updates will appear here.</p>
        </div>
      </div>

    </div>
  );
}