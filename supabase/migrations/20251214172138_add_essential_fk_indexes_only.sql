/*
  # Add Essential Foreign Key Indexes

  1. Performance Optimization
    - Add indexes only for foreign keys that are flagged as missing coverage
    - These specific foreign keys are likely to be used in future queries
    - Provides query performance benefits for JOIN operations
  
  2. Indexes Added
    - conversations.product_id - For product-based conversation lookups
    - orus_messages.sender_id - For sender message queries
    - orus_offers.message_id - For message-based offer lookups
    - orus_payout_requests.processed_by - For admin processing queries
    - orus_products.conformity_checked_by - For conformity tracking
    - products.buyer_id - For buyer purchase history
  
  3. Strategy
    - Only create indexes for foreign keys explicitly flagged
    - Use simple B-tree indexes for optimal performance
    - Monitor usage to ensure these indexes are actually utilized
*/

-- conversations table
CREATE INDEX IF NOT EXISTS idx_conversations_product_id 
ON conversations(product_id);

-- orus_messages table
CREATE INDEX IF NOT EXISTS idx_orus_messages_sender_id 
ON orus_messages(sender_id);

-- orus_offers table
CREATE INDEX IF NOT EXISTS idx_orus_offers_message_id 
ON orus_offers(message_id);

-- orus_payout_requests table
CREATE INDEX IF NOT EXISTS idx_orus_payout_requests_processed_by 
ON orus_payout_requests(processed_by);

-- orus_products table
CREATE INDEX IF NOT EXISTS idx_orus_products_conformity_checked_by 
ON orus_products(conformity_checked_by);

-- products table
CREATE INDEX IF NOT EXISTS idx_products_buyer_id 
ON products(buyer_id);