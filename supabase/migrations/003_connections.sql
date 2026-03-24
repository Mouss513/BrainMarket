-- ============================================================
-- BrainMarket — Migration 003 : Table connections
-- Stocke les connexions OAuth (Shopify, Meta, etc.)
-- ============================================================

CREATE TYPE connection_status AS ENUM ('active', 'expired', 'revoked', 'error');

CREATE TABLE public.connections (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform               TEXT NOT NULL,
  shop_domain            TEXT,
  access_token_encrypted TEXT NOT NULL,
  scopes                 TEXT NOT NULL DEFAULT '',
  status                 connection_status NOT NULL DEFAULT 'active',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, platform, shop_domain)
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour le dev (comme brain_recommendations)
CREATE POLICY "connections: public read (dev)"
  ON public.connections FOR SELECT
  USING (true);

GRANT SELECT ON public.connections TO anon;

CREATE INDEX ON public.connections (user_id, platform);
CREATE INDEX ON public.connections (user_id, status);
