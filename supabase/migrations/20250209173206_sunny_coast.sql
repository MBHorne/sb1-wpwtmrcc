/*
  # Add serial number to inbound packages

  1. Changes
    - Add serial_number column to track device serial numbers
*/

ALTER TABLE inbound_packages 
  ADD COLUMN serial_number text;