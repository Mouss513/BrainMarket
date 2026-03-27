import { NextRequest, NextResponse } from 'next/server'
import { runGlobalBrain } from '@/lib/brain/global-brain'
import { runClientBrain } from '@/lib/brain/client-brain'
import { createServerClient } from '@/lib/supabase/server'
import type { BrainRunSummary } from '@/lib/brain/types'

// ============================================================
// POST /api/brain/run
// Déclenche l'analyse complète : Global Brain + Client Brain
// Protégée par BRAIN_ADMIN_KEY — runs for all users with connections
// ============================================================

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const adminKey = process.env.BRAIN_ADMIN_KEY

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = new Date().toISOString()
  const errors: string[] = []

  // Global Brain
  let globalInsights: Awaited<ReturnType<typeof runGlobalBrain>> = []
  try {
    globalInsights = await runGlobalBrain()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(`Global Brain error: ${msg}`)
  }

  // Get all users with active connections (they have real data)
  const supabase = createServerClient()
  const { data: usersData } = await supabase
    .from('users')
    .select('id, clerk_id')

  const users = (usersData || []) as { id: string; clerk_id: string }[]

  // If no users, fall back to a mock run
  const userIds = users.length > 0
    ? users.map(u => u.clerk_id)
    : ['user_orem_001']

  let totalClientRecs = 0
  for (const uid of userIds) {
    try {
      const recs = await runClientBrain(uid, globalInsights)
      totalClientRecs += recs.length
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Client Brain error (${uid}): ${msg}`)
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
