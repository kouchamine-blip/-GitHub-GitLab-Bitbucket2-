/*
  # Fix is_admin() Function Search Path

  1. Security Enhancement
    - Add explicit `SET search_path = public` to is_admin() function (no parameters version)
    - Prevents potential SQL injection via search_path manipulation
    - Ensures function always uses the correct schema
  
  2. Function Updated
    - is_admin() - parameterless version
  
  3. Note
    - Function logic remains unchanged
    - Only security hardening applied
    - The version with user_id parameter already has search_path set
*/

-- Fix is_admin() function (no parameters)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM orus_users 
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;