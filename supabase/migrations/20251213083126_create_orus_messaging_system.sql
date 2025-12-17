/*
  # Create ORUS Messaging System
  
  This migration creates a complete messaging system for the ORUS platform.
  
  1. New Tables
    - `orus_conversations`
      - `id` (uuid, primary key)
      - `product_id` (uuid, references orus_products) - Links conversation to a product
      - `buyer_id` (uuid, references orus_users) - The user who initiated the conversation
      - `seller_id` (uuid, references orus_users) - The product seller
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `orus_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references orus_conversations)
      - `sender_id` (uuid, references orus_users)
      - `content` (text) - The message content
      - `read` (boolean) - Whether the message has been read
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Users can view conversations they are part of (as buyer or seller)
    - Users can send messages in their conversations
    - Users can read messages from their conversations
    
  3. Important Notes
    - Each conversation is tied to a specific product
    - Conversations are between a buyer and seller
    - Messages track read status for notification purposes
*/

-- Create orus_conversations table
CREATE TABLE IF NOT EXISTS orus_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES orus_products(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES orus_users(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES orus_users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orus_messages table
CREATE TABLE IF NOT EXISTS orus_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES orus_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES orus_users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orus_conversations_buyer ON orus_conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orus_conversations_seller ON orus_conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_orus_conversations_product ON orus_conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_orus_messages_conversation ON orus_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_orus_messages_created_at ON orus_messages(created_at DESC);

-- Enable RLS
ALTER TABLE orus_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orus_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orus_conversations
CREATE POLICY "Users can view conversations they are part of"
  ON orus_conversations FOR SELECT
  TO authenticated
  USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id
  );

CREATE POLICY "Users can create conversations as buyer"
  ON orus_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- RLS Policies for orus_messages
CREATE POLICY "Users can view messages from their conversations"
  ON orus_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_conversations
      WHERE orus_conversations.id = conversation_id
      AND (orus_conversations.buyer_id = auth.uid() OR orus_conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON orus_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM orus_conversations
      WHERE orus_conversations.id = conversation_id
      AND (orus_conversations.buyer_id = auth.uid() OR orus_conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON orus_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_conversations
      WHERE orus_conversations.id = conversation_id
      AND (orus_conversations.buyer_id = auth.uid() OR orus_conversations.seller_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orus_conversations
      WHERE orus_conversations.id = conversation_id
      AND (orus_conversations.buyer_id = auth.uid() OR orus_conversations.seller_id = auth.uid())
    )
  );

-- Function to update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_orus_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orus_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp when new message is sent
DROP TRIGGER IF EXISTS update_conversation_timestamp ON orus_messages;
CREATE TRIGGER update_conversation_timestamp
  AFTER INSERT ON orus_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_orus_conversation_updated_at();