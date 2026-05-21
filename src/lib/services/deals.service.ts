import { supabase } from '@/lib/supabase';
import type { SalesDeal, Contract, ContractClause } from '@/types/database';

export const DealsService = {
  async getDealWorkspaceData(dealId: string) {
    try {
      // Fetch the core deal context including related entity profiles.
      // This combined fetch ensures the UI has all necessary metadata (buyer name, IP status) 
      // to render the workspace without requiring secondary client-side fetches.
      const { data: dealData, error: dealError } = await supabase
        .from('sales_deals')
        .select(`*, ip:ip_id(*), buyer:buyer_id(*), sales_rep:sales_rep_id(*)`)
        .eq('id', dealId)
        .single();

      if (dealError) throw dealError;

      // Isolate the active contract. We sort by created_at descending and limit to 1 
      // to ensure we only load the most recent negotiation iteration if multiple drafts exist.
      const { data: contractData } = await supabase
        .from('contracts')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let clausesData: ContractClause[] = [];
      
      if (contractData) {
        // Clauses are fetched separately but bundled into the return object
        // to guarantee the UI receives a complete, synchronized state of the entire negotiation.
        const { data } = await supabase
          .from('clauses')
          .select('*')
          .eq('contract_id', contractData.id)
          .order('clause_order', { ascending: true });
          
        clausesData = (data as ContractClause[]) || [];
      }

      return {
        deal: dealData as unknown as SalesDeal,
        contract: contractData as Contract | null,
        clauses: clausesData
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Workspace data retrieval failed: ${error.message}`);
      }
      throw new Error('An unexpected system error occurred during workspace initialization.');
    }
  },

  async updateRevenue(dealId: string, revenue: number | null) {
    try {
      const { error } = await supabase
        .from('sales_deals')
        .update({ expected_revenue: revenue })
        .eq('id', dealId);

      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Revenue update failed: ${error.message}`);
      }
      throw new Error('An unexpected system error occurred while updating revenue.');
    }
  },

  async generateDraftContract(dealId: string) {
    try {
      // A contract must exist in a draft state before clauses can be attached.
      // We return the inserted row to immediately map the new contract ID to the clauses.
      const { data: newContract, error: contractError } = await supabase
        .from('contracts')
        .insert({ deal_id: dealId, status: 'draft' })
        .select()
        .single();

      if (contractError) throw contractError;

      // Injecting boilerplate clauses bootstraps the negotiation process.
      // This prevents Sales Reps from having to manually copy-paste standard enterprise 
      // legal text for every new deal, ensuring baseline legal compliance.
      const defaultClauses = [
        { 
          contract_id: newContract.id, 
          title: 'Grant of License', 
          content: 'The Licensor hereby grants to the Licensee a non-exclusive, non-transferable license to use the Intellectual Property in accordance with the terms of this Agreement.',
          clause_order: 1
        },
        { 
          contract_id: newContract.id, 
          title: 'Term and Termination', 
          content: 'This Agreement shall commence on the Effective Date and remain in effect until terminated by either party upon thirty (30) days prior written notice.',
          clause_order: 2
        },
        { 
          contract_id: newContract.id, 
          title: 'Payment and Royalties', 
          content: 'In consideration for the license granted herein, the Licensee agrees to pay the Licensor the fee outlined in the Deal Financials, payable within 30 days of invoice.',
          clause_order: 3
        }
      ];

      const { error: clausesError } = await supabase
        .from('clauses')
        .insert(defaultClauses);

      if (clausesError) throw clausesError;

      return newContract as Contract;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Contract generation failed: ${error.message}`);
      }
      throw new Error('An unexpected system error occurred while generating the draft contract.');
    }
  }
};