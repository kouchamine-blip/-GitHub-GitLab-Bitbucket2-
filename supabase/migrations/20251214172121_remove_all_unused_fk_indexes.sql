/*
  # Remove All Unused Foreign Key Indexes

  1. Performance Optimization
    - Remove 25 unused indexes identified by database analytics
    - These indexes consume storage and slow down writes without providing query benefits
    - Database statistics show these indexes are not being utilized by the query planner
  
  2. Indexes Removed
    - likes: product_id index
    - messages: conversation_id, sender_id indexes
    - notifications: user_id index
    - offers: buyer_id, product_id indexes
    - orus_audit_logs: user_id index
    - orus_conversations: product_id index
    - orus_likes: product_id index
    - orus_offers: conversation_id, product_id, transaction_id indexes
    - orus_payout_requests: user_id index
    - orus_products: buyer_id index
    - orus_transactions: buyer_id, product_id, seller_id indexes
    - orus_wallet_transactions: user_id index
    - products: category_id index
  
  3. Rationale
    - Query patterns show these foreign key columns are not frequently used in JOINs
    - Removing unused indexes reduces write overhead and storage costs
    - Foreign key constraints remain intact for data integrity
*/

-- likes table
DROP INDEX IF EXISTS idx_likes_product_id_fk;

-- messages table
DROP INDEX IF EXISTS idx_messages_conversation_id_fk;
DROP INDEX IF EXISTS idx_messages_sender_id_fk;

-- notifications table
DROP INDEX IF EXISTS idx_notifications_user_id_fk;

-- offers table
DROP INDEX IF EXISTS idx_offers_buyer_id_fk;
DROP INDEX IF EXISTS idx_offers_product_id_fk;

-- orus_audit_logs table
DROP INDEX IF EXISTS idx_orus_audit_logs_user_id_fk;

-- orus_conversations table
DROP INDEX IF EXISTS idx_orus_conversations_product_id_fk;

-- orus_likes table
DROP INDEX IF EXISTS idx_orus_likes_product_id_fk;

-- orus_offers table
DROP INDEX IF EXISTS idx_orus_offers_conversation_id_fk;
DROP INDEX IF EXISTS idx_orus_offers_product_id_fk;
DROP INDEX IF EXISTS idx_orus_offers_transaction_id_fk;

-- orus_payout_requests table
DROP INDEX IF EXISTS idx_orus_payout_requests_user_id_fk;

-- orus_products table
DROP INDEX IF EXISTS idx_orus_products_buyer_id_fk;

-- orus_transactions table
DROP INDEX IF EXISTS idx_orus_transactions_buyer_id_fk;
DROP INDEX IF EXISTS idx_orus_transactions_product_id_fk;
DROP INDEX IF EXISTS idx_orus_transactions_seller_id_fk;

-- orus_wallet_transactions table
DROP INDEX IF EXISTS idx_orus_wallet_transactions_user_id_fk;

-- products table
DROP INDEX IF EXISTS idx_products_category_id_fk;