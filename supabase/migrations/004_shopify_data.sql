-- ============================================================
-- Table: shopify_data
-- Stores synced Shopify metrics per user
-- ============================================================

CREATE TABLE IF NOT EXISTS shopify_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  revenue_30d NUMERIC(12, 2) NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  average_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  top_products JSONB NOT NULL DEFAULT '[]'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Allow public read for dev (same pattern as other tables)
ALTER TABLE shopify_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shopify_data" ON shopify_data FOR SELECT USING (true);
CREATE POLICY "Service insert shopify_data" ON shopify_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update shopify_data" ON shopify_data FOR UPDATE USING (true);

GRANT SELECT, INSERT, UPDATE ON shopify_data TO anon;
GRANT SELECT, INSERT, UPDATE ON shopify_data TO authenticated;
