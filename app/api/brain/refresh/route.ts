import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { runGlobalBrain } from '@/lib/brain/global-brain'
import { runClientBrain } from '@/lib/brain/client-brain'
import { createServerClient } from '@/lib/supabase/server'

// ============================================================
// POST /api/brain/refresh
// Déclenche l'analyse depuis le dashboard (session Clerk requise)
// Uses real client data from shopify_data + meta_data
// ============================================================

export async function POST() {
  const { userId: clerkUserId } = auth()
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  console.log('[brain/refresh] START for', clerkUserId)
  const errors: string[] = []
  const supabase = createServerClient()

  // Resolve Supabase user_id to delete old recs
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .single()

  const supabaseUserId = userRow
    ? (userRow as { id: string }).id
    : '00000000-0000-0000-0000-000000000001'

  // Delete old recommendations for this user
  const { error: delError } = await supabase
    .from('brain_recommendations')
    .delete()
    .eq('user_id', supabaseUserId)

  if (delError) {
    console.error('[brain/refresh] Delete error:', delError)
    errors.push(`Delete error: ${delError.message}`)
  } else {
    console.log(`[brain/refresh] Old recs deleted for ${supabaseUserId}`)
  }

  // Global Brain
  let globalInsights: Awaited<ReturnType<typeof runGlobalBrain>> = []
  try {
    globalInsights = await runGlobalBrain()
    console.log('[brain/refresh] Global Brain OK —', globalInsights.length, 'insights')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[brain/refresh] Global Brain ERROR —', msg)
    errors.push(msg)
  }

  // Client Brain — pass the Clerk userId so it can fetch real data
  let totalRecs = 0
  try {
    const recs = await runClientBrain(clerkUserId, globalInsights)
    totalRecs = recs.length
    console.log(`[brain/refresh] Client Brain OK — ${recs.length} recs`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[brain/refresh] Client Brain ERROR —', msg)
    errors.push(msg)
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
