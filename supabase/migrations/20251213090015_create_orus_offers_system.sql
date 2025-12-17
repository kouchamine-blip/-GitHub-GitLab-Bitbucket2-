/*
  # Create ORUS Offers System
  
  This migration creates an offer management system for negotiating prices between buyers and sellers.
  
  1. New Tables
    - `orus_offers`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references orus_conversations) - Links offer to conversation
      - `product_id` (uuid, references orus_products) - Links offer to product
      - `sender_id` (uuid, references orus_users) - User who made the offer
      - `receiver_id` (uuid, references orus_users) - User who receives the offer
      - `amount` (numeric) - Offered price
      - `status` (enum) - PENDING, ACCEPTED, DECLINED, COUNTERED
      - `message_id` (uuid, references orus_messages) - Links to the message
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on orus_offers table
    - Users can view offers in their conversations
    - Users can create offers as senders
    - Users can update offers they receive (to accept/decline)
    
  3. Important Notes
    - Each offer is tied to a specific conversation and product
    - Offers track the sender and receiver for proper permissions
    - Status tracking allows for workflow management
    - When an offer is countered, a new offer is created
*/

-- Create offer status enum
DO $$ BEGIN
  CREATE TYPE orus_offer_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'COUNTERED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create orus_offers table
CREATE TABLE IF NOT EXISTS orus_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES orus_conversations(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES orus_products(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES orus_users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES orus_users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status orus_offer_status DEFAULT 'PENDING' NOT NULL,
  message_id uuid REFERENCES orus_messages(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orus_offers_conversation ON orus_offers(conversation_id);
CREATE INDEX IF NOT EXISTS idx_orus_offers_product ON orus_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_orus_offers_sender ON orus_offers(sender_id);
CREATE INDEX IF NOT EXISTS idx_orus_offers_receiver ON orus_offers(receiver_id);
CREATE INDEX IF NOT EXISTS idx_orus_offers_status ON orus_offers(status);

-- Enable RLS
ALTER TABLE orus_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orus_offers
CREATE POLICY "Users can view offers in their conversations"
  ON orus_offers FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can create offers as senders"
  ON orus_offers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update offers"
  ON orus_offers FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Function to update offer updated_at timestamp
CREATE OR REPLACE FUNCTION update_orus_offer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update offer timestamp
DROP TRIGGER IF EXISTS update_offer_timestamp ON orus_offers;
CREATE TRIGGER update_offer_timestamp
  BEFORE UPDATE ON orus_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_orus_offer_updated_at();