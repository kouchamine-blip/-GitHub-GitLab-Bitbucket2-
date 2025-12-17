/*
  # Remove Unused Indexes

  1. Performance Optimization
    - Remove indexes that are not being used by queries
    - Reduces storage overhead and improves write performance
    - Indexes can be recreated later if usage patterns change
  
  2. Indexes Removed
    - Multiple unused indexes on various tables
    - These were identified by database analytics as unused
  
  3. Note
    - Indexes on frequently queried columns are retained
    - Only truly unused indexes are removed
*/

-- Remove unused indexes from orus_products
DROP INDEX IF EXISTS idx_orus_products_buyer;
DROP INDEX IF EXISTS idx_orus_products_status_log;
DROP INDEX IF EXISTS idx_orus_products_listing_serial;
DROP INDEX IF EXISTS idx_orus_products_conformity_status;

-- Remove unused indexes from orus_transactions
DROP INDEX IF EXISTS idx_orus_transactions_product;
DROP INDEX IF EXISTS idx_orus_transactions_buyer;
DROP INDEX IF EXISTS idx_orus_transactions_seller;
DROP INDEX IF EXISTS idx_orus_transactions_status;
DROP INDEX IF EXISTS idx_orus_transactions_funds_released;

-- Remove unused indexes from orus_wallet_transactions
DROP INDEX IF EXISTS idx_orus_wallet_trans_user;

-- Remove unused indexes from orus_payout_requests
DROP INDEX IF EXISTS idx_orus_payout_user;
DROP INDEX IF EXISTS idx_orus_payout_status;

-- Remove unused indexes from notifications
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_read;

-- Remove unused indexes from orus_audit_logs
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_action_type;
DROP INDEX IF EXISTS idx_audit_logs_entity_type;
DROP INDEX IF EXISTS idx_audit_logs_entity_id;
DROP INDEX IF EXISTS idx_audit_logs_created_at;
DROP INDEX IF EXISTS idx_audit_logs_status;

-- Remove unused indexes from products
DROP INDEX IF EXISTS idx_products_category_id;
DROP INDEX IF EXISTS idx_products_created_at;

-- Remove unused indexes from likes
DROP INDEX IF EXISTS idx_likes_product_id;

-- Remove unused indexes from offers
DROP INDEX IF EXISTS idx_offers_product_id;
DROP INDEX IF EXISTS idx_offers_buyer_id;
DROP INDEX IF EXISTS idx_offers_status;

-- Remove unused indexes from conversation_participants
DROP INDEX IF EXISTS idx_conversation_participants_conversation_id;

-- Remove unused indexes from messages
DROP INDEX IF EXISTS idx_messages_conversation_id;
DROP INDEX IF EXISTS idx_messages_sender_id;
DROP INDEX IF EXISTS idx_messages_created_at;

-- Remove unused indexes from orus_conversations
DROP INDEX IF EXISTS idx_orus_conversations_product;

-- Remove unused indexes from orus_subscriptions
DROP INDEX IF EXISTS idx_orus_subscriptions_date;
DROP INDEX IF EXISTS idx_orus_subscriptions_platform;

-- Remove unused indexes from orus_likes
DROP INDEX IF EXISTS idx_orus_likes_product_id;

-- Remove unused indexes from orus_user_search_history
DROP INDEX IF EXISTS idx_orus_search_history_created_at;

-- Remove unused indexes from orus_offers
DROP INDEX IF EXISTS idx_orus_offers_conversation;
DROP INDEX IF EXISTS idx_orus_offers_product;
DROP INDEX IF EXISTS idx_orus_offers_status;
DROP INDEX IF EXISTS idx_orus_offers_payment_status;
DROP INDEX IF EXISTS idx_orus_offers_transaction;

-- Remove unused indexes from orus_listing_counters
DROP INDEX IF EXISTS idx_orus_listing_counters_user_year;