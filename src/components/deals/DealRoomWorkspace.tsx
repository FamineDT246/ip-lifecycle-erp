'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, DollarSign, Building2, User as UserIcon, FileText, CheckCircle, Scale, PenTool } from 'lucide-react';
import { Button } from '@/components/forms/Button';
import { DealsService } from '@/lib/services/deals.service';
import type { SalesDeal, UserRole, Contract, ContractClause } from '@/types/database';

interface DealRoomWorkspaceProps {
  dealId: string;
  currentUserRole: UserRole;
  currentUserId: string;
}

export function DealRoomWorkspace({ dealId, currentUserRole, currentUserId }: DealRoomWorkspaceProps) {
  const [deal, setDeal] = useState<SalesDeal | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditingRevenue, setIsEditingRevenue] = useState(false);
  const [tempRevenue, setTempRevenue] = useState('');
  const [isSavingRevenue, setIsSavingRevenue] = useState(false);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);

  const loadWorkspaceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await DealsService.getDealWorkspaceData(dealId);
      
      // Strict client-side authorization perimeter.
      // We explicitly check if the logged-in user is a direct participant in this specific deal.
      // This acts as a secondary defense layer alongside Supabase RLS to prevent URL-guessing access.
      const isBuyer = data.deal.buyer_id === currentUserId;
      const isCreator = data.deal.ip?.creator_id === currentUserId;
      const isAssignedRep = data.deal.sales_rep_id === currentUserId;
      
      if (!isBuyer && !isCreator && !isAssignedRep && currentUserRole !== 'ops_admin' && currentUserRole !== 'sales_rep') {
        throw new Error("Unauthorized access to this deal room.");
      }

      setDeal(data.deal);
      setContract(data.contract);
      setClauses(data.clauses);
      setTempRevenue(data.deal.expected_revenue?.toString() || '');

    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [dealId, currentUserId, currentUserRole]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  const handleUpdateRevenue = async () => {
    if (!deal) return;
    setIsSavingRevenue(true);
    try {
      const numValue = parseFloat(tempRevenue);
      const finalRevenue = isNaN(numValue) ? null : numValue;
      
      await DealsService.updateRevenue(deal.id, finalRevenue);
      
      // Optimistically update the UI state to reflect the new revenue immediately,
      // avoiding the performance hit and screen flicker of a full database refetch.
      setDeal({ ...deal, expected_revenue: finalRevenue });
      setIsEditingRevenue(false);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setIsSavingRevenue(false);
    }
  };

  const handleGenerateContract = async () => {
    if (!deal) return;
    setIsGeneratingContract(true);
    try {
      await DealsService.generateDraftContract(deal.id);
      
      // A full data reload is required here because contract generation cascades
      // multiple new rows (the contract itself and multiple default clauses) that the UI needs to map.
      await loadWorkspaceData();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setIsGeneratingContract(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" /></div>;
  }

  if (!deal) {
    return <div className="text-center py-12 text-foreground opacity-70">Deal not found or access denied.</div>;
  }

  const ipData = Array.isArray(deal.ip) ? deal.ip[0] : deal.ip;
  const buyerData = Array.isArray(deal.buyer) ? deal.buyer[0] : deal.buyer;
  const repData = Array.isArray(deal.sales_rep) ? deal.sales_rep[0] : deal.sales_rep;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">{ipData?.title || 'Unknown IP'}</h2>
              <p className="text-sm text-foreground opacity-70">Asset Status: <span className="uppercase font-semibold text-primary">{ipData?.status}</span></p>
            </div>
            <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground">
              Stage: {deal.stage.replace('_', ' ')}
            </span>
          </div>

          {/* Creators are isolated from buyer identity to prevent off-platform circumvention */}
          {currentUserRole !== 'creator' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground opacity-70">
                  <Building2 className="h-4 w-4" /> The Buyer
                </div>
                <p className="font-medium text-foreground">{buyerData?.display_name || 'Unknown'}</p>
                <p className="text-sm text-foreground opacity-70">{buyerData?.company_name || 'Independent'}</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground opacity-70">
                  <UserIcon className="h-4 w-4" /> Assigned Rep
                </div>
                <p className="font-medium text-foreground">{repData?.display_name || 'Unassigned Queue'}</p>
                <p className="text-sm text-foreground opacity-70">IP Vault Sales Team</p>
              </div>
            </div>
          )}
        </div>

        {/* Contract negotiation is restricted from creators during early drafting phases */}
        {currentUserRole !== 'creator' && (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Scale className="h-5 w-5 text-primary" /> Contract Clauses
              </h3>
              {contract && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold uppercase text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Status: {contract.status.replace('_', ' ')}
                </span>
              )}
            </div>

            {!contract ? (
              <div className="flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50">
                <p className="text-sm font-medium text-foreground opacity-70">No contract generated yet.</p>
                {currentUserRole === 'sales_rep' && (
                  <Button 
                    size="sm" 
                    className="mt-3" 
                    onClick={handleGenerateContract}
                    isLoading={isGeneratingContract}
                  >
                    Generate Draft Contract
                  </Button>
                )}
              </div>
            ) : clauses.length === 0 ? (
               <div className="text-center py-6 border border-dashed border-border rounded-lg">
                  <p className="text-sm text-foreground opacity-70">Contract exists but contains no clauses.</p>
               </div>
            ) : (
              <div className="space-y-4">
                {clauses.map((clause, index) => (
                  <div key={clause.id} className="rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/30">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">
                        {index + 1}. {clause.title}
                      </h4>
                      {currentUserRole === 'buyer' && contract.status === 'draft' && (
                        <button className="flex items-center text-xs font-medium text-primary hover:underline">
                          <PenTool className="mr-1 h-3 w-3" /> Propose Amendment
                        </button>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-foreground opacity-80">
                      {clause.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="lg:col-span-1 space-y-6">
        {currentUserRole !== 'creator' && (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
              <DollarSign className="h-5 w-5 text-green-600" /> Deal Financials
            </h3>

            <div className="mb-6 rounded-lg bg-background p-4 border border-border">
              <p className="text-sm font-medium text-foreground opacity-70 mb-1">
                {currentUserRole === 'sales_rep' ? 'Expected Revenue' : 'Proposed Licensing Fee'}
              </p>
              
              {currentUserRole === 'sales_rep' ? (
                isEditingRevenue ? (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-foreground font-medium">$</span>
                    <input 
                      type="number"
                      value={tempRevenue}
                      onChange={(e) => setTempRevenue(e.target.value)}
                      className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="0.00"
                    />
                    <Button size="sm" onClick={handleUpdateRevenue} isLoading={isSavingRevenue}>Save</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl font-bold text-foreground">
                      {deal.expected_revenue ? `$${deal.expected_revenue.toLocaleString()}` : 'TBD'}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingRevenue(true)}>Edit</Button>
                  </div>
                )
              ) : (
                <div className="mt-1">
                  <span className="text-2xl font-bold text-foreground">
                    {deal.expected_revenue ? `$${deal.expected_revenue.toLocaleString()}` : 'Pending Quote'}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {currentUserRole === 'sales_rep' && (
                <>
                  <Button className="w-full">Message Buyer</Button>
                  <Button variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50">
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark as Closed Won
                  </Button>
                </>
              )}

              {currentUserRole === 'buyer' && contract?.status === 'pending_signature' && (
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">Review & Sign Contract</Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}