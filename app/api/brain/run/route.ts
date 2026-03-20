import { NextRequest, NextResponse } from 'next/server'
import { runGlobalBrain } from '@/lib/brain/global-brain'
import { runClientBrain } from '@/lib/brain/client-brain'
import type { BrainRunSummary } from '@/lib/brain/types'

// ============================================================
// POST /api/brain/run
// Déclenche l'analyse complète : Global Brain + Client Brain
// Protégée par BRAIN_ADMIN_KEY
// ============================================================

// Simulated client IDs — in production, fetch from users table
const MOCK_CLIENT_IDS = ['user_orem_001']

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const adminKey = process.env.BRAIN_ADMIN_KEY

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = new Date().toISOString()
  const errors: string[] = []

  // ---- NIVEAU 1 : Global Brain ----
  let globalInsights: Awaited<ReturnType<typeof runGlobalBrain>> = []
  try {
    globalInsights = await runGlobalBrain()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(`Global Brain error: ${msg}`)
  }

  // ---- NIVEAU 2 : Client Brain (pour chaque client) ----
  let totalClientRecs = 0
  for (const clientId of MOCK_CLIENT_IDS) {
    try {
      const recs = await runClientBrain(clientId, globalInsights)
      totalClientRecs += recs.length
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Client Brain error (${clientId}): ${msg}`)
    }
  }

  const summary: BrainRunSummary = {
    startedAt,
    completedAt: new Date().toISOString(),
    globalInsightsGenerated: globalInsights.length,
    clientRecommendationsGenerated: totalClientRecs,
    errors,
  }

  return NextResponse.json(summary)
}
