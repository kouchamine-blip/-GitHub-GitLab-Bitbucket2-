/*
  # Fix Escrow Release Trigger Attachment

  1. Problem
    - The escrow_release_trigger is attached to orus_products table
    - But the function release_escrow_funds() references fields that only exist in orus_transactions
    - This causes error: "record 'new' has no field 'status'"
    
  2. Solution
    - Drop the trigger from orus_products
    - Recreate it on orus_transactions where it belongs
    - Fix the function to use correct column names from orus_transactions table
    
  3. Changes
    - Remove trigger from orus_products
    - Update function with correct column names (funds_released, montant_vendeur_net)
    - Add trigger to orus_transactions
*/

-- Drop the incorrectly attached trigger
DROP TRIGGER IF EXISTS escrow_release_trigger ON orus_products;

-- Fix the function to use correct column names from orus_transactions
CREATE OR REPLACE FUNCTION release_escrow_funds()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' AND NOT NEW.funds_released THEN
    UPDATE orus_users
    SET wallet_balance = wallet_balance + NEW.montant_vendeur_net
    WHERE id = NEW.seller_id;

    INSERT INTO orus_wallet_transactions (
      user_id,
      transaction_type,
      amount,
      description,
      related_transaction_id
    ) VALUES (
      NEW.seller_id,
      'CREDIT',
      NEW.montant_vendeur_net,
      'Payment received for product sale',
      NEW.id
    );

    NEW.funds_released := true;
    NEW.released_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on the correct table (orus_transactions)
CREATE TRIGGER escrow_release_trigger
  AFTER UPDATE ON orus_transactions
  FOR EACH ROW
  EXECUTE FUNCTION release_escrow_funds();