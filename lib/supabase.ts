import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'ADMIN' | 'AGENT' | 'USER';

export interface OrusUser {
  id: string;
  email: string;
  role: UserRole;
  wallet_balance: number;
  iban: string | null;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  is_verified_seller: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrusProduct {
  id: string;
  seller_id: string;
  buyer_id: string | null;
  title: string;
  description: string;
  price: number;
  status_moderation: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED_BY_SELLER' | 'BANNED_BY_MODERATOR';
  status_logistique: 'DEPOT_ATTENTE' | 'DEPOSE' | 'CONTROLE_OK' | 'VENDU' | 'RETIRE';
  deposit_code: string | null;
  withdrawal_code: string | null;
  images: string[];
  image_url: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrusTransaction {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  montant_total: number;
  commission_plateforme: number;
  montant_vendeur_net: number;
  payment_method: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  funds_released: boolean;
  created_at: string;
  released_at: string | null;
}

export interface OrusPayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  iban: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  rejection_reason: string | null;
}
