/*
  # Create ORUS Subscriptions Tracking System
  
  This migration creates a subscription tracking system to monitor all Tarina app user registrations.
  
  1. New Tables
    - `orus_subscriptions`
      - `id` (uuid, primary key)
      - `serial_number` (bigint, auto-incrementing) - Sequential user number
      - `user_id` (uuid, references orus_users) - Links to user account
      - `email` (text) - User email
      - `full_name` (text) - User full name
      - `subscription_date` (date) - Date of subscription
      - `subscription_time` (time) - Time of subscription
      - `platform` (text) - Platform source (TARINA, WEB, etc.)
      - `created_at` (timestamptz) - Full timestamp for precise tracking
  
  2. Indexes
    - Index on serial_number for quick lookups
    - Index on user_id for user-specific queries
    - Index on subscription_date for date-based filtering
    - Index on platform for filtering by source
  
  3. Security
    - Enable RLS on orus_subscriptions table
    - Only authenticated admin users can view subscriptions
    - System can insert subscription records
    
  4. Important Notes
    - Serial numbers are auto-incremented for each new subscription
    - Each user registration creates a subscription record
    - Records are immutable after creation (no updates)
    - Provides complete audit trail of user registrations
*/

-- Create orus_subscriptions table
CREATE TABLE IF NOT EXISTS orus_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number bigserial UNIQUE NOT NULL,
  user_id uuid REFERENCES orus_users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  subscription_date date DEFAULT CURRENT_DATE NOT NULL,
  subscription_time time DEFAULT CURRENT_TIME NOT NULL,
  platform text DEFAULT 'TARINA' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orus_subscriptions_serial ON orus_subscriptions(serial_number);
CREATE INDEX IF NOT EXISTS idx_orus_subscriptions_user ON orus_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_orus_subscriptions_date ON orus_subscriptions(subscription_date);
CREATE INDEX IF NOT EXISTS idx_orus_subscriptions_platform ON orus_subscriptions(platform);

-- Enable RLS
ALTER TABLE orus_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orus_subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON orus_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_users
      WHERE orus_users.id = auth.uid()
      AND orus_users.role = 'ADMIN'
    )
  );

CREATE POLICY "System can create subscriptions"
  ON orus_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to automatically create subscription record when user is created
CREATE OR REPLACE FUNCTION create_subscription_on_user_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO orus_subscriptions (
    user_id,
    email,
    full_name,
    platform
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.full_name,
    'TARINA'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create subscription record
DROP TRIGGER IF EXISTS trigger_create_subscription ON orus_users;
CREATE TRIGGER trigger_create_subscription
  AFTER INSERT ON orus_users
  FOR EACH ROW
  EXECUTE FUNCTION create_subscription_on_user_insert();