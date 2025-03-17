/*
  # Add Riders Table and Update Participants

  1. New Tables
    - `riders`
      - `id` (uuid, primary key)
      - `name` (text, required, unique)
      - `created_at` (timestamp)

  2. Changes
    - Update participants table to reference riders
    - Migrate existing participant names to riders table
    - Add initial riders
    - Make rider_id required after data migration

  3. Security
    - Enable RLS on riders table
    - Add policies for reading riders
*/

-- Create riders table
CREATE TABLE IF NOT EXISTS riders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;

-- Create policies for riders
CREATE POLICY "Allow anonymous read access to riders"
  ON riders
  FOR SELECT
  TO anon
  USING (true);

-- Insert initial riders
INSERT INTO riders (name) VALUES
  ('Mari'),
  ('Mark'),
  ('Rick'),
  ('Richard'),
  ('Sven')
ON CONFLICT (name) DO NOTHING;

-- Add rider_id to participants (nullable initially)
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS rider_id uuid REFERENCES riders(id);

-- Insert any missing names into riders table
INSERT INTO riders (name)
SELECT DISTINCT name FROM participants WHERE name IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- Update rider_id for existing participants
UPDATE participants
SET rider_id = riders.id
FROM riders
WHERE participants.name = riders.name
  AND participants.rider_id IS NULL;

-- Now we can safely make rider_id required and remove name
ALTER TABLE participants
ALTER COLUMN rider_id SET NOT NULL;

ALTER TABLE participants
DROP COLUMN name;