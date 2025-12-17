/*
  # Fix Admin Product Update Policy - Add WITH CHECK
  
  1. Problem
    - The "Admins and agents can update all products" policy only has USING clause
    - Missing explicit WITH CHECK clause could cause updates to fail
    - Failed updates might cause frontend state issues leading to logout
    
  2. Solution
    - Add explicit WITH CHECK to allow admins/agents to update any product values
    - This ensures admins can modify all fields without restrictions
    
  3. Security
    - Only ADMIN and AGENT roles can perform unrestricted updates
    - Regular users can still only update their own products
*/

-- Fix admin product update policy with explicit WITH CHECK
DROP POLICY IF EXISTS "Admins and agents can update all products" ON orus_products;
CREATE POLICY "Admins and agents can update all products"
  ON orus_products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orus_users
      WHERE orus_users.id = auth.uid()
      AND orus_users.role IN ('ADMIN', 'AGENT')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orus_users
      WHERE orus_users.id = auth.uid()
      AND orus_users.role IN ('ADMIN', 'AGENT')
    )
  );