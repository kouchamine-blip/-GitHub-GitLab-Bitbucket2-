/*
  # Audit Logs System for ORUS
  
  ## Overview
  Complete activity logging system to track all important actions in the platform.
  
  ## New Tables
  
  ### `orus_audit_logs`
  Comprehensive audit trail for all system activities
  - `id` (uuid, primary key)
  - `user_id` (uuid, references orus_users, nullable for system actions)
  - `action_type` (enum: LOGIN, LOGOUT, PRODUCT_CREATE, PRODUCT_UPDATE, PRODUCT_MODERATE, TRANSACTION_CREATE, ESCROW_RELEASE, PAYOUT_REQUEST, PAYOUT_PROCESS, USER_CREATE, USER_UPDATE, STORE_DEPOSIT, STORE_QUALITY_CHECK, STORE_WITHDRAWAL)
  - `entity_type` (text: USER, PRODUCT, TRANSACTION, PAYOUT, etc)
  - `entity_id` (uuid, nullable)
  - `details` (jsonb, stores action-specific data)
  - `ip_address` (text, nullable)
  - `user_agent` (text, nullable)
  - `status` (enum: SUCCESS, FAILED, PENDING)
  - `error_message` (text, nullable)
  - `created_at` (timestamptz)
  
  ## Security
  - RLS enabled
  - Only ADMIN role can view all logs
  - Users can view their own action logs
  - Automatic triggers log critical database changes
  
  ## Indexes
  - user_id, action_type, entity_type, created_at for fast filtering
*/

-- Create audit log action types enum
DO $$ BEGIN
  CREATE TYPE orus_audit_action AS ENUM (
    'LOGIN',
    'LOGOUT',
    'PRODUCT_CREATE',
    'PRODUCT_UPDATE',
    'PRODUCT_MODERATE',
    'PRODUCT_DELETE',
    'TRANSACTION_CREATE',
    'TRANSACTION_UPDATE',
    'ESCROW_RELEASE',
    'PAYOUT_REQUEST',
    'PAYOUT_PROCESS',
    'USER_CREATE',
    'USER_UPDATE',
    'USER_DELETE',
    'STORE_DEPOSIT',
    'STORE_QUALITY_CHECK',
    'STORE_WITHDRAWAL',
    'ADMIN_ACTION'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create audit log status enum
DO $$ BEGIN
  CREATE TYPE orus_audit_status AS ENUM ('SUCCESS', 'FAILED', 'PENDING');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create audit logs table
CREATE TABLE IF NOT EXISTS orus_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES orus_users(id) ON DELETE SET NULL,
  action_type orus_audit_action NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  status orus_audit_status DEFAULT 'SUCCESS',
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orus_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all logs"
  ON orus_audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Users can view own logs"
  ON orus_audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert logs"
  ON orus_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON orus_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON orus_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON orus_audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON orus_audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON orus_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON orus_audit_logs(status);

-- Function to automatically log product changes
CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO orus_audit_logs (user_id, action_type, entity_type, entity_id, details)
    VALUES (NEW.seller_id, 'PRODUCT_CREATE', 'PRODUCT', NEW.id, 
            jsonb_build_object('title', NEW.title, 'price', NEW.price, 'category', NEW.category));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Log moderation changes
    IF (OLD.status_moderation != NEW.status_moderation) THEN
      INSERT INTO orus_audit_logs (user_id, action_type, entity_type, entity_id, details)
      VALUES (auth.uid(), 'PRODUCT_MODERATE', 'PRODUCT', NEW.id,
              jsonb_build_object('old_status', OLD.status_moderation, 'new_status', NEW.status_moderation, 'title', NEW.title));
    END IF;
    
    -- Log logistics changes
    IF (OLD.status_logistique != NEW.status_logistique) THEN
      INSERT INTO orus_audit_logs (user_id, action_type, entity_type, entity_id, details)
      VALUES (auth.uid(), 
              CASE NEW.status_logistique
                WHEN 'DEPOSE' THEN 'STORE_DEPOSIT'
                WHEN 'CONTROLE_OK' THEN 'STORE_QUALITY_CHECK'
                WHEN 'RETIRE' THEN 'STORE_WITHDRAWAL'
                ELSE 'PRODUCT_UPDATE'
              END,
              'PRODUCT', NEW.id,
              jsonb_build_object('old_status', OLD.status_logistique, 'new_status', NEW.status_logistique, 'title', NEW.title));
    END IF;
    
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO orus_audit_logs (user_id, action_type, entity_type, entity_id, details)
    VALUES (auth.uid(), 'PRODUCT_DELETE', 'PRODUCT', OLD.id,
            jsonb_build_object('title', OLD.title, 'price', OLD.price));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for product changes
DROP TRIGGER IF EXISTS product_audit_trigger ON orus_products;
CREATE TRIGGER product_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON orus_products
  FOR EACH ROW
  EXECUTE FUNCTION log_product_changes();

-- Function to log transaction changes
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO orus_audit_logs (user_id, action_type, entity_type, entity_id, details)
    VALUES (NEW.buyer_id, 'TRANSACTION_CREATE', 'TRANSACTION', NEW.id,
            jsonb_build_object('montant_total', NEW.montant_total, 'commission', NEW.commission_plateforme, 'product_id', NEW.product_id));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Log escrow release
    IF (OLD.funds_released = false AND NEW.funds_released = true) THEN
      INSERT INTO orus_audit_logs (user_id, action_type, entity_type, entity_id, details)
      VALUES (NEW.seller_id, 'ESCROW_RELEASE', 'TRANSACTION', NEW.id,
              jsonb_build_object('amount_released', NEW.montant_vendeur_net, 'product_id', NEW.product_id));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for transaction changes
DROP TRIGGER IF EXISTS transaction_audit_trigger ON orus_transactions;
CREATE TRIGGER transaction_audit_trigger
  AFTER INSERT OR UPDATE ON orus_transactions
  FOR EACH ROW
  EXECUTE FUNCTION log_transaction_changes();

-- Function to log payout changes
CREATE OR REPLACE FUNCTION log_payout_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO orus_audit_logs (user_id, action_type, entity_type, entity_id, details)
    VALUES (NEW.user_id, 'PAYOUT_REQUEST', 'PAYOUT', NEW.id,
            jsonb_build_object('amount', NEW.amount, 'iban', NEW.iban));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.status != NEW.status AND NEW.status IN ('COMPLETED', 'REJECTED')) THEN
      INSERT INTO orus_audit_logs (user_id, action_type, entity_type, entity_id, details)
      VALUES (NEW.processed_by, 'PAYOUT_PROCESS', 'PAYOUT', NEW.id,
              jsonb_build_object('user_id', NEW.user_id, 'amount', NEW.amount, 'status', NEW.status, 'rejection_reason', NEW.rejection_reason));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for payout changes
DROP TRIGGER IF EXISTS payout_audit_trigger ON orus_payout_requests;
CREATE TRIGGER payout_audit_trigger
  AFTER INSERT OR UPDATE ON orus_payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_payout_changes();

-- Function to log user changes
CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO orus_audit_logs (user_id, action_type, entity_type, entity_id, details)
    VALUES (NEW.id, 'USER_CREATE', 'USER', NEW.id,
            jsonb_build_object('email', NEW.email, 'role', NEW.role, 'full_name', NEW.full_name));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO orus_audit_logs (user_id, action_type, entity_type, entity_id, details)
    VALUES (NEW.id, 'USER_UPDATE', 'USER', NEW.id,
            jsonb_build_object('changes', jsonb_build_object(
              'wallet_balance_changed', OLD.wallet_balance != NEW.wallet_balance,
              'old_balance', OLD.wallet_balance,
              'new_balance', NEW.wallet_balance
            )));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user changes
DROP TRIGGER IF EXISTS user_audit_trigger ON orus_users;
CREATE TRIGGER user_audit_trigger
  AFTER INSERT OR UPDATE ON orus_users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_changes();