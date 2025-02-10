/*
  # Create profiles table for user management

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `email` (text)
      - `role` (text)
      - `created_at` (timestamptz)
      - `last_sign_in_at` (timestamptz)

  2. Security
    - Enable RLS on `profiles` table
    - Add policy for authenticated users to read all profiles
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON profiles;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  last_sign_in_at timestamptz
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create new policy
CREATE POLICY "Allow read access for authenticated users"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (new.id, new.email, new.created_at);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();