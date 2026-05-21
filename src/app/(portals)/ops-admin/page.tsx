import Link from 'next/link';
import { 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  FolderArchive,
  ArrowRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function OpsAdminDashboard() {
  const supabase = await createClient();

  const [
    { count: totalIPs },
    { count: pendingIPs },
    { count: approvedIPs }
  ] = await Promise.all([
    supabase.from('intellectual_properties').select('*', { count: 'exact', head: true }),
    supabase.from('intellectual_properties').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('intellectual_properties').select('*', { count: 'exact', head: true }).eq('status', 'approved')
  ]);

  const { data: recentPending } = await supabase
    .from('intellectual_properties')
    .select('id, title, created_at, creator:creator_id(display_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Admin Command Center</h2>
        <p className="mt-1 text-sm text-foreground opacity-70">
          System overview and actionable items requiring your attention.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <FolderArchive className="h-5 w-5" />
            <h3 className="ml-2 text-sm font-medium">Total Master Records</h3>
          </div>
          <p className="mt-4 text-3xl font-bold text-foreground">{totalIPs || 0}</p>
          <p className="mt-1 text-xs text-foreground opacity-60">All IPs across the system</p>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50/50 p-6 shadow-sm dark:border-yellow-900/30 dark:bg-yellow-900/10">
          <div className="flex items-center text-yellow-700 dark:text-yellow-500">
            <Clock className="h-5 w-5" />
            <h3 className="ml-2 text-sm font-medium">Pending Approvals</h3>
          </div>
          <p className="mt-4 text-3xl font-bold text-yellow-800 dark:text-yellow-400">{pendingIPs || 0}</p>
          <p className="mt-1 text-xs text-yellow-700 opacity-80 dark:text-yellow-500">Awaiting Ops validation</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <h3 className="ml-2 text-sm font-medium">Active & Approved</h3>
          </div>
          <p className="mt-4 text-3xl font-bold text-foreground">{approvedIPs || 0}</p>
          <p className="mt-1 text-xs text-foreground opacity-60">Ready for marketplace & sales</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="font-semibold text-foreground">Action Required: Pending IP</h3>
            <Link 
              href="/ops-admin/vault" 
              className="text-sm font-medium text-primary hover:underline"
            >
              View Vault
            </Link>
          </div>
          
          <div className="divide-y divide-border">
            {recentPending && recentPending.length > 0 ? (
              recentPending.map((ip: any) => {
                const authorName = Array.isArray(ip.creator) 
                  ? ip.creator[0]?.display_name 
                  : ip.creator?.display_name;

                return (
                  <div key={ip.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-background/50">
                    <div>
                      <p className="font-medium text-foreground">{ip.title}</p>
                      <p className="text-xs text-foreground opacity-70">
                        Submitted by {authorName || 'Unknown'} • {new Date(ip.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Link 
                      href="/ops-admin/vault"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-8 text-center text-sm text-foreground opacity-70">
                <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-green-500 opacity-50" />
                All caught up! No pending IPs to review.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-border bg-surface px-6 py-5 shadow-sm">
            <h3 className="mb-4 font-semibold text-foreground">System Alerts</h3>
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">System running optimally</p>
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">All database connections and storage buckets are healthy.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}