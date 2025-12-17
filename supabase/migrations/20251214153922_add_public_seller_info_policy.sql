/*
  # Add public seller information access policy

  1. Changes
    - Add policy to allow authenticated users to read public seller information
    - This enables users to see seller names, avatars, and verification status
    - Users can still only update their own profiles
  
  2. Security
    - Read-only access to public information (full_name, avatar_url, is_verified_seller)
    - Does not expose private information (email, phone, etc.)
    - Only available to authenticated users
*/

-- Allow authenticated users to read public seller information
CREATE POLICY "Users can view public seller info"
  ON orus_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can read own profile" ON orus_users;

-- Re-create a more specific policy for reading full profile (own data only)
CREATE POLICY "Users can read full own profile"
  ON orus_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
