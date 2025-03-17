/*
  # Add organizer field to rides table

  1. Changes
    - Add `organizer` column to `rides` table
    - Make it required (NOT NULL)
    - Add it to existing rides with a default value 'Unknown'

  2. Security
    - No changes to RLS policies needed as we're using the existing ones
*/

ALTER TABLE rides 
ADD COLUMN organizer text NOT NULL DEFAULT 'Unknown';

-- Remove the default constraint after adding the column
ALTER TABLE rides 
ALTER COLUMN organizer DROP DEFAULT;