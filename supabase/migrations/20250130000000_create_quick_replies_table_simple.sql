-- Create quick_replies table for WhatsApp chat functionality
CREATE TABLE IF NOT EXISTS quick_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quick_replies_user_id ON quick_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_replies_category ON quick_replies(category);
CREATE INDEX IF NOT EXISTS idx_quick_replies_sort_order ON quick_replies(sort_order);

-- Enable RLS
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own quick replies" ON quick_replies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quick replies" ON quick_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quick replies" ON quick_replies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quick replies" ON quick_replies
  FOR DELETE USING (auth.uid() = user_id);
