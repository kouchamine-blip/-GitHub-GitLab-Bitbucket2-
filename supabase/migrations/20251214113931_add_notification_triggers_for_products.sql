/*
  # Add Notification Triggers for Product Events

  1. Changes
    - Create trigger function to notify users who liked a product when it's sold
    - Create trigger function to notify users who liked a product when price changes
    - Both triggers automatically create notifications in orus_notifications table

  2. Trigger Events
    - Product sold: When buyer_id changes from null to a value
    - Price changed: When price is updated to a different value

  3. Security
    - Functions run with security definer privileges
    - Only affects orus_notifications table (already secured with RLS)
*/

-- Function to notify users when a product is sold
CREATE OR REPLACE FUNCTION notify_product_sold()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if product was just sold (buyer_id changed from null to not null)
  IF OLD.buyer_id IS NULL AND NEW.buyer_id IS NOT NULL THEN
    -- Create notifications for all users who liked this product
    INSERT INTO orus_notifications (user_id, type, title, message, product_id)
    SELECT 
      user_id,
      'PRODUCT_SOLD',
      'Product Sold',
      'A product you liked "' || NEW.title || '" has been sold.',
      NEW.id
    FROM orus_likes
    WHERE product_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify users when product price changes
CREATE OR REPLACE FUNCTION notify_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if price has changed
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    -- Create notifications for all users who liked this product
    INSERT INTO orus_notifications (user_id, type, title, message, product_id)
    SELECT 
      user_id,
      'PRICE_CHANGE',
      'Price Updated',
      'The price of "' || NEW.title || '" changed from €' || OLD.price || ' to €' || NEW.price || '.',
      NEW.id
    FROM orus_likes
    WHERE product_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for product sold notifications
DROP TRIGGER IF EXISTS trigger_notify_product_sold ON orus_products;
CREATE TRIGGER trigger_notify_product_sold
  AFTER UPDATE ON orus_products
  FOR EACH ROW
  EXECUTE FUNCTION notify_product_sold();

-- Create trigger for price change notifications
DROP TRIGGER IF EXISTS trigger_notify_price_change ON orus_products;
CREATE TRIGGER trigger_notify_price_change
  AFTER UPDATE ON orus_products
  FOR EACH ROW
  EXECUTE FUNCTION notify_price_change();
