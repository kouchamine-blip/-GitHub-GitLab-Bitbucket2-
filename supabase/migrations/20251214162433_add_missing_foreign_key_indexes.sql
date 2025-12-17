/*
  # Add Missing Foreign Key Indexes

  1. Performance Optimization
    - Add indexes on foreign key columns that were missing covering indexes
    - Improves query performance for joins and foreign key constraint checks
  
  2. Indexes Added
    - `conversations.product_id` - Index for product lookups in conversations
    - `orus_messages.sender_id` - Index for sender lookups in messages
    - `orus_offers.message_id` - Index for message lookups in offers
    - `orus_payout_requests.processed_by` - Index for admin user lookups in payouts
    - `orus_products.conformity_checked_by` - Index for admin user lookups in product checks
    - `products.buyer_id` - Index for buyer lookups in products
*/

-- Add index for conversations.product_id
CREATE INDEX IF NOT EXISTS idx_conversations_product_id 
ON conversations(product_id);

-- Add index for orus_messages.sender_id
CREATE INDEX IF NOT EXISTS idx_orus_messages_sender_id 
ON orus_messages(sender_id);

-- Add index for orus_offers.message_id
CREATE INDEX IF NOT EXISTS idx_orus_offers_message_id 
ON orus_offers(message_id);

-- Add index for orus_payout_requests.processed_by
CREATE INDEX IF NOT EXISTS idx_orus_payout_requests_processed_by 
ON orus_payout_requests(processed_by);

-- Add index for orus_products.conformity_checked_by
CREATE INDEX IF NOT EXISTS idx_orus_products_conformity_checked_by 
ON orus_products(conformity_checked_by);

-- Add index for products.buyer_id
CREATE INDEX IF NOT EXISTS idx_products_buyer_id 
ON products(buyer_id);