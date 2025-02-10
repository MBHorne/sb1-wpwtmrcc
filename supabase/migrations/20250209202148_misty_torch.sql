/*
  # Add user management policies

  1. Security
    - Add policies for profiles table to allow authenticated users to:
      - Read all profiles
      - Update their own profile
      - No delete or insert (handled by triggers)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON profiles;

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