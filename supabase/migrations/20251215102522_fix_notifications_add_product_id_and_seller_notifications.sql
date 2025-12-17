/*
  # Fix Notifications Schema and Add Seller Notifications

  1. Changes
    - Add `product_id` column to notifications table (referenced by existing triggers)
    - Add trigger to notify sellers when their products are sold
    - Add trigger to notify sellers when they receive an offer
    
  2. New Columns
    - `product_id` (uuid, nullable) - Reference to the product related to this notification
    
  3. New Triggers
    - Notify seller when their product is sold
    - Notify seller when they receive an offer on their product
    
  4. Security
    - Column is nullable to support non-product notifications
    - Existing RLS policies remain unchanged
*/

-- Add product_id column to notifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'product_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN product_id uuid REFERENCES orus_products(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_notifications_product_id ON notifications(product_id);
  END IF;
END $$;

-- Function to notify seller when their product is sold
CREATE OR REPLACE FUNCTION notify_seller_product_sold()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if product was just sold (buyer_id changed from null to not null)
  IF OLD.buyer_id IS NULL AND NEW.buyer_id IS NOT NULL THEN
    -- Create notification for the seller
    INSERT INTO notifications (user_id, type, title, message, product_id, data)
    VALUES (
      NEW.seller_id,
      'YOUR_PRODUCT_SOLD',
      'Your Product Sold',
      'Your listing "' || NEW.title || '" has been sold for €' || NEW.price || '!',
      NEW.id,
      jsonb_build_object('product_id', NEW.id, 'price', NEW.price, 'title', NEW.title)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify seller when they receive an offer
CREATE OR REPLACE FUNCTION notify_seller_new_offer()
RETURNS TRIGGER AS $$
DECLARE
  product_record RECORD;
BEGIN
  -- Only notify on new offers (INSERT)
  IF TG_OP = 'INSERT' THEN
    -- Get product details
    SELECT id, title, seller_id INTO product_record
    FROM orus_products
    WHERE id = NEW.product_id;
    
    -- Create notification for the seller
    INSERT INTO notifications (user_id, type, title, message, product_id, data)
    VALUES (
      product_record.seller_id,
      'OFFER_RECEIVED',
      'New Offer Received',
      'You received an offer of €' || NEW.amount || ' for "' || product_record.title || '".',
      NEW.product_id,
      jsonb_build_object('offer_id', NEW.id, 'amount', NEW.amount, 'product_id', NEW.product_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for seller product sold notifications
DROP TRIGGER IF EXISTS trigger_notify_seller_product_sold ON orus_products;
CREATE TRIGGER trigger_notify_seller_product_sold
  AFTER UPDATE ON orus_products
  FOR EACH ROW
  EXECUTE FUNCTION notify_seller_product_sold();

-- Create trigger for new offer notifications
DROP TRIGGER IF EXISTS trigger_notify_seller_new_offer ON orus_offers;
CREATE TRIGGER trigger_notify_seller_new_offer
  AFTER INSERT ON orus_offers
  FOR EACH ROW
  EXECUTE FUNCTION notify_seller_new_offer();
