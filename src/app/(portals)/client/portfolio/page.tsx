'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, FolderKanban, ShoppingBag, PlusCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/forms/Button';
import { formatAuditDate } from '@/lib/formatters';
import type { IntellectualProperty, SalesDeal } from '@/types/database';
import { Container } from '@/components/ui/Container';

export default function ClientPortfolioPage() {
  const [activeTab, setActiveTab] = useState<'my_ips' | 'acquisitions'>('acquisitions');
  const [myIPs, setMyIPs] = useState<IntellectualProperty[]>([]);
  const [myDeals, setMyDeals] = useState<SalesDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'buyer' | 'creator' | null>(null);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (profile) setUserRole(profile.role as 'buyer' | 'creator');

      const { data: ips } = await supabase
        .from('intellectual_properties')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      const { data: deals } = await supabase
        .from('sales_deals')
        .select(`
          id, stage, created_at,
          ip:ip_id(title, status)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      setMyIPs((ips as IntellectualProperty[]) || []);
      setMyDeals((deals as unknown as SalesDeal[]) || []);
      
      if (profile?.role === 'creator' && (!deals || deals.length === 0)) {
        setActiveTab('my_ips');
      }

    } catch (error) {
      console.error("Error fetching portfolio data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <Container className="py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Portfolio</h1>
          <p className="mt-1 text-sm text-foreground opacity-70">
            Track your IP submissions and manage active licensing negotiations.
          </p>
        </div>
        
        {userRole === 'creator' && (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Register New IP
          </Button>
        )}
      </div>

      <div className="mb-6 flex space-x-1 rounded-lg bg-surface p-1 border border-border sm:max-w-md">
        <button
          onClick={() => setActiveTab('acquisitions')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'acquisitions' 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'text-foreground opacity-70 hover:bg-background'
          }`}
        >
          My Acquisitions
        </button>
        <button
          onClick={() => setActiveTab('my_ips')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'my_ips' 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'text-foreground opacity-70 hover:bg-background'
          }`}
        >
          My Listed IPs
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        {activeTab === 'acquisitions' && (
          myDeals.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <ShoppingBag className="mb-3 h-10 w-10 text-foreground opacity-30" />
              <h3 className="text-sm font-semibold text-foreground">No active acquisitions</h3>
              <p className="mt-1 text-sm text-foreground opacity-70">
                Browse the marketplace to find intellectual properties to license.
              </p>
              <Link href="/client/marketplace" className="mt-4">
                <Button variant="outline">Browse Marketplace</Button>
              </Link>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-foreground opacity-70">IP Asset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-foreground opacity-70">Deal Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-foreground opacity-70">Date Requested</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-foreground opacity-70">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {myDeals.map((deal) => {
                  const title = Array.isArray(deal.ip) ? deal.ip[0]?.title : deal.ip?.title;
                  return (
                    <tr key={deal.id} className="transition-colors hover:bg-background/50">
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-foreground">{title || 'Unknown IP'}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-semibold uppercase text-foreground opacity-80">
                          {deal.stage.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground opacity-70">
                        {formatAuditDate(deal.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <Link href={`/client/deals/${deal.id}`}>
                          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                            Open Room &rarr;
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}

        {activeTab === 'my_ips' && (
          myIPs.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <FolderKanban className="mb-3 h-10 w-10 text-foreground opacity-30" />
              <h3 className="text-sm font-semibold text-foreground">No IPs Listed</h3>
              <p className="mt-1 text-sm text-foreground opacity-70">
                You haven't registered any intellectual properties yet.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-foreground opacity-70">Project Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-foreground opacity-70">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-foreground opacity-70">Date Submitted</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-foreground opacity-70">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {myIPs.map((ip) => (
                  <tr key={ip.id} className="transition-colors hover:bg-background/50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="font-medium text-foreground">{ip.title}</p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${
                        ip.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400' : 
                        ip.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400' : 
                        'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {ip.status === 'approved' && <CheckCircle className="mr-1 h-3 w-3" />}
                        {ip.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                        {ip.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground opacity-70">
                      {formatAuditDate(ip.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">Manage</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

    </Container>
  );
}