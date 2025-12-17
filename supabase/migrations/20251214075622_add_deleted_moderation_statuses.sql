/*
  # Add Deleted Product Statuses

  1. Changes
    - Add `BANNED_BY_SELLER` and `BANNED_BY_MODERATOR` statuses to moderation enum
    - These statuses indicate products removed by seller or moderator
    - Products with these statuses are hidden from Tarina feed

  2. Security
    - No RLS changes needed
    - Existing policies cover new statuses
*/

-- Add new values to the moderation status enum
ALTER TYPE orus_moderation_status ADD VALUE IF NOT EXISTS 'BANNED_BY_SELLER';
ALTER TYPE orus_moderation_status ADD VALUE IF NOT EXISTS 'BANNED_BY_MODERATOR';
