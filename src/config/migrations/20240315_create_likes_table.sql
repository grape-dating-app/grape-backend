-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    liker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_super_like BOOLEAN DEFAULT false,
    UNIQUE(liker_id, liked_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_likes_liker_id ON likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_likes_liked_id ON likes(liked_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at); 