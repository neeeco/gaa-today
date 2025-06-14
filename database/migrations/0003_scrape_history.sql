-- Create scrape_history table
CREATE TABLE IF NOT EXISTS scrape_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    last_scrape_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies
ALTER TABLE scrape_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to scrape_history"
    ON scrape_history FOR SELECT
    TO public
    USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert scrape_history"
    ON scrape_history FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON scrape_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 