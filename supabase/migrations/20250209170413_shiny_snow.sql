/*
  # Add printers table and policies

  1. New Tables
    - `printers`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `location` (text)
      - `ip_address` (text)
      - `vendor` (text)
      - `model` (text)
      - `print_deploy_info` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `printers` table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS printers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  location text NOT NULL,
  ip_address text NOT NULL,
  vendor text NOT NULL,
  model text NOT NULL,
  print_deploy_info text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE printers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON printers
  FOR ALL TO authenticated
  USING (true);