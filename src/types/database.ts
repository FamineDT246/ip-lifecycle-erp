export type UserRole = 'buyer' | 'creator' | 'sales_rep' | 'ops_admin';
export type IPStatus = 'pending' | 'approved' | 'rejected';
export type DealStage = 'lead' | 'negotiating' | 'contract_sent' | 'closed_won' | 'closed_lost';

export interface User {
  id: string;
  role: UserRole;
  display_name: string | null;
  company_name: string | null;
  phone_number: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface IntellectualProperty {
  id: string;
  title: string;
  description: string | null;
  creator_id: string;
  status: IPStatus;
  created_at: string;
  updated_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  creator?: User | { display_name: string }; 
}

export interface SalesDeal {
  id: string;
  ip_id: string;
  buyer_id: string;
  sales_rep_id: string | null;
  stage: DealStage;
  expected_revenue: number | null;
  created_at: string;
  updated_at: string;
  ip?: IntellectualProperty | { title: string; status: string; creator_id?: string };
  buyer?: User;
  sales_rep?: User;
}

export interface CreatorApplication {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: User | { display_name: string; company_name: string };
}

export interface IPAsset {
  id: string;
  ip_id: string;
  title: string;
  file_name: string;
  file_url: string;
  price: number | null;
  uploaded_by: string;
  created_at: string;
}

export interface IPDocument {
  id: string;
  ip_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size_bytes: number;
  uploaded_by: string;
  created_at: string;
}

export interface Contract {
  id: string;
  deal_id: string;
  status: 'draft' | 'pending_signature' | 'signed';
  created_at: string;
  updated_at: string;
}

export interface ContractClause {
  id: string;
  contract_id: string;
  title: string;
  content: string;
  clause_order: number;
  created_at: string;
}

export interface AmendedClause {
  id: string;
  clause_id: string;
  proposed_text: string;
  status: 'pending' | 'approved' | 'rejected';
  created_by: string; 
  created_at: string;
}