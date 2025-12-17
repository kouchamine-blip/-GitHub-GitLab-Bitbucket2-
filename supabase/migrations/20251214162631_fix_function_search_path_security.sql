/*
  # Fix Function Search Path Security

  1. Security Enhancement
    - Add explicit `SET search_path = public` to all functions
    - Prevents potential SQL injection via search_path manipulation
    - Ensures functions always use the correct schema
  
  2. Functions Updated
    - update_orus_conversation_updated_at
    - update_orus_offer_updated_at
    - create_subscription_on_user_insert
    - notify_product_sold
    - notify_price_change
    - generate_listing_serial
    - calculate_transaction_amounts
    - release_escrow_funds
    - log_product_changes
    - log_transaction_changes
    - log_payout_changes
    - log_user_changes
    - is_admin
  
  3. Note
    - Function logic remains unchanged
    - Only security hardening applied
*/

-- Fix update_orus_conversation_updated_at
CREATE OR REPLACE FUNCTION update_orus_conversation_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE orus_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Fix update_orus_offer_updated_at
CREATE OR REPLACE FUNCTION update_orus_offer_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix create_subscription_on_user_insert
CREATE OR REPLACE FUNCTION create_subscription_on_user_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO orus_subscriptions (user_id, subscription_date, platform)
  VALUES (NEW.id, CURRENT_DATE, 'TARINA');
  RETURN NEW;
END;
$$;

-- Fix notify_product_sold
CREATE OR REPLACE FUNCTION notify_product_sold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.buyer_id IS NOT NULL AND (OLD.buyer_id IS NULL OR OLD.buyer_id != NEW.buyer_id) THEN
    INSERT INTO notifications (user_id, type, title, message, related_product_id)
    VALUES (
      NEW.seller_id,
      'PRODUCT_SOLD',
      'Product Sold',
      'Your product "' || NEW.title || '" has been sold!',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Fix notify_price_change
CREATE OR REPLACE FUNCTION notify_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.price != OLD.price THEN
    INSERT INTO notifications (user_id, type, title, message, related_product_id)
    SELECT 
      orus_likes.user_id,
      'PRICE_CHANGE',
      'Price Update',
      'The price of "' || NEW.title || '" changed from ' || OLD.price || '€ to ' || NEW.price || '€',
      NEW.id
    FROM orus_likes
    WHERE orus_likes.product_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix generate_listing_serial
CREATE OR REPLACE FUNCTION generate_listing_serial()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year INT;
  counter_value INT;
BEGIN
  IF NEW.listing_serial IS NOT NULL THEN
    RETURN NEW;
  END IF;

  current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  INSERT INTO orus_listing_counters (user_id, year, counter)
  VALUES (NEW.seller_id, current_year, 1)
  ON CONFLICT (user_id, year)
  DO UPDATE SET counter = orus_listing_counters.counter + 1
  RETURNING counter INTO counter_value;

  NEW.listing_serial := NEW.seller_id::text || '-' || current_year::text || '-' || LPAD(counter_value::text, 4, '0');

  RETURN NEW;
END;
$$;

-- Fix calculate_transaction_amounts
CREATE OR REPLACE FUNCTION calculate_transaction_amounts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.protection_fee := ROUND(NEW.price * 0.10, 2);
  NEW.total_amount := NEW.price + NEW.protection_fee;
  RETURN NEW;
END;
$$;

-- Fix release_escrow_funds
CREATE OR REPLACE FUNCTION release_escrow_funds()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' AND NOT NEW.funds_released_to_seller THEN
    UPDATE orus_users
    SET wallet_balance = wallet_balance + NEW.price
    WHERE id = NEW.seller_id;

    INSERT INTO orus_wallet_transactions (
      user_id,
      transaction_type,
      amount,
      description,
      related_transaction_id
    ) VALUES (
      NEW.seller_id,
      'CREDIT',
      NEW.price,
      'Payment received for product sale',
      NEW.id
    );

    NEW.funds_released_to_seller := true;
  END IF;

  RETURN NEW;
END;
$$;

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
    changes,
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
    changes,
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
    changes,
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
    changes,
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

-- Fix is_admin function
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM orus_users
  WHERE id = user_id;
  
  RETURN user_role IN ('ADMIN', 'AGENT');
END;
$$;