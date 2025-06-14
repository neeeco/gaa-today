-- Create live_updates table
CREATE TABLE live_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID REFERENCES matches(id),
    minute INTEGER NOT NULL,
    home_score TEXT NOT NULL,
    away_score TEXT NOT NULL,
    update_text TEXT NOT NULL,
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE live_updates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON live_updates
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON live_updates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create index for faster queries
CREATE INDEX idx_live_updates_match_id ON live_updates(match_id);
CREATE INDEX idx_live_updates_created_at ON live_updates(created_at); 