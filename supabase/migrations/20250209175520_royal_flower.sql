/*
  # Add activity logging

  1. New Tables
    - `activity_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `action_type` (text) - e.g., 'CREATE', 'UPDATE', 'DELETE'
      - `resource_type` (text) - e.g., 'CLIENT', 'INBOUND_PACKAGE'
      - `resource_id` (uuid)
      - `details` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `activity_logs` table
    - Add policy for authenticated users to read logs
    - Add policy for authenticated users to create logs
*/

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  details text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert for authenticated users" 
ON activity_logs FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow select for authenticated users" 
ON activity_logs FOR SELECT 
TO authenticated 
USING (true);