'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, TrendingUp, FolderArchive, Loader2, ShieldQuestion, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/forms/Button';
import { supabase } from '@/lib/supabase';
import { formatAuditDate } from '@/lib/formatters';

export default function ClientDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ requests: 0, uploads: 0 });
  const [recentDeals, setRecentDeals] = useState<any[]>([]);
  
  const [userRole, setUserRole] = useState<string>('buyer');
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user role
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        const role = profile?.role || 'buyer';
        setUserRole(role);

        // Fetch application status if buyer
        if (role === 'buyer') {
          const { data: app } = await supabase
            .from('creator_applications')
            .select('status')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          if (app) setApplicationStatus(app.status);
        }

        const [dealsResponse, uploadsResponse] = await Promise.all([
          supabase.from('sales_deals').select('*', { count: 'exact', head: true }).eq('buyer_id', user.id),
          supabase.from('intellectual_properties').select('*', { count: 'exact', head: true }).eq('creator_id', user.id),
        ]);

        const { data: deals } = await supabase
          .from('sales_deals')
          .select('id, stage, created_at, ip:ip_id(title)')
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          requests: dealsResponse.count || 0,
          uploads: uploadsResponse.count || 0,
        });
        
        setRecentDeals(deals || []);
      } catch (error) {
        console.error("Error fetching overview:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleApplyCreator = async () => {
    setIsApplying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('creator_applications')
        .insert({ user_id: user.id });

      if (error) throw error;
      setApplicationStatus('pending');
    } catch (error: any) {
      console.error("Application failed:", error);
      alert("Failed to submit application. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" /></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Client Dashboard</h1>
        <p className="mt-1 text-sm text-foreground opacity-70">
          An overview of your marketplace activity and pending requests.
        </p>
      </div>

      {/* Creator Application Banner */}
      {userRole === 'buyer' && applicationStatus !== 'rejected' && (
        <div className="mb-8 flex flex-col justify-between items-start sm:items-center sm:flex-row rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/30 dark:bg-blue-900/10">
          <div className="mb-4 sm:mb-0">
            <h3 className="flex items-center text-lg font-semibold text-blue-900 dark:text-blue-200">
              <ShieldQuestion className="mr-2 h-5 w-5" />
              Unlock Creator Tools
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-400 max-w-2xl">
              Are you an IP owner? Apply for Creator Access to submit your own intellectual properties to the Vault for commercial licensing.
            </p>
          </div>
          <div>
            {applicationStatus === 'pending' ? (
              <span className="inline-flex items-center rounded-md border border-yellow-300 bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-900/30 dark:text-yellow-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Application Pending
              </span>
            ) : (
              <Button onClick={handleApplyCreator} isLoading={isApplying} className="bg-blue-600 text-white hover:bg-blue-700">
                Apply Now
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Existing KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <TrendingUp className="h-5 w-5" />
            <h3 className="ml-2 text-sm font-medium">Active Requests</h3>
          </div>
          <p className="mt-4 text-3xl font-bold text-foreground">{stats.requests}</p>
        </div>

        {userRole === 'creator' && (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center text-purple-600 dark:text-purple-400">
              <FolderArchive className="h-5 w-5" />
              <h3 className="ml-2 text-sm font-medium">My Uploads</h3>
            </div>
            <p className="mt-4 text-3xl font-bold text-foreground">{stats.uploads}</p>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="font-semibold text-foreground">Recent Licensing Requests</h3>
            <Link href="/client/portfolio" className="text-sm font-medium text-primary hover:underline">
              View Portfolio
            </Link>
          </div>
          
          <div className="divide-y divide-border">
            {recentDeals.length > 0 ? (
              recentDeals.map((deal) => {
                const ipTitle = Array.isArray(deal.ip) ? deal.ip[0]?.title : deal.ip?.title;
                return (
                  <div key={deal.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="font-medium text-foreground">{ipTitle || 'Unknown IP'}</p>
                      <p className="mt-1 text-xs text-foreground opacity-70">
                        {formatAuditDate(deal.created_at)}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium uppercase text-blue-700">
                      {deal.stage}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-8 text-center">
                <Clock className="mx-auto mb-2 h-8 w-8 text-foreground opacity-30" />
                <p className="text-sm font-medium text-foreground opacity-70">No recent requests.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}