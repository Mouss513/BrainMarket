import { NextResponse } from 'next/server'
import { runGlobalBrain } from '@/lib/brain/global-brain'
import { runClientBrain } from '@/lib/brain/client-brain'
import { createServerClient } from '@/lib/supabase/server'

// ============================================================
// POST /api/brain/refresh
// Déclenche l'analyse depuis le dashboard (sans clé admin)
// ============================================================

const MOCK_CLIENT_IDS = ['user_orem_001']

export async function POST() {
  console.log('[brain/refresh] START', new Date().toISOString())
  const errors: string[] = []
  const supabase = createServerClient()

  // Supprimer les anciennes recommandations avant de régénérer
  for (const clientId of MOCK_CLIENT_IDS) {
    const { error: delError } = await supabase
      .from('brain_recommendations')
      .delete()
      .eq('user_id', '00000000-0000-0000-0000-000000000001')

    if (delError) {
      console.error(`[brain/refresh] Erreur suppression recs (${clientId}):`, delError)
      errors.push(`Delete error (${clientId}): ${delError.message}`)
    } else {
      console.log(`[brain/refresh] Anciennes recs supprimées pour ${clientId}`)
    }
  }

  let globalInsights: Awaited<ReturnType<typeof runGlobalBrain>> = []
  try {
    globalInsights = await runGlobalBrain()
    console.log('[brain/refresh] Global Brain OK —', globalInsights.length, 'insights')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[brain/refresh] Global Brain ERROR —', msg)
    errors.push(msg)
  }

  let totalRecs = 0
  for (const clientId of MOCK_CLIENT_IDS) {
    try {
      const recs = await runClientBrain(clientId, globalInsights)
      totalRecs += recs.length
      console.log(`[brain/refresh] Client Brain OK (${clientId}) —`, recs.length, 'recs')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[brain/refresh] Client Brain ERROR (${clientId}) —`, msg)
      errors.push(msg)
    }
  }

  const result = {
    ok: errors.length === 0,
    startedAt: new Date().toISOString(),
    globalInsightsGenerated: globalInsights.length,
    clientRecommendationsGenerated: totalRecs,
    errors,
  }

  console.log('[brain/refresh] END', result)
  return NextResponse.json(result)
}
