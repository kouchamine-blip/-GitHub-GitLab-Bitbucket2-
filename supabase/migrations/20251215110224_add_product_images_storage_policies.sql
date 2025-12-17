/*
  # Configure Storage Bucket for Product Images

  1. Storage Configuration
    - Create `product-images` bucket if not exists
    - Make bucket public for read access
    
  2. Security Policies
    - Allow authenticated users to upload their own images
    - Allow public read access to all images
    - Allow users to update/delete their own images
*/

-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow public read access to all images
CREATE POLICY "Public read access for product images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Policy: Allow users to update their own images
CREATE POLICY "Users can update own product images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow users to delete their own images
CREATE POLICY "Users can delete own product images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );