/*
  # Add image_url column to orus_products table

  1. Changes
    - Add `image_url` column (text, nullable) to `orus_products` table
    - This column will store the primary image URL for each product
    - The existing `images` JSONB column can still be used for multiple images

  2. Notes
    - Column is nullable to support existing records
    - New products can use this field for quick single-image display
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orus_products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE orus_products ADD COLUMN image_url text;
  END IF;
END $$;