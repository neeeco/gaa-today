-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    competition TEXT NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_score TEXT,
    away_score TEXT,
    venue TEXT,
    referee TEXT,
    match_date DATE NOT NULL,
    match_time TIME,
    is_fixture BOOLEAN NOT NULL DEFAULT true,
    broadcasting TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to matches"
    ON matches FOR SELECT
    TO public
    USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY "Allow authenticated users to insert matches"
    ON matches FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update matches"
    ON matches FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create unique constraint for match identification
CREATE UNIQUE INDEX IF NOT EXISTS matches_unique_match
    ON matches (home_team, away_team, match_date); 