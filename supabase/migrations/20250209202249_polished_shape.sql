/*
  # Fix profiles table and policies

  1. Changes
    - Drop existing policies if they exist
    - Recreate profiles table if it doesn't exist
    - Add new policies for profile management
    - Update trigger function for user creation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow read access for all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;

-- Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  last_sign_in_at timestamptz
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Allow read access for all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add index on email for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Update function to include role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at)
  VALUES (
    new.id,
    new.email,
    CASE 
      WHEN new.email LIKE '%admin%' THEN 'admin'
      ELSE 'user'
    END,
    new.created_at
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();