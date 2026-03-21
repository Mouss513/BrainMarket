import { NextResponse } from 'next/server'
import { runGlobalBrain } from '@/lib/brain/global-brain'
import { runClientBrain } from '@/lib/brain/client-brain'

// ============================================================
// POST /api/brain/refresh
// Déclenche l'analyse depuis le dashboard (sans clé admin)
// ============================================================

const MOCK_CLIENT_IDS = ['user_orem_001']

export async function POST() {
  console.log('[brain/refresh] START', new Date().toISOString())
  const errors: string[] = []

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
