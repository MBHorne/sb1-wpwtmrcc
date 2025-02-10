/*
  # Add completion tracking to inbound packages

  1. Changes
    - Add completed column to track completion status
    - Add completed_at timestamp to record completion date
    - Add completed_by to track who marked it complete

  2. Security
    - No changes to RLS policies needed
*/

ALTER TABLE inbound_packages 
  ADD COLUMN completed boolean DEFAULT false,
  ADD COLUMN completed_at timestamptz,
  ADD COLUMN completed_by text;