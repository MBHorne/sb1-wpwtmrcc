/*
  # Update RLS policies for clients table

  1. Changes
    - Drop existing RLS policy for clients table
    - Create new RLS policies for CRUD operations
    - Enable RLS on clients table

  2. Security
    - Allow authenticated users to perform all operations on clients table
    - Policies are scoped to authenticated users only
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON clients;

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Allow insert for authenticated users" 
ON clients FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow select for authenticated users" 
ON clients FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow update for authenticated users" 
ON clients FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users" 
ON clients FOR DELETE 
TO authenticated 
USING (true);