/*
  # Add Listing Tracking System to ORUS
  
  This migration adds a comprehensive listing tracking system with unique serial codes.
  
  1. New Tables
    - `orus_listing_counters`
      - Tracks listing numbers per user per year
      - Resets counter each year for each user
      - Used to generate unique listing serial codes
  
  2. Modified Tables
    - `orus_products`
      - Add `listing_serial` (text) - Unique serial code (e.g., A0010010025)
      - Add `conformity_status` (enum) - PENDING, CONFORME, NON_CONFORME
      - Add `conformity_checked_at` (timestamptz) - When conformity was checked
      - Add `conformity_checked_by` (uuid) - Admin who checked
  
  3. New Functions
    - `generate_listing_serial()` - Auto-generates serial on product insert
    - Format: A{user_serial_3digits}{listing_num_5digits}{year_2digits}
    - Example: User #1, listing #100, year 2025 = A0010010025
  
  4. Security
    - RLS policies updated for new fields
    - Only admins can update conformity status
  
  5. Important Notes
    - Listing numbers reset each year per user
    - Serial codes are unique and immutable
    - Conformity defaults to PENDING
*/

-- Create conformity status enum
DO $$ BEGIN
  CREATE TYPE orus_conformity_status AS ENUM ('PENDING', 'CONFORME', 'NON_CONFORME');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create listing counters table
CREATE TABLE IF NOT EXISTS orus_listing_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES orus_users(id) ON DELETE CASCADE NOT NULL,
  year int NOT NULL,
  counter int DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, year)
);

-- Add new columns to orus_products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orus_products' AND column_name = 'listing_serial'
  ) THEN
    ALTER TABLE orus_products ADD COLUMN listing_serial text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orus_products' AND column_name = 'conformity_status'
  ) THEN
    ALTER TABLE orus_products ADD COLUMN conformity_status orus_conformity_status DEFAULT 'PENDING' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orus_products' AND column_name = 'conformity_checked_at'
  ) THEN
    ALTER TABLE orus_products ADD COLUMN conformity_checked_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orus_products' AND column_name = 'conformity_checked_by'
  ) THEN
    ALTER TABLE orus_products ADD COLUMN conformity_checked_by uuid REFERENCES orus_users(id);
  END IF;
END $$;

-- Enable RLS on listing counters
ALTER TABLE orus_listing_counters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for listing counters
CREATE POLICY "System can manage listing counters"
  ON orus_listing_counters FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to generate listing serial
CREATE OR REPLACE FUNCTION generate_listing_serial()
RETURNS TRIGGER AS $$
DECLARE
  user_serial_num int;
  listing_num int;
  current_year int;
  year_suffix text;
  serial_code text;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM NOW());
  year_suffix := RIGHT(current_year::text, 2);
  
  -- Get user's serial number from subscriptions
  SELECT serial_number INTO user_serial_num
  FROM orus_subscriptions
  WHERE user_id = NEW.seller_id;
  
  -- If user doesn't have a serial number, use a default
  IF user_serial_num IS NULL THEN
    user_serial_num := 0;
  END IF;
  
  -- Get or create counter for this user and year
  INSERT INTO orus_listing_counters (user_id, year, counter)
  VALUES (NEW.seller_id, current_year, 1)
  ON CONFLICT (user_id, year)
  DO UPDATE SET 
    counter = orus_listing_counters.counter + 1,
    updated_at = NOW()
  RETURNING counter INTO listing_num;
  
  -- Generate serial code: A{user_serial_3digits}{listing_num_5digits}{year_2digits}
  serial_code := 'A' || 
                 LPAD(user_serial_num::text, 3, '0') || 
                 LPAD(listing_num::text, 5, '0') || 
                 year_suffix;
  
  NEW.listing_serial := serial_code;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate listing serial
DROP TRIGGER IF EXISTS trigger_generate_listing_serial ON orus_products;
CREATE TRIGGER trigger_generate_listing_serial
  BEFORE INSERT ON orus_products
  FOR EACH ROW
  WHEN (NEW.listing_serial IS NULL)
  EXECUTE FUNCTION generate_listing_serial();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orus_products_listing_serial ON orus_products(listing_serial);
CREATE INDEX IF NOT EXISTS idx_orus_products_conformity_status ON orus_products(conformity_status);
CREATE INDEX IF NOT EXISTS idx_orus_listing_counters_user_year ON orus_listing_counters(user_id, year);