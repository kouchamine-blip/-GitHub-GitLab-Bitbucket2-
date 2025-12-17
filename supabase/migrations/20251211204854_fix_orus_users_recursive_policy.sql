/*
  # Fix Infinite Recursion in orus_users RLS Policies

  ## Problem
  The "Admins can read all users" policy creates infinite recursion because it queries 
  orus_users table to check if the user is an admin, which triggers the same policy again.

  ## Solution
  1. Drop the recursive "Admins can read all users" policy
  2. Create a secure function to check admin role that bypasses RLS
  3. Create a new non-recursive admin policy using the secure function

  ## Changes
  - Dropped: "Admins can read all users" policy (recursive)
  - Added: secure function `is_admin()` with SECURITY DEFINER
  - Added: new "Admins can read all users" policy (non-recursive)
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can read all users" ON orus_users;

-- Create a secure function to check if current user is admin
-- SECURITY DEFINER bypasses RLS, preventing recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM orus_users 
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

-- Create new admin policy using the secure function (no recursion)
CREATE POLICY "Admins can read all users"
  ON orus_users FOR SELECT
  TO authenticated
  USING (is_admin());

-- Also update the audit logs policy to use the same function
DROP POLICY IF EXISTS "Admins can view all logs" ON orus_audit_logs;

CREATE POLICY "Admins can view all logs"
  ON orus_audit_logs FOR SELECT
  TO authenticated
  USING (is_admin());