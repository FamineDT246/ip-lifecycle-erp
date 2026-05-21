import { supabase } from '@/lib/supabase';
import type { SalesDeal, DealStage } from '@/types/database';

export const CrmService = {
  async getDashboardDeals(userId: string) {
    try {
      // Fetch open queue (unassigned leads)
      const { data: openDeals, error: openError } = await supabase
        .from('sales_deals')
        .select(`
          id, stage, created_at, expected_revenue,
          ip:ip_id(title, status),
          buyer:buyer_id(display_name, company_name)
        `)
        .is('sales_rep_id', null)
        .order('created_at', { ascending: true });

      if (openError) throw openError;

      // Fetch deals actively assigned to this specific rep
      const { data: activeDeals, error: activeError } = await supabase
        .from('sales_deals')
        .select(`
          id, stage, created_at, expected_revenue,
          ip:ip_id(title, status),
          buyer:buyer_id(display_name, company_name)
        `)
        .eq('sales_rep_id', userId)
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;

      return {
        unassignedDeals: (openDeals as unknown as SalesDeal[]) || [],
        myDeals: (activeDeals as unknown as SalesDeal[]) || []
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load dashboard data: ${error.message}`);
      }
      throw new Error('An unexpected system error occurred while loading dashboard data.');
    }
  },

  async claimLead(dealId: string, userId: string) {
    try {
      // Claiming a lead automatically moves it from an unassigned state into the rep's active pipeline
      const { data, error } = await supabase
        .from('sales_deals')
        .update({ 
          sales_rep_id: userId,
          stage: 'lead' 
        })
        .eq('id', dealId)
        .select(); 

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("Database blocked the update. Verify your RLS policies allow rep assignments.");
      }
      
      return data[0];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to claim lead: ${error.message}`);
      }
      throw new Error('An unexpected system error occurred while claiming the lead.');
    }
  },

  async getPipelineDeals(userId: string) {
    try {
      const { data, error } = await supabase
        .from('sales_deals')
        .select(`
          id, stage, expected_revenue, created_at,
          ip:ip_id(title, status),
          buyer:buyer_id(display_name, company_name)
        `)
        .eq('sales_rep_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data as unknown as SalesDeal[]) || [];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load pipeline data: ${error.message}`);
      }
      throw new Error('An unexpected system error occurred while loading the pipeline.');
    }
  },

  async updateDealStage(dealId: string, newStage: DealStage) {
    try {
      const { data, error } = await supabase
        .from('sales_deals')
        .update({ stage: newStage })
        .eq('id', dealId)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("Database blocked the update. Verify your RLS policies.");
      }
      
      return data[0];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to move deal stage: ${error.message}`);
      }
      throw new Error('An unexpected system error occurred while moving the deal.');
    }
  }
};