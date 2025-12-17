/*
  # Fix Admin Product View Policy
  
  Admins and agents need to see ALL products regardless of status.
  
  1. Changes
    - Add new RLS policy allowing admins and agents to view all products
    - This policy works alongside the existing policy for regular users
  
  2. Security
    - Only users with ADMIN or AGENT role can view all products
    - Regular users can still only see approved products or their own
*/

-- Add policy for admins and agents to view all products
CREATE POLICY "Admins and agents can view all products"
  ON orus_products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_users
      WHERE orus_users.id = auth.uid()
      AND orus_users.role IN ('ADMIN', 'AGENT')
    )
  );