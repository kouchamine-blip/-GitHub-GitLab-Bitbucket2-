/*
  # Add Remaining Foreign Key Indexes

  1. Performance Optimization
    - Add indexes on all remaining foreign key columns
    - Improves query performance for joins and lookups
    - Essential for maintaining good performance as data grows
  
  2. Indexes Added
    - `likes.product_id` - For product lookup in likes
    - `messages.conversation_id` - For conversation message lookups
    - `messages.sender_id` - For sender message lookups
    - `notifications.user_id` - For user notification lookups
    - `offers.buyer_id` - For buyer offer lookups
    - `offers.product_id` - For product offer lookups
    - `orus_audit_logs.user_id` - For user audit log lookups
    - `orus_conversations.product_id` - For product conversation lookups
    - `orus_likes.product_id` - For product like lookups
    - `orus_offers.conversation_id` - For conversation offer lookups
    - `orus_offers.product_id` - For product offer lookups
    - `orus_offers.transaction_id` - For transaction offer lookups
    - `orus_payout_requests.user_id` - For user payout lookups
    - `orus_products.buyer_id` - For buyer product lookups
    - `orus_transactions.buyer_id` - For buyer transaction lookups
    - `orus_transactions.product_id` - For product transaction lookups
    - `orus_transactions.seller_id` - For seller transaction lookups
    - `orus_wallet_transactions.user_id` - For user wallet transaction lookups
    - `products.category_id` - For category product lookups
*/

-- likes table
CREATE INDEX IF NOT EXISTS idx_likes_product_id_fk 
ON likes(product_id);

-- messages table
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_fk 
ON messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id_fk 
ON messages(sender_id);

-- notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_fk 
ON notifications(user_id);

-- offers table
CREATE INDEX IF NOT EXISTS idx_offers_buyer_id_fk 
ON offers(buyer_id);

CREATE INDEX IF NOT EXISTS idx_offers_product_id_fk 
ON offers(product_id);

-- orus_audit_logs table
CREATE INDEX IF NOT EXISTS idx_orus_audit_logs_user_id_fk 
ON orus_audit_logs(user_id);

-- orus_conversations table
CREATE INDEX IF NOT EXISTS idx_orus_conversations_product_id_fk 
ON orus_conversations(product_id);

-- orus_likes table
CREATE INDEX IF NOT EXISTS idx_orus_likes_product_id_fk 
ON orus_likes(product_id);

-- orus_offers table
CREATE INDEX IF NOT EXISTS idx_orus_offers_conversation_id_fk 
ON orus_offers(conversation_id);

CREATE INDEX IF NOT EXISTS idx_orus_offers_product_id_fk 
ON orus_offers(product_id);

CREATE INDEX IF NOT EXISTS idx_orus_offers_transaction_id_fk 
ON orus_offers(transaction_id);

-- orus_payout_requests table
CREATE INDEX IF NOT EXISTS idx_orus_payout_requests_user_id_fk 
ON orus_payout_requests(user_id);

-- orus_products table
CREATE INDEX IF NOT EXISTS idx_orus_products_buyer_id_fk 
ON orus_products(buyer_id);

-- orus_transactions table
CREATE INDEX IF NOT EXISTS idx_orus_transactions_buyer_id_fk 
ON orus_transactions(buyer_id);

CREATE INDEX IF NOT EXISTS idx_orus_transactions_product_id_fk 
ON orus_transactions(product_id);

CREATE INDEX IF NOT EXISTS idx_orus_transactions_seller_id_fk 
ON orus_transactions(seller_id);

-- orus_wallet_transactions table
CREATE INDEX IF NOT EXISTS idx_orus_wallet_transactions_user_id_fk 
ON orus_wallet_transactions(user_id);

-- products table
CREATE INDEX IF NOT EXISTS idx_products_category_id_fk 
ON products(category_id);