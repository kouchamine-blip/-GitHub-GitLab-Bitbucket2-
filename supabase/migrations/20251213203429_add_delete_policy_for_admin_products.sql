/*
  # Add DELETE policy for admin/agent product management

  1. Changes
    - Add DELETE policy to orus_products table
    - Only admins and agents can delete products
    - This enables removal of non-conforming listings

  2. Security
    - DELETE restricted to authenticated users with ADMIN or AGENT role
    - Regular users cannot delete products
*/

CREATE POLICY "Admins and agents can delete products"
  ON orus_products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM orus_users
      WHERE orus_users.id = auth.uid()
        AND orus_users.role IN ('ADMIN', 'AGENT')
    )
  );
