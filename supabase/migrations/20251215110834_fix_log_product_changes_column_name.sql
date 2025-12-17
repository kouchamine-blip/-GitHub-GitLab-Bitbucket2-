/*
  # Fix log_product_changes Function

  1. Issue
    - Function was using 'changes' column which doesn't exist
    - Should use 'details' column instead
    
  2. Fix
    - Update the log_product_changes function to use correct column name 'details'
*/

CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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