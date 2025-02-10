/*
  # Add address and notes fields to clients table

  1. Changes
    - Add address column to clients table
    - Add notes column to clients table for rich text content
*/

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS notes text;