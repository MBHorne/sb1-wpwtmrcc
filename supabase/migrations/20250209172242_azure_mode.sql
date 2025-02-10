/*
  # Add expected_date and status to inbound_packages

  1. Changes
    - Add expected_date column to inbound_packages
    - Add status column to inbound_packages with check constraint
    - Make expected_date required
    - Add default value for status

  2. Security
    - No changes to RLS policies needed
*/

ALTER TABLE inbound_packages 
  ADD COLUMN expected_date date NOT NULL,
  ADD COLUMN status text CHECK (status IN ('OK', 'WARNING', 'CRITICAL')) DEFAULT 'OK';