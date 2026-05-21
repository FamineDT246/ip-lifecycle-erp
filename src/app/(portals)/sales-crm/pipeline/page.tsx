'use client';

import { useState, useEffect } from 'react';
import { Loader2, GripVertical, DollarSign, Building2, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CrmService } from '@/lib/services/crm.service';
import type { SalesDeal, DealStage } from '@/types/database';
import { Container } from '@/components/ui/Container';

const PIPELINE_STAGES: { id: DealStage; label: string; headerColor: string; icon: any }[] = [
  { id: 'lead', label: 'Inbound Lead', headerColor: 'bg-blue-600 text-white border-blue-700 dark:bg-blue-700', icon: FileText },
  { id: 'negotiating', label: 'Negotiating', headerColor: 'bg-amber-500 text-white border-amber-600 dark:bg-amber-600', icon: Building2 },
  { id: 'contract_sent', label: 'Contract Sent', headerColor: 'bg-purple-600 text-white border-purple-700 dark:bg-purple-700', icon: DollarSign },
  { id: 'closed_won', label: 'Closed Won', headerColor: 'bg-green-600 text-white border-green-700 dark:bg-green-700', icon: CheckCircle2 },
  { id: 'closed_lost', label: 'Closed Lost', headerColor: 'bg-red-600 text-white border-red-700 dark:bg-red-700', icon: XCircle },
];

export default function PipelinePage() {
  const [deals, setDeals] = useState<SalesDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

  useEffect(() => {
    fetchPipeline();
  }, []);

  const fetchPipeline = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const pipelineDeals = await CrmService.getPipelineDeals(user.id);
      setDeals(pipelineDeals);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId);
    e.dataTransfer.setData('text/plain', dealId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStage: DealStage) => {
    e.preventDefault();
    if (!draggedDealId) return;

    const dealToMove = deals.find(d => d.id === draggedDealId);
    if (!dealToMove || dealToMove.stage === newStage) {
      setDraggedDealId(null);
      return;
    }

    // Optimistically update the UI to make the drag-and-drop feel instantaneous
    setDeals(prevDeals => 
      prevDeals.map(deal => 
        deal.id === draggedDealId ? { ...deal, stage: newStage } : deal
      )
    );

    try {
      await CrmService.updateDealStage(draggedDealId, newStage);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
      // Revert the optimistic update if the server rejects the stage change
      await fetchPipeline();
    } finally {
      setDraggedDealId(null);
    }
  };

  if (isLoading) {
    return <div className="flex h-[calc(100vh-8rem)] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" /></div>;
  }

  return (
    <Container isWide className="py-8 h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-foreground">Sales Pipeline</h1>
        <p className="mt-1 text-sm text-foreground opacity-70">
          Drag and drop deals to update their status.
        </p>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex h-full min-w-max gap-6">
          
          {PIPELINE_STAGES.map((stage) => {
            const columnDeals = deals.filter(d => d.stage === stage.id);
            const columnTotal = columnDeals.reduce((sum, deal) => sum + (deal.expected_revenue || 0), 0);
            const Icon = stage.icon;

            return (
              <div 
                key={stage.id} 
                className="flex w-80 flex-col rounded-xl border border-border bg-surface/50 overflow-hidden"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className={`flex items-center justify-between border-b px-4 py-3 ${stage.headerColor}`}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <h3 className="font-semibold">{stage.label}</h3>
                  </div>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background/50 text-xs font-bold shadow-sm">
                    {columnDeals.length}
                  </span>
                </div>
                
                <div className="bg-background/30 px-4 py-2 text-xs font-medium opacity-70 border-b border-border text-right">
                  Total: {columnTotal > 0 ? `$${columnTotal.toLocaleString()}` : 'TBD'}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {columnDeals.map((deal) => {
                    const ipTitle = Array.isArray(deal.ip) ? deal.ip[0]?.title : deal.ip?.title;
                    const buyerName = Array.isArray(deal.buyer) ? deal.buyer[0]?.display_name : deal.buyer?.display_name;
                    const companyName = Array.isArray(deal.buyer) ? deal.buyer[0]?.company_name : deal.buyer?.company_name;

                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        className={`group cursor-grab active:cursor-grabbing rounded-lg border border-border bg-background p-4 shadow-sm transition-all hover:border-primary hover:shadow-md ${
                          draggedDealId === deal.id ? 'opacity-50 ring-2 ring-primary ring-offset-2' : ''
                        }`}
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <h4 className="font-medium text-foreground line-clamp-1">{ipTitle || 'Unknown IP'}</h4>
                          <GripVertical className="h-4 w-4 text-foreground opacity-20 group-hover:opacity-100" />
                        </div>
                        
                        <div className="space-y-1 text-sm text-foreground opacity-70">
                          <p className="line-clamp-1">{companyName || buyerName || 'Unknown Buyer'}</p>
                          <p className="font-medium text-foreground">
                            {deal.expected_revenue ? `$${deal.expected_revenue.toLocaleString()}` : 'Revenue TBD'}
                          </p>
                        </div>
                        
                        <div className="mt-3 text-right">
                          <a 
                            href={`/sales-crm/deals/${deal.id}`}
                            className="text-xs font-medium text-primary hover:underline"
                            onMouseDown={(e) => e.stopPropagation()} 
                          >
                            Open Deal Room &rarr;
                          </a>
                        </div>
                      </div>
                    );
                  })}
                  
                  {columnDeals.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-border text-xs text-foreground opacity-30">
                      Drop deals here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Container>
  );
}