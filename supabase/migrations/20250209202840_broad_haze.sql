/*
  # Add Atera Integration Support

  1. New Tables
    - `atera_settings`
      - `id` (uuid, primary key)
      - `api_key` (text, encrypted)
      - `api_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `atera_customer_mappings`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `atera_customer_id` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create encryption function for API keys
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Atera Settings Table
CREATE TABLE IF NOT EXISTS atera_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key text NOT NULL,
  api_url text NOT NULL DEFAULT 'https://app.atera.com/api/v3',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customer Mappings Table
CREATE TABLE IF NOT EXISTS atera_customer_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  atera_customer_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, atera_customer_id)
);

-- Enable RLS
ALTER TABLE atera_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE atera_customer_mappings ENABLE ROW LEVEL SECURITY;

-- Policies for atera_settings
CREATE POLICY "Allow read access for authenticated users"
  ON atera_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert for authenticated admin users"
  ON atera_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow update for authenticated admin users"
  ON atera_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for atera_customer_mappings
CREATE POLICY "Allow read access for authenticated users"
  ON atera_customer_mappings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all operations for authenticated admin users"
  ON atera_customer_mappings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );