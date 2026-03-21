-- ============================================================
-- BrainMarket — Migration 002 : RLS dev-friendly
-- Phase de développement : lecture publique (anon) autorisée
-- sur brain_recommendations et market_insights.
--
-- À REVERTER avant la mise en production (voir commentaire en bas).
-- ============================================================

-- ============================================================
-- brain_recommendations
-- ============================================================

-- Supprimer la policy de lecture restrictive (basée sur clerk_id)
DROP POLICY IF EXISTS "brain_recommendations: select own"
  ON public.brain_recommendations;

-- Ajouter une policy de lecture publique pour le dev
CREATE POLICY "brain_recommendations: public read (dev)"
  ON public.brain_recommendations FOR SELECT
  USING (true);

-- Accorder SELECT au rôle anon (clé publique Supabase)
GRANT SELECT ON public.brain_recommendations TO anon;

-- ============================================================
-- market_insights
-- ============================================================

-- La policy "public read" existe déjà (001_initial.sql),
-- mais s'assurer que le rôle anon a bien le GRANT SELECT.
GRANT SELECT ON public.market_insights TO anon;

-- ============================================================
-- PRODUCTION ROLLBACK
-- Quand l'auth Clerk sera en place, exécuter :
--
--   REVOKE SELECT ON public.brain_recommendations FROM anon;
--   DROP POLICY "brain_recommendations: public read (dev)"
--     ON public.brain_recommendations;
--   CREATE POLICY "brain_recommendations: select own"
--     ON public.brain_recommendations FOR SELECT
--     USING (user_id = (
--       SELECT id FROM public.users
--       WHERE clerk_id = current_setting('app.current_user_clerk_id', true)
--     ));
-- ============================================================
