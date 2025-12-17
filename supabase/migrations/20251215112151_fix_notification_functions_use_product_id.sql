/*
  # Fix Notification Functions to Use Correct Column Name

  1. Problem
    - Functions use 'related_product_id' column
    - But the notifications table has 'product_id' column (not 'related_product_id')
    
  2. Solution
    - Update notify_product_sold() to use 'product_id'
    - Update notify_price_change() to use 'product_id'
    
  3. Affected Functions
    - notify_product_sold
    - notify_price_change
*/

-- Fix notify_product_sold to use product_id instead of related_product_id
CREATE OR REPLACE FUNCTION notify_product_sold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.buyer_id IS NOT NULL AND (OLD.buyer_id IS NULL OR OLD.buyer_id != NEW.buyer_id) THEN
    INSERT INTO notifications (user_id, type, title, message, product_id)
    VALUES (
      NEW.seller_id,
      'PRODUCT_SOLD',
      'Product Sold',
      'Your product "' || NEW.title || '" has been sold!',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Fix notify_price_change to use product_id instead of related_product_id
CREATE OR REPLACE FUNCTION notify_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.price != OLD.price THEN
    INSERT INTO notifications (user_id, type, title, message, product_id)
    SELECT 
      orus_likes.user_id,
      'PRICE_CHANGE',
      'Price Update',
      'The price of "' || NEW.title || '" changed from ' || OLD.price || '€ to ' || NEW.price || '€',
      NEW.id
    FROM orus_likes
    WHERE orus_likes.product_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;