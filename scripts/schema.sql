-- Poll App Database Schema
-- This file contains the table definitions for the Supabase database

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the polls table
CREATE TABLE IF NOT EXISTS polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    votes INTEGER DEFAULT 0,
    timestamp BIGINT NOT NULL,
    answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the votes table to track user votes
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polls_votes ON polls(votes DESC);
CREATE INDEX IF NOT EXISTS idx_polls_timestamp ON polls(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll_user ON votes(poll_id, user_id);

-- Create a unique constraint to prevent duplicate votes
ALTER TABLE votes ADD CONSTRAINT unique_user_poll_vote UNIQUE (poll_id, user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a public poll app)
-- Allow everyone to read polls
CREATE POLICY "Anyone can view polls" ON polls
    FOR SELECT USING (true);

-- Allow everyone to insert new polls
CREATE POLICY "Anyone can create polls" ON polls
    FOR INSERT WITH CHECK (true);

-- Allow everyone to update poll votes and answers
CREATE POLICY "Anyone can update polls" ON polls
    FOR UPDATE USING (true);

-- Allow everyone to delete polls (for admin functionality)
CREATE POLICY "Anyone can delete polls" ON polls
    FOR DELETE USING (true);

-- Allow everyone to read votes
CREATE POLICY "Anyone can view votes" ON votes
    FOR SELECT USING (true);

-- Allow everyone to insert votes
CREATE POLICY "Anyone can create votes" ON votes
    FOR INSERT WITH CHECK (true);

-- Allow everyone to delete votes (for admin functionality)
CREATE POLICY "Anyone can delete votes" ON votes
    FOR DELETE USING (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_polls_updated_at 
    BEFORE UPDATE ON polls 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional - uncomment to add initial data)
/*
INSERT INTO polls (question, votes, timestamp, answer) VALUES
('What feature would you like to see next in our app?', 5, EXTRACT(EPOCH FROM NOW() - INTERVAL '1 day') * 1000, NULL),
('How often do you use our application?', 3, EXTRACT(EPOCH FROM NOW() - INTERVAL '2 days') * 1000, 'Thanks for your feedback! Most users are using the app 2-3 times per week.'),
('Would you recommend this app to a friend?', 8, EXTRACT(EPOCH FROM NOW() - INTERVAL '3 days') * 1000, NULL);
*/
