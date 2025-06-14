-- Create example table
CREATE TABLE example_table (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active'::text
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_example_table_updated_at
    BEFORE UPDATE ON example_table
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE example_table ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users to read example_table"
    ON example_table
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy for authenticated users to insert
CREATE POLICY "Allow authenticated users to insert into example_table"
    ON example_table
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create policy for authenticated users to update their own rows
CREATE POLICY "Allow authenticated users to update their own rows"
    ON example_table
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true); 