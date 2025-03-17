/*
  # Update rides table to use rider_id for organizer

  1. Changes
    - Add rider_id column to rides table
    - Create foreign key relationship to riders table
    - Update existing rides to use rider_id instead of organizer name
    - Remove organizer text column
  
  2. Security
    - Maintain existing RLS policies
*/

-- First add the new column (nullable initially)
ALTER TABLE rides
ADD COLUMN rider_id uuid REFERENCES riders(id);

-- Update existing rides to use rider_id
UPDATE rides
SET rider_id = riders.id
FROM riders
WHERE rides.organizer = riders.name;

-- Make rider_id required
ALTER TABLE rides
ALTER COLUMN rider_id SET NOT NULL;

-- Remove the old organizer column
ALTER TABLE rides
DROP COLUMN organizer;

-- Add the organizer automatically as a participant
CREATE OR REPLACE FUNCTION add_organizer_as_participant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO participants (ride_id, rider_id)
  VALUES (NEW.id, NEW.rider_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_organizer_participant
AFTER INSERT ON rides
FOR EACH ROW
EXECUTE FUNCTION add_organizer_as_participant();