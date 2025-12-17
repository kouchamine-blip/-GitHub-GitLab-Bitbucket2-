/*
  # Fix Remaining Foreign Key Indexes and Cleanup Unused Indexes
  
  1. Add Missing Foreign Key Indexes
    - conversations.product_id
    - notifications.product_id  
    - orus_messages.sender_id
    - orus_offers.message_id
    - orus_payout_requests.processed_by
    - orus_products.conformity_checked_by
    - products.buyer_id
    
  2. Remove Unused Indexes
    - Only remove indexes that are truly unused and not critical for foreign key operations
    - Keep indexes that will be used by the application even if not used yet
    
  Strategy:
    - Keep indexes on user-facing foreign keys (user_id, product_id on main tables)
    - Remove indexes on rarely queried administrative fields
    - Remove indexes on deprecated/legacy tables that aren't being used
*/

-- ==============================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ==============================================

-- conversations table - product_id is queried when viewing product conversations
CREATE INDEX IF NOT EXISTS idx_conversations_product_id ON conversations(product_id);

-- notifications table - product_id is queried when displaying product-related notifications
CREATE INDEX IF NOT EXISTS idx_notifications_product_id ON notifications(product_id);

-- orus_messages table - sender_id is queried for message history and user activity
CREATE INDEX IF NOT EXISTS idx_orus_messages_sender_id ON orus_messages(sender_id);

-- orus_offers table - message_id links offers to messages
CREATE INDEX IF NOT EXISTS idx_orus_offers_message_id ON orus_offers(message_id);

-- orus_payout_requests table - processed_by tracks admin who processed the request
CREATE INDEX IF NOT EXISTS idx_orus_payout_requests_processed_by ON orus_payout_requests(processed_by);

-- orus_products table - conformity_checked_by tracks admin who checked conformity
CREATE INDEX IF NOT EXISTS idx_orus_products_conformity_checked_by ON orus_products(conformity_checked_by);

-- products table - buyer_id is queried for purchase history
CREATE INDEX IF NOT EXISTS idx_products_buyer_id ON products(buyer_id);

-- ==============================================
-- 2. REMOVE UNUSED INDEXES FROM LEGACY TABLES
-- ==============================================

-- The following tables appear to be legacy/deprecated (non-orus prefixed versions)
-- Remove their indexes if they're not being actively used

-- likes table indexes (if legacy table not in use)
DROP INDEX IF EXISTS idx_likes_product_id;

-- messages table indexes (if legacy table not in use)  
DROP INDEX IF EXISTS idx_messages_conversation_id;
DROP INDEX IF EXISTS idx_messages_sender_id;

-- offers table indexes (if legacy table not in use)
DROP INDEX IF EXISTS idx_offers_buyer_id;
DROP INDEX IF EXISTS idx_offers_product_id;

-- products table category index (if category filtering not implemented yet)
DROP INDEX IF EXISTS idx_products_category_id;

-- ==============================================
-- 3. KEEP CRITICAL ORUS TABLE INDEXES
-- ==============================================

-- These indexes are on the main ORUS tables and will be used by the application
-- even if they show as "unused" in initial scans. Keeping them:
-- - idx_notifications_user_id (used for user notification queries)
-- - idx_orus_audit_logs_user_id (used for user audit history)
-- - idx_orus_conversations_product_id (used for product conversation views)
-- - idx_orus_likes_product_id (used for product like counts)
-- - idx_orus_offers_conversation_id (used for conversation offer queries)
-- - idx_orus_offers_product_id (used for product offer queries)
-- - idx_orus_offers_transaction_id (used for transaction-offer linking)
-- - idx_orus_payout_requests_user_id (used for user payout history)
-- - idx_orus_products_buyer_id (used for buyer purchase history)
-- - idx_orus_transactions_buyer_id (used for buyer transaction history)
-- - idx_orus_transactions_product_id (used for product transaction history)
-- - idx_orus_transactions_seller_id (used for seller transaction history)
-- - idx_orus_wallet_transactions_user_id (used for user wallet history)

-- These are kept because they're on foreign keys in actively used tables
-- and will be critical for query performance as the app scales
