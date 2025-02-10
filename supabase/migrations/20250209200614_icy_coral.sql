/*
  # Create assets table

  1. New Tables
    - `assets`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `name` (text)
      - `type` (text)
      - `model` (text)
      - `serial_number` (text)
      - `purchase_date` (date)
      - `warranty_expiry` (date)
      - `location` (text)
      - `status` (text)
      - `assigned_to` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `assets` table
    - Add policy for authenticated users to perform all operations
*/

CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  model text NOT NULL,
  serial_number text NOT NULL,
  purchase_date date,
  warranty_expiry date,
  location text NOT NULL,
  status text NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED')),
  assigned_to text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON assets
  FOR ALL TO authenticated
  USING (true);