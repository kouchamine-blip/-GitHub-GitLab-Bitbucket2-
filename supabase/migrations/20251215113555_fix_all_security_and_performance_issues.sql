/*
  # Fix All Security and Performance Issues
  
  1. Add Missing Foreign Key Indexes
    - Add indexes on all foreign key columns that don't have covering indexes
    - This improves query performance for JOIN operations and foreign key checks
    
  2. Remove Unused Indexes
    - Remove indexes that are not being used to reduce storage and write overhead
    
  3. Fix RLS Policy Performance
    - Update policy to use (select auth.uid()) instead of auth.uid()
    - This prevents re-evaluation for each row and improves performance at scale
    
  4. Fix Function Search Path
    - Set stable search_path for functions to prevent security issues
*/

-- ==============================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ==============================================

-- likes table
CREATE INDEX IF NOT EXISTS idx_likes_product_id ON likes(product_id);

-- messages table
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- offers table
CREATE INDEX IF NOT EXISTS idx_offers_buyer_id ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_product_id ON offers(product_id);

-- orus_audit_logs table
CREATE INDEX IF NOT EXISTS idx_orus_audit_logs_user_id ON orus_audit_logs(user_id);

-- orus_conversations table
CREATE INDEX IF NOT EXISTS idx_orus_conversations_product_id ON orus_conversations(product_id);

-- orus_likes table
CREATE INDEX IF NOT EXISTS idx_orus_likes_product_id ON orus_likes(product_id);

-- orus_offers table
CREATE INDEX IF NOT EXISTS idx_orus_offers_conversation_id ON orus_offers(conversation_id);
CREATE INDEX IF NOT EXISTS idx_orus_offers_product_id ON orus_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_orus_offers_transaction_id ON orus_offers(transaction_id);

-- orus_payout_requests table
CREATE INDEX IF NOT EXISTS idx_orus_payout_requests_user_id ON orus_payout_requests(user_id);

-- orus_products table
CREATE INDEX IF NOT EXISTS idx_orus_products_buyer_id ON orus_products(buyer_id);

-- orus_transactions table
CREATE INDEX IF NOT EXISTS idx_orus_transactions_buyer_id ON orus_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orus_transactions_product_id ON orus_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_orus_transactions_seller_id ON orus_transactions(seller_id);

-- orus_wallet_transactions table
CREATE INDEX IF NOT EXISTS idx_orus_wallet_transactions_user_id ON orus_wallet_transactions(user_id);

-- products table
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- ==============================================
-- 2. REMOVE UNUSED INDEXES
-- ==============================================

DROP INDEX IF EXISTS idx_notifications_product_id;
DROP INDEX IF EXISTS idx_conversations_product_id;
DROP INDEX IF EXISTS idx_orus_messages_sender_id;
DROP INDEX IF EXISTS idx_orus_offers_message_id;
DROP INDEX IF EXISTS idx_orus_payout_requests_processed_by;
DROP INDEX IF EXISTS idx_orus_products_conformity_checked_by;
DROP INDEX IF EXISTS idx_products_buyer_id;

-- ==============================================
-- 3. FIX RLS POLICY PERFORMANCE
-- ==============================================

-- Fix the "Admins and agents can update all products" policy
DROP POLICY IF EXISTS "Admins and agents can update all products" ON orus_products;
CREATE POLICY "Admins and agents can update all products"
  ON orus_products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_users
      WHERE orus_users.id = (SELECT auth.uid())
      AND orus_users.role IN ('ADMIN', 'AGENT')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orus_users
      WHERE orus_users.id = (SELECT auth.uid())
      AND orus_users.role IN ('ADMIN', 'AGENT')
    )
  );

-- ==============================================
-- 4. FIX FUNCTION SEARCH PATH
-- ==============================================

-- Fix notify_seller_product_sold function
CREATE OR REPLACE FUNCTION notify_seller_product_sold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.buyer_id IS NOT NULL AND (OLD.buyer_id IS NULL OR OLD.buyer_id != NEW.buyer_id) THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      product_id
    )
    VALUES (
      NEW.seller_id,
      'product_sold',
      'Product Sold!',
      'Your product "' || NEW.title || '" has been sold for €' || NEW.price::text,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix notify_seller_new_offer function
CREATE OR REPLACE FUNCTION notify_seller_new_offer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  product_record RECORD;
BEGIN
  SELECT id, title, seller_id INTO product_record
  FROM orus_products
  WHERE id = NEW.product_id;
  
  IF product_record.seller_id != NEW.sender_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      product_id
    )
    VALUES (
      product_record.seller_id,
      'new_offer',
      'New Offer Received',
      'You received a new offer of €' || NEW.amount::text || ' for "' || product_record.title || '"',
      product_record.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;
