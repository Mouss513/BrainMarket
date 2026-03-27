-- ============================================================
-- Table: meta_data
-- Stores synced Meta Ads metrics per user
-- ============================================================

CREATE TABLE IF NOT EXISTS meta_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id TEXT,
  account_name TEXT,
  campaigns JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_spend NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_impressions BIGINT NOT NULL DEFAULT 0,
  total_clicks BIGINT NOT NULL DEFAULT 0,
  avg_ctr NUMERIC(6, 2) NOT NULL DEFAULT 0,
  avg_cpm NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_reach BIGINT NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE meta_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read meta_data" ON meta_data FOR SELECT USING (true);
CREATE POLICY "Service insert meta_data" ON meta_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update meta_data" ON meta_data FOR UPDATE USING (true);

GRANT SELECT, INSERT, UPDATE ON meta_data TO anon;
GRANT SELECT, INSERT, UPDATE ON meta_data TO authenticated;
