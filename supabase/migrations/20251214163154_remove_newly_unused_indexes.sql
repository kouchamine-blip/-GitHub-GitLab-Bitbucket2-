/*
  # Remove Newly Unused Indexes

  1. Performance Optimization
    - Remove indexes that were created but are not being used by queries
    - These indexes were identified by database analytics as unused
    - Reduces storage overhead and improves write performance
  
  2. Indexes Removed
    - `idx_conversations_product_id` - Not used by queries
    - `idx_orus_messages_sender_id` - Not used by queries
    - `idx_orus_offers_message_id` - Not used by queries
    - `idx_orus_payout_requests_processed_by` - Not used by queries
    - `idx_orus_products_conformity_checked_by` - Not used by queries
    - `idx_products_buyer_id` - Not used by queries
  
  3. Note
    - Foreign key indexes that ARE being used are kept
    - Only truly unused indexes are removed
*/

-- Remove unused index from conversations
DROP INDEX IF EXISTS idx_conversations_product_id;

-- Remove unused index from orus_messages
DROP INDEX IF EXISTS idx_orus_messages_sender_id;

-- Remove unused index from orus_offers
DROP INDEX IF EXISTS idx_orus_offers_message_id;

-- Remove unused index from orus_payout_requests
DROP INDEX IF EXISTS idx_orus_payout_requests_processed_by;

-- Remove unused index from orus_products
DROP INDEX IF EXISTS idx_orus_products_conformity_checked_by;

-- Remove unused index from products
DROP INDEX IF EXISTS idx_products_buyer_id;