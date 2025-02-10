/*
  # Initial Schema for MSP Documentation Manager

  1. New Tables
    - `clients`
      - Basic client information
    - `networks`
      - Network documentation for clients
    - `subnets`
      - Subnet information for networks
    - `inbound_packages`
      - Track inbound hardware/packages
    - `printers`
      - Printer documentation
    - `assets`
      - Client assets tracking
    - `applications`
      - Client applications
    - `m365`
      - Microsoft 365 documentation
    - `billing`
      - Billing information

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Networks table
CREATE TABLE IF NOT EXISTS networks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  network_type text NOT NULL CHECK (network_type IN ('LAN', 'WAN')),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subnets table
CREATE TABLE IF NOT EXISTS subnets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id uuid REFERENCES networks(id) ON DELETE CASCADE,
  subnet_address text NOT NULL,
  gateway text,
  dns text[],
  dhcp_range text,
  vlan int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inbound packages table
CREATE TABLE IF NOT EXISTS inbound_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  package_type text NOT NULL,
  received_by text NOT NULL,
  atera_ticket_id text,
  received_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subnets ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all operations for authenticated users" ON clients
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON networks
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON subnets
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON inbound_packages
  FOR ALL TO authenticated
  USING (true);