import { supabase } from '@/lib/supabase';
import type { IntellectualProperty } from '@/types/database';

// Cleanly omit the original 'creator' type and replace it with our specific query shape
export interface MarketplaceIP extends Omit<IntellectualProperty, 'creator'> {
  creator?: { display_name: string };
}

/**
 * Service handling all B2B interactions within the IP Marketplace.
 * * BUSINESS LOGIC RATIONALE:
 * The marketplace should only display 'approved' IPs that the current user 
 * has NOT already requested. By filtering out existing leads at the database 
 * query level, we prevent duplicate pipeline entries and streamline the UX.
 */
export const MarketplaceService = {
  
  fetchAvailableIPs: async (userId: string, searchTerm?: string): Promise<MarketplaceIP[]> => {
    // 1. Identify which IPs the user has already initiated negotiations for
    const { data: userDeals, error: dealError } = await supabase
      .from('sales_deals')
      .select('ip_id')
      .eq('buyer_id', userId);
      
    if (dealError) throw new Error(dealError.message);

    const requestedIpIds = userDeals?.map(deal => deal.ip_id) || [];

    // 2. Fetch all globally approved IPs
    let query = supabase
      .from('intellectual_properties')
      .select('id, title, description, created_at, creator:creator_id(display_name)')
      .eq('status', 'approved');

    // 3. Omit IPs the user already has in their pipeline
    if (requestedIpIds.length > 0) {
      query = query.not('id', 'in', `(${requestedIpIds.join(',')})`);
    }

    if (searchTerm) {
      query = query.ilike('title', `%${searchTerm}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(20);

    if (error) throw new Error(error.message);

    // Normalize the Supabase join array structure
    return (data || []).map(ip => ({
      ...ip,
      creator: Array.isArray(ip.creator) ? ip.creator[0] : ip.creator
    })) as MarketplaceIP[];
  },

  requestLicenseLead: async (ipId: string, buyerId: string): Promise<void> => {
    const { error } = await supabase
      .from('sales_deals')
      .insert({
        ip_id: ipId,
        buyer_id: buyerId,
        stage: 'lead'
      });

    if (error) throw new Error(error.message);
  }
};