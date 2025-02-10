/*
  # Create applications table

  1. New Tables
    - `applications`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `name` (text)
      - `vendor` (text)
      - `version` (text)
      - `license_type` (text)
      - `expiry_date` (date, nullable)
      - `installation_path` (text)
      - `notes` (text, nullable)
      - `support_url` (text, nullable)
      - `critical` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `applications` table
    - Add policy for authenticated users to perform all operations
*/

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  vendor text NOT NULL,
  version text NOT NULL,
  license_type text NOT NULL,
  expiry_date date,
  installation_path text NOT NULL,
  notes text,
  support_url text,
  critical boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON applications
  FOR ALL TO authenticated
  USING (true);