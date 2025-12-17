/*
  # Optimize RLS Policies - Auth UID Performance

  1. Performance Optimization
    - Replace `auth.uid()` with `(select auth.uid())` in all RLS policies
    - This prevents re-evaluation of auth.uid() for each row
    - Dramatically improves query performance at scale
  
  2. Policies Updated
    - All tables with RLS policies using auth.uid() or auth.jwt()
    - Maintains exact same security logic, only optimizes execution
  
  3. Security
    - No security changes - policies remain restrictive as before
    - Only performance optimization applied
*/

-- Drop and recreate all policies with optimized auth.uid()

-- user_profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

-- products policies
DROP POLICY IF EXISTS "Sellers can insert own products" ON products;
CREATE POLICY "Sellers can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = (select auth.uid()));

DROP POLICY IF EXISTS "Sellers can update own products" ON products;
CREATE POLICY "Sellers can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (seller_id = (select auth.uid()))
  WITH CHECK (seller_id = (select auth.uid()));

DROP POLICY IF EXISTS "Sellers can delete own products" ON products;
CREATE POLICY "Sellers can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (seller_id = (select auth.uid()));

-- likes policies
DROP POLICY IF EXISTS "Users can read own likes" ON likes;
CREATE POLICY "Users can read own likes"
  ON likes FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own likes" ON likes;
CREATE POLICY "Users can create own likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- offers policies
DROP POLICY IF EXISTS "Users can read offers for their products" ON offers;
CREATE POLICY "Users can read offers for their products"
  ON offers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = offers.product_id 
      AND products.seller_id = (select auth.uid())
    ) OR buyer_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "Buyers can create offers" ON offers;
CREATE POLICY "Buyers can create offers"
  ON offers FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Buyers can update own offers" ON offers;
CREATE POLICY "Buyers can update own offers"
  ON offers FOR UPDATE
  TO authenticated
  USING (buyer_id = (select auth.uid()))
  WITH CHECK (buyer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Sellers can update offers on their products" ON offers;
CREATE POLICY "Sellers can update offers on their products"
  ON offers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = offers.product_id 
      AND products.seller_id = (select auth.uid())
    )
  );

-- conversations policies
DROP POLICY IF EXISTS "Users can read conversations they participate in" ON conversations;
CREATE POLICY "Users can read conversations they participate in"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = (select auth.uid())
    )
  );

-- conversation_participants policies
DROP POLICY IF EXISTS "Users can read own participation" ON conversation_participants;
CREATE POLICY "Users can read own participation"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own participation" ON conversation_participants;
CREATE POLICY "Users can create own participation"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own participation" ON conversation_participants;
CREATE POLICY "Users can update own participation"
  ON conversation_participants FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- messages policies
DROP POLICY IF EXISTS "Users can read messages in their conversations" ON messages;
CREATE POLICY "Users can read messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = (select auth.uid())
    )
  );

-- orus_users policies
DROP POLICY IF EXISTS "Users can read full own profile" ON orus_users;
CREATE POLICY "Users can read full own profile"
  ON orus_users FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON orus_users;
CREATE POLICY "Users can update own profile"
  ON orus_users FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON orus_users;
CREATE POLICY "Users can insert own profile"
  ON orus_users FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

-- orus_payout_requests policies
DROP POLICY IF EXISTS "Users can read own payout requests" ON orus_payout_requests;
CREATE POLICY "Users can read own payout requests"
  ON orus_payout_requests FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own payout requests" ON orus_payout_requests;
CREATE POLICY "Users can create own payout requests"
  ON orus_payout_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all payouts" ON orus_payout_requests;
CREATE POLICY "Admins can manage all payouts"
  ON orus_payout_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_users
      WHERE orus_users.id = (select auth.uid())
      AND orus_users.role IN ('ADMIN', 'AGENT')
    )
  );

-- orus_products policies
DROP POLICY IF EXISTS "Anyone can read approved products" ON orus_products;
CREATE POLICY "Anyone can read approved products"
  ON orus_products FOR SELECT
  TO authenticated
  USING (
    status_moderation = 'APPROVED' OR 
    seller_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own products" ON orus_products;
CREATE POLICY "Users can insert own products"
  ON orus_products FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = (select auth.uid()));

DROP POLICY IF EXISTS "Sellers can update own products" ON orus_products;
CREATE POLICY "Sellers can update own products"
  ON orus_products FOR UPDATE
  TO authenticated
  USING (seller_id = (select auth.uid()))
  WITH CHECK (seller_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins and agents can view all products" ON orus_products;
CREATE POLICY "Admins and agents can view all products"
  ON orus_products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_users
      WHERE orus_users.id = (select auth.uid())
      AND orus_users.role IN ('ADMIN', 'AGENT')
    )
  );

DROP POLICY IF EXISTS "Admins and agents can update all products" ON orus_products;
CREATE POLICY "Admins and agents can update all products"
  ON orus_products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_users
      WHERE orus_users.id = (select auth.uid())
      AND orus_users.role IN ('ADMIN', 'AGENT')
    )
  );

DROP POLICY IF EXISTS "Admins and agents can delete products" ON orus_products;
CREATE POLICY "Admins and agents can delete products"
  ON orus_products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_users
      WHERE orus_users.id = (select auth.uid())
      AND orus_users.role IN ('ADMIN', 'AGENT')
    )
  );

-- orus_transactions policies
DROP POLICY IF EXISTS "Users can read own transactions" ON orus_transactions;
CREATE POLICY "Users can read own transactions"
  ON orus_transactions FOR SELECT
  TO authenticated
  USING (buyer_id = (select auth.uid()) OR seller_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can read all transactions" ON orus_transactions;
CREATE POLICY "Admins can read all transactions"
  ON orus_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_users
      WHERE orus_users.id = (select auth.uid())
      AND orus_users.role = 'ADMIN'
    )
  );

-- orus_wallet_transactions policies
DROP POLICY IF EXISTS "Users can read own wallet transactions" ON orus_wallet_transactions;
CREATE POLICY "Users can read own wallet transactions"
  ON orus_wallet_transactions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can read all wallet transactions" ON orus_wallet_transactions;
CREATE POLICY "Admins can read all wallet transactions"
  ON orus_wallet_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_users
      WHERE orus_users.id = (select auth.uid())
      AND orus_users.role = 'ADMIN'
    )
  );

-- orus_audit_logs policies
DROP POLICY IF EXISTS "Users can view own logs" ON orus_audit_logs;
CREATE POLICY "Users can view own logs"
  ON orus_audit_logs FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all logs" ON orus_audit_logs;
CREATE POLICY "Admins can view all logs"
  ON orus_audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_users
      WHERE orus_users.id = (select auth.uid())
      AND orus_users.role = 'ADMIN'
    )
  );

-- notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- orus_conversations policies
DROP POLICY IF EXISTS "Users can view conversations they are part of" ON orus_conversations;
CREATE POLICY "Users can view conversations they are part of"
  ON orus_conversations FOR SELECT
  TO authenticated
  USING (buyer_id = (select auth.uid()) OR seller_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create conversations as buyer" ON orus_conversations;
CREATE POLICY "Users can create conversations as buyer"
  ON orus_conversations FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = (select auth.uid()));

-- orus_user_search_history policies
DROP POLICY IF EXISTS "Users can view own search history" ON orus_user_search_history;
CREATE POLICY "Users can view own search history"
  ON orus_user_search_history FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own search history" ON orus_user_search_history;
CREATE POLICY "Users can create own search history"
  ON orus_user_search_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own search history" ON orus_user_search_history;
CREATE POLICY "Users can delete own search history"
  ON orus_user_search_history FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- orus_messages policies
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON orus_messages;
CREATE POLICY "Users can view messages from their conversations"
  ON orus_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_conversations
      WHERE orus_conversations.id = orus_messages.conversation_id
      AND (orus_conversations.buyer_id = (select auth.uid()) OR orus_conversations.seller_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON orus_messages;
CREATE POLICY "Users can send messages in their conversations"
  ON orus_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM orus_conversations
      WHERE orus_conversations.id = orus_messages.conversation_id
      AND (orus_conversations.buyer_id = (select auth.uid()) OR orus_conversations.seller_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can mark messages as read" ON orus_messages;
CREATE POLICY "Users can mark messages as read"
  ON orus_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_conversations
      WHERE orus_conversations.id = orus_messages.conversation_id
      AND (orus_conversations.buyer_id = (select auth.uid()) OR orus_conversations.seller_id = (select auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orus_conversations
      WHERE orus_conversations.id = orus_messages.conversation_id
      AND (orus_conversations.buyer_id = (select auth.uid()) OR orus_conversations.seller_id = (select auth.uid()))
    )
  );

-- orus_offers policies
DROP POLICY IF EXISTS "Users can view offers in their conversations" ON orus_offers;
CREATE POLICY "Users can view offers in their conversations"
  ON orus_offers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_conversations
      WHERE orus_conversations.id = orus_offers.conversation_id
      AND (orus_conversations.buyer_id = (select auth.uid()) OR orus_conversations.seller_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can create offers as senders" ON orus_offers;
CREATE POLICY "Users can create offers as senders"
  ON orus_offers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orus_messages
      WHERE orus_messages.id = orus_offers.message_id
      AND orus_messages.sender_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Receivers can update offers" ON orus_offers;
CREATE POLICY "Receivers can update offers"
  ON orus_offers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_conversations c
      JOIN orus_messages m ON m.conversation_id = c.id
      WHERE m.id = orus_offers.message_id
      AND (
        (m.sender_id = c.buyer_id AND c.seller_id = (select auth.uid()))
        OR (m.sender_id = c.seller_id AND c.buyer_id = (select auth.uid()))
      )
    )
  );

-- orus_subscriptions policies
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON orus_subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON orus_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_users
      WHERE orus_users.id = (select auth.uid())
      AND orus_users.role = 'ADMIN'
    )
  );

-- orus_likes policies
DROP POLICY IF EXISTS "Users can view own likes" ON orus_likes;
CREATE POLICY "Users can view own likes"
  ON orus_likes FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own likes" ON orus_likes;
CREATE POLICY "Users can create own likes"
  ON orus_likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own likes" ON orus_likes;
CREATE POLICY "Users can delete own likes"
  ON orus_likes FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));