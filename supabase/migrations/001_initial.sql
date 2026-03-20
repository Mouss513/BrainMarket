-- ============================================================
-- BrainMarket — Migration initiale
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Enums
-- ============================================================

CREATE TYPE user_status AS ENUM ('active', 'blocked');
CREATE TYPE campaign_status AS ENUM ('active', 'paused', 'ended', 'draft');

-- ============================================================
-- Table : users
-- ============================================================

CREATE TABLE public.users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id   TEXT NOT NULL UNIQUE,
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status     user_status NOT NULL DEFAULT 'active'
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs ne voient que leur propre ligne
CREATE POLICY "users: select own row"
  ON public.users FOR SELECT
  USING (clerk_id = current_setting('app.current_user_clerk_id', true));

CREATE POLICY "users: insert own row"
  ON public.users FOR INSERT
  WITH CHECK (clerk_id = current_setting('app.current_user_clerk_id', true));

CREATE POLICY "users: update own row"
  ON public.users FOR UPDATE
  USING (clerk_id = current_setting('app.current_user_clerk_id', true));

-- ============================================================
-- Table : campaigns
-- ============================================================

CREATE TABLE public.campaigns (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  platform   TEXT NOT NULL,
  budget     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  roas       NUMERIC(8, 4),
  ctr        NUMERIC(8, 4),
  cpm        NUMERIC(8, 4),
  status     campaign_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns: select own"
  ON public.campaigns FOR SELECT
  USING (user_id = (
    SELECT id FROM public.users
    WHERE clerk_id = current_setting('app.current_user_clerk_id', true)
  ));

CREATE POLICY "campaigns: insert own"
  ON public.campaigns FOR INSERT
  WITH CHECK (user_id = (
    SELECT id FROM public.users
    WHERE clerk_id = current_setting('app.current_user_clerk_id', true)
  ));

CREATE POLICY "campaigns: update own"
  ON public.campaigns FOR UPDATE
  USING (user_id = (
    SELECT id FROM public.users
    WHERE clerk_id = current_setting('app.current_user_clerk_id', true)
  ));

CREATE POLICY "campaigns: delete own"
  ON public.campaigns FOR DELETE
  USING (user_id = (
    SELECT id FROM public.users
    WHERE clerk_id = current_setting('app.current_user_clerk_id', true)
  ));

-- ============================================================
-- Table : products
-- ============================================================

CREATE TABLE public.products (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  category   TEXT NOT NULL,
  revenue    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  units_sold INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products: select own"
  ON public.products FOR SELECT
  USING (user_id = (
    SELECT id FROM public.users
    WHERE clerk_id = current_setting('app.current_user_clerk_id', true)
  ));

CREATE POLICY "products: insert own"
  ON public.products FOR INSERT
  WITH CHECK (user_id = (
    SELECT id FROM public.users
    WHERE clerk_id = current_setting('app.current_user_clerk_id', true)
  ));

CREATE POLICY "products: update own"
  ON public.products FOR UPDATE
  USING (user_id = (
    SELECT id FROM public.users
    WHERE clerk_id = current_setting('app.current_user_clerk_id', true)
  ));

CREATE POLICY "products: delete own"
  ON public.products FOR DELETE
  USING (user_id = (
    SELECT id FROM public.users
    WHERE clerk_id = current_setting('app.current_user_clerk_id', true)
  ));

-- ============================================================
-- Table : brain_recommendations
-- ============================================================

CREATE TABLE public.brain_recommendations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  confidence_score NUMERIC(4, 3) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  sector           TEXT NOT NULL,
  applied          BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.brain_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brain_recommendations: select own"
  ON public.brain_recommendations FOR SELECT
  USING (user_id = (
    SELECT id FROM public.users
    WHERE clerk_id = current_setting('app.current_user_clerk_id', true)
  ));

CREATE POLICY "brain_recommendations: insert own"
  ON public.brain_recommendations FOR INSERT
  WITH CHECK (user_id = (
    SELECT id FROM public.users
    WHERE clerk_id = current_setting('app.current_user_clerk_id', true)
  ));

CREATE POLICY "brain_recommendations: update own"
  ON public.brain_recommendations FOR UPDATE
  USING (user_id = (
    SELECT id FROM public.users
    WHERE clerk_id = current_setting('app.current_user_clerk_id', true)
  ));

CREATE POLICY "brain_recommendations: delete own"
  ON public.brain_recommendations FOR DELETE
  USING (user_id = (
    SELECT id FROM public.users
    WHERE clerk_id = current_setting('app.current_user_clerk_id', true)
  ));

-- ============================================================
-- Table : market_insights
-- ============================================================
-- Données globales (non liées à un user) — lecture seule pour tous,
-- écriture réservée au service role (via la clé service_role côté serveur)

CREATE TABLE public.market_insights (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector           TEXT NOT NULL,
  insight          TEXT NOT NULL,
  source           TEXT NOT NULL,
  confidence_score NUMERIC(4, 3) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.market_insights ENABLE ROW LEVEL SECURITY;

-- Lecture publique (authentifié ou non)
CREATE POLICY "market_insights: public read"
  ON public.market_insights FOR SELECT
  USING (true);

-- Écriture uniquement via service_role (pas de policy INSERT/UPDATE/DELETE
-- → seul le service_role contourne le RLS)

-- ============================================================
-- Index utiles
-- ============================================================

CREATE INDEX ON public.campaigns (user_id, created_at DESC);
CREATE INDEX ON public.products (user_id, created_at DESC);
CREATE INDEX ON public.brain_recommendations (user_id, created_at DESC);
CREATE INDEX ON public.brain_recommendations (user_id, applied);
CREATE INDEX ON public.market_insights (sector, created_at DESC);
