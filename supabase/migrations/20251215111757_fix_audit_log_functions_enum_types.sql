/*
  # Fix Audit Log Functions to Use Correct ENUM Values

  1. Problem
    - Functions use TEXT values like 'PRODUCT_CREATED', 'PRODUCT_UPDATED'
    - Column expects orus_audit_action ENUM with values like 'PRODUCT_CREATE', 'PRODUCT_UPDATE'
    
  2. Solution
    - Update all functions to use correct ENUM values
    - Cast TEXT to orus_audit_action type
    
  3. Correct Mappings
    - PRODUCT_CREATED → PRODUCT_CREATE
    - PRODUCT_UPDATED → PRODUCT_UPDATE
    - PRODUCT_DELETED → PRODUCT_DELETE
    - TRANSACTION_CREATED → TRANSACTION_CREATE
    - TRANSACTION_UPDATED → TRANSACTION_UPDATE
    - PAYOUT_CREATED → PAYOUT_REQUEST
    - PAYOUT_UPDATED → PAYOUT_PROCESS
    - USER_CREATED → USER_CREATE
    - USER_UPDATED → USER_UPDATE
*/

-- Fix log_product_changes
CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_type orus_audit_action;
  changes JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'PRODUCT_CREATE';
    changes := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'PRODUCT_UPDATE';
    changes := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'PRODUCT_DELETE';
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
  action_type orus_audit_action;
  changes JSONB;
  log_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'TRANSACTION_CREATE';
    changes := to_jsonb(NEW);
    log_user_id := NEW.buyer_id;
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'TRANSACTION_UPDATE';
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
  action_type orus_audit_action;
  changes JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'PAYOUT_REQUEST';
    changes := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'PAYOUT_PROCESS';
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
  action_type orus_audit_action;
  changes JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'USER_CREATE';
    changes := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'USER_UPDATE';
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