/*
  # Add Verified Seller Badge and User Features

  1. Changes
    - Add `is_verified_seller` field to orus_users
    - Create `orus_likes` table for Tarina liked products
    - Create `orus_user_search_history` table for personalized feed
    - Add avatar_url and phone to orus_users for complete profile

  2. Security
    - Enable RLS on new tables
    - Users can manage their own likes and search history
    - Only admins can update verified seller status

  3. New Tables
    - `orus_likes`: Track user product likes (id, user_id, product_id, created_at)
    - `orus_user_search_history`: Track user searches (id, user_id, search_query, category, created_at)
*/

-- Add verified seller badge to orus_users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orus_users' AND column_name = 'is_verified_seller'
  ) THEN
    ALTER TABLE orus_users ADD COLUMN is_verified_seller BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add avatar_url to orus_users if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orus_users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE orus_users ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Add phone to orus_users if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orus_users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE orus_users ADD COLUMN phone TEXT;
  END IF;
END $$;

-- Create orus_likes table
CREATE TABLE IF NOT EXISTS orus_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES orus_users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES orus_products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE orus_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own likes"
  ON orus_likes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own likes"
  ON orus_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON orus_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create orus_user_search_history table
CREATE TABLE IF NOT EXISTS orus_user_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES orus_users(id) ON DELETE CASCADE,
  search_query TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orus_user_search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON orus_user_search_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own search history"
  ON orus_user_search_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history"
  ON orus_user_search_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orus_likes_user_id ON orus_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_orus_likes_product_id ON orus_likes(product_id);
CREATE INDEX IF NOT EXISTS idx_orus_search_history_user_id ON orus_user_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_orus_search_history_created_at ON orus_user_search_history(created_at DESC);
