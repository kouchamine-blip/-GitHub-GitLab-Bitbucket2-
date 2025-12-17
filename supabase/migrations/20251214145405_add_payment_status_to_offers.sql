/*
  # Add Payment Status to Offers System

  This migration adds payment tracking capabilities to the offers system.

  1. Changes
    - Add `payment_status` field to `orus_offers` table
      - Values: UNPAID, PAID, REFUNDED
      - Default: UNPAID
    - Add `transaction_id` field to link offers to transactions
    - Add index on payment_status for performance

  2. Important Notes
    - When an offer is ACCEPTED, payment_status remains UNPAID
    - When buyer completes payment, payment_status changes to PAID
    - transaction_id links the offer to the completed transaction
*/

-- Create payment status enum
DO $$ BEGIN
  CREATE TYPE orus_payment_status AS ENUM ('UNPAID', 'PAID', 'REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add payment_status and transaction_id columns to orus_offers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orus_offers' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orus_offers ADD COLUMN payment_status orus_payment_status DEFAULT 'UNPAID' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orus_offers' AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE orus_offers ADD COLUMN transaction_id uuid REFERENCES orus_transactions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for payment status queries
CREATE INDEX IF NOT EXISTS idx_orus_offers_payment_status ON orus_offers(payment_status);
CREATE INDEX IF NOT EXISTS idx_orus_offers_transaction ON orus_offers(transaction_id);