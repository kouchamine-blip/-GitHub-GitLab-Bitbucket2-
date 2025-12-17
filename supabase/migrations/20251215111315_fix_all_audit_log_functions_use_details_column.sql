/*
  # Fix All Audit Log Functions to Use 'details' Column

  1. Problem
    - Multiple audit log functions reference 'changes' column
    - The correct column name in orus_audit_logs is 'details'
    
  2. Solution
    - Update all audit log functions to use 'details' instead of 'changes'
    
  3. Functions Fixed
    - log_product_changes
    - log_transaction_changes
    - log_payout_changes
    - log_user_changes
*/

-- Fix log_product_changes
CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_type TEXT;
  changes JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'PRODUCT_CREATED';
    changes := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'PRODUCT_UPDATED';
    changes := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'PRODUCT_DELETED';
    changes := to_jsonb(OLD);
  END IF;

  INSERT INTO orus_audit_logs (
    user_id,
    action_type,
    entity_type,
    entity_id,
    details,
    status
  ) VALUES (
    COALESCE(NEW.seller_id, OLD.seller_id),
    action_type,
    'PRODUCT',
    COALESCE(NEW.id, OLD.id),
    changes,
    'SUCCESS'
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix log_transaction_changes
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_type TEXT;
  changes JSONB;
  log_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'TRANSACTION_CREATED';
    changes := to_jsonb(NEW);
    log_user_id := NEW.buyer_id;
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'TRANSACTION_UPDATED';
    changes := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
    log_user_id := NEW.buyer_id;
  END IF;

  INSERT INTO orus_audit_logs (
    user_id,
    action_type,
    entity_type,
    entity_id,
    details,
    status
  ) VALUES (
    log_user_id,
    action_type,
    'TRANSACTION',
    COALESCE(NEW.id, OLD.id),
    changes,
    'SUCCESS'
  );

  RETURN NEW;
END;
$$;

-- Fix log_payout_changes
CREATE OR REPLACE FUNCTION log_payout_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_type TEXT;
  changes JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'PAYOUT_CREATED';
    changes := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'PAYOUT_UPDATED';
    changes := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
  END IF;

  INSERT INTO orus_audit_logs (
    user_id,
    action_type,
    entity_type,
    entity_id,
    details,
    status
  ) VALUES (
    NEW.user_id,
    action_type,
    'PAYOUT',
    NEW.id,
    changes,
    'SUCCESS'
  );

  RETURN NEW;
END;
$$;

-- Fix log_user_changes
CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_type TEXT;
  changes JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'USER_CREATED';
    changes := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'USER_UPDATED';
    changes := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
  END IF;

  INSERT INTO orus_audit_logs (
    user_id,
    action_type,
    entity_type,
    entity_id,
    details,
    status
  ) VALUES (
    NEW.id,
    action_type,
    'USER',
    NEW.id,
    changes,
    'SUCCESS'
  );

  RETURN NEW;
END;
$$;