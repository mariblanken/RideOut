/*
  # Fix delete cascade functionality

  1. Changes
    - Add ON DELETE CASCADE to participants table foreign key
    - Add RLS policies for delete operations
  
  2. Security
    - Enable RLS on both tables
    - Add policies for delete operations
*/

-- Enable RLS
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Add delete policies
CREATE POLICY "Allow anonymous delete access to rides"
ON rides FOR DELETE
TO anon
USING (true);

CREATE POLICY "Allow anonymous delete access to participants"
ON participants FOR DELETE
TO anon
USING (true);

-- Ensure cascade delete is set up correctly
ALTER TABLE participants
DROP CONSTRAINT IF EXISTS participants_ride_id_fkey,
ADD CONSTRAINT participants_ride_id_fkey
  FOREIGN KEY (ride_id)
  REFERENCES rides(id)
  ON DELETE CASCADE;