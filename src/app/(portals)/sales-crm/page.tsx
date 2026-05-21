'use client';

import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Handshake, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/forms/Button';
import { supabase } from '@/lib/supabase';
import { formatAuditDate } from '@/lib/formatters';
import { CrmService } from '@/lib/services/crm.service';
import type { SalesDeal } from '@/types/database';
import { Container } from '@/components/ui/Container';

export default function SalesDashboardPage() {
  const [unassignedDeals, setUnassignedDeals] = useState<SalesDeal[]>([]);
  const [myDeals, setMyDeals] = useState<SalesDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Auth context remains in the UI layer to securely pass the current user ID to the service
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { unassignedDeals, myDeals } = await CrmService.getDashboardDeals(user.id);
      
      setUnassignedDeals(unassignedDeals);
      setMyDeals(myDeals);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimDeal = async (dealId: string) => {
    setClaimingId(dealId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await CrmService.claimLead(dealId, user.id);

      // Optimistic UI update to instantly move the card without requiring a full refetch
      const claimedDeal = unassignedDeals.find(d => d.id === dealId);
      if (claimedDeal) {
        setUnassignedDeals(prev => prev.filter(d => d.id !== dealId));
        setMyDeals(prev => [{ ...claimedDeal, stage: 'lead' }, ...prev]);
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
      // Revert state if the claim fails
      await fetchDashboardData();
    } finally {
      setClaimingId(null);
    }
  };

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" /></div>;
  }

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Sales Command Center</h1>
        <p className="mt-1 text-sm text-foreground opacity-70">
          Claim incoming license requests and manage your active pipeline.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
              Open Queue
            </h2>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">
              {unassignedDeals.length} Pending
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {unassignedDeals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center">
                <Clock className="mx-auto mb-2 h-6 w-6 text-foreground opacity-30" />
                <p className="text-sm font-medium text-foreground opacity-70">No open requests.</p>
                <p className="text-xs text-foreground opacity-50 mt-1">All incoming leads are currently assigned.</p>
              </div>
            ) : (
              unassignedDeals.map((deal) => {
                const ipTitle = Array.isArray(deal.ip) ? deal.ip[0]?.title : deal.ip?.title;
                const buyerName = Array.isArray(deal.buyer) ? deal.buyer[0]?.display_name : deal.buyer?.display_name;
                const companyName = Array.isArray(deal.buyer) ? deal.buyer[0]?.company_name : deal.buyer?.company_name;

                return (
                  <div key={deal.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-primary/50">
                    <div className="mb-3">
                      <h3 className="font-semibold text-foreground line-clamp-1">{ipTitle || 'Unknown IP'}</h3>
                      <p className="text-sm text-foreground opacity-70 line-clamp-1">
                        Buyer: {buyerName} {companyName ? `(${companyName})` : ''}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-foreground opacity-50">
                        {formatAuditDate(deal.created_at)}
                      </span>
                      <Button 
                        size="sm" 
                        onClick={() => handleClaimDeal(deal.id)}
                        isLoading={claimingId === deal.id}
                        disabled={claimingId !== null}
                      >
                        Claim Lead
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              My Active Deals
            </h2>
            <Link href="/sales-crm/pipeline" className="text-sm font-medium text-primary hover:underline">
              View Kanban Board &rarr;
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            {myDeals.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <Handshake className="mb-3 h-10 w-10 text-foreground opacity-30" />
                <h3 className="text-sm font-semibold text-foreground">Pipeline is empty</h3>
                <p className="mt-1 text-sm text-foreground opacity-70">Claim a lead from the open queue to get started.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-background">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-foreground opacity-70">IP Asset & Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-foreground opacity-70">Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-foreground opacity-70">Est. Revenue</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-foreground opacity-70">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {myDeals.map((deal) => {
                    const ipTitle = Array.isArray(deal.ip) ? deal.ip[0]?.title : deal.ip?.title;
                    const buyerName = Array.isArray(deal.buyer) ? deal.buyer[0]?.display_name : deal.buyer?.display_name;
                    
                    return (
                      <tr key={deal.id} className="transition-colors hover:bg-background/50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <p className="font-medium text-foreground">{ipTitle || 'Unknown IP'}</p>
                          <p className="text-sm text-foreground opacity-70">{buyerName || 'Unknown Buyer'}</p>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="inline-flex rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-semibold uppercase text-foreground opacity-80">
                            {deal.stage.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                          {deal.expected_revenue ? `$${deal.expected_revenue.toLocaleString()}` : 'TBD'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <Link href={`/sales-crm/deals/${deal.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}