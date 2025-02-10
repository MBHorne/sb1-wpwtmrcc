/*
  # Fix Atera Settings RLS Policies

  1. Changes
    - Drop existing RLS policies for atera_settings
    - Create new policies that allow proper management of settings
    - Ensure single row constraint for settings table
  
  2. Security
    - Only authenticated users can read settings
    - Only authenticated users can manage settings
    - Maintains single settings row pattern
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON atera_settings;
DROP POLICY IF EXISTS "Allow insert for authenticated admin users" ON atera_settings;
DROP POLICY IF EXISTS "Allow update for authenticated admin users" ON atera_settings;

-- Create new policies
CREATE POLICY "Allow read access for authenticated users"
  ON atera_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert for authenticated users"
  ON atera_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users"
  ON atera_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users"
  ON atera_settings FOR DELETE
  TO authenticated
  USING (true);

-- Add trigger to ensure only one settings row exists
CREATE OR REPLACE FUNCTION check_single_settings_row()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM atera_settings) > 0 AND TG_OP = 'INSERT' THEN
    -- If inserting and row exists, update the existing row instead
    UPDATE atera_settings
    SET 
      api_key = NEW.api_key,
      api_url = NEW.api_url,
      updated_at = now();
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_settings_row ON atera_settings;
CREATE TRIGGER ensure_single_settings_row
  BEFORE INSERT ON atera_settings
  FOR EACH ROW
  EXECUTE FUNCTION check_single_settings_row();