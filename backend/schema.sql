-- Create matches table
CREATE TABLE matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    competition TEXT NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT,
    venue TEXT,
    home_score TEXT,
    away_score TEXT,
    is_fixture BOOLEAN NOT NULL DEFAULT true,
    broadcast TEXT,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on date for faster sorting
CREATE INDEX idx_matches_date ON matches(date);

-- Create index on is_fixture for faster filtering
CREATE INDEX idx_matches_is_fixture ON matches(is_fixture);

-- Create index on competition for faster filtering
CREATE INDEX idx_matches_competition ON matches(competition);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access"
    ON matches
    FOR SELECT
    USING (true);

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert"
    ON matches
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create policy to allow authenticated users to update
CREATE POLICY "Allow authenticated users to update"
    ON matches
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policy to allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete"
    ON matches
    FOR DELETE
    TO authenticated
    USING (true); 