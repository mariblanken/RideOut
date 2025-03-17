/*
  # Create Rides and Participants Tables

  1. New Tables
    - `rides`
      - `id` (uuid, primary key)
      - `date` (date, required)
      - `time` (time, required)
      - `start_location` (text, required)
      - `distance` (numeric, required)
      - `expected_speed` (numeric, optional)
      - `route_description` (text, optional)
      - `created_at` (timestamp)
    
    - `participants`
      - `id` (uuid, primary key)
      - `ride_id` (uuid, foreign key to rides)
      - `name` (text, required)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Allow anonymous access for reading and creating rides/participants
*/

-- Create rides table
CREATE TABLE IF NOT EXISTS rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time time NOT NULL,
  start_location text NOT NULL,
  distance numeric NOT NULL,
  expected_speed numeric,
  route_description text,
  created_at timestamptz DEFAULT now()
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Create policies for rides
CREATE POLICY "Allow anonymous read access to rides"
  ON rides
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert access to rides"
  ON rides
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policies for participants
CREATE POLICY "Allow anonymous read access to participants"
  ON participants
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert access to participants"
  ON participants
  FOR INSERT
  TO anon
  WITH CHECK (true);