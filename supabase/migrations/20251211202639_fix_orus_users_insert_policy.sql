/*
  # Fix RLS Insert Policy for User Creation
  
  ## Changes
  Adds INSERT policy to allow new users to create their own profile record during signup.
  
  ## Security
  - Users can only insert their own record (auth.uid() = id)
  - Maintains security while enabling signup flow
*/

-- Drop and recreate insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON orus_users;

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON orus_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
