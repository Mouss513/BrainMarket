import { NextRequest, NextResponse } from 'next/server'
import { runGlobalBrain } from '@/lib/brain/global-brain'

// ============================================================
// GET /api/brain/cron
// Route cron Vercel — tourne toutes les 4h
// Déclenche le Global Brain pour tous les secteurs
//
// vercel.json :
// { "crons": [{ "path": "/api/brain/cron", "schedule": "0 */4 * * *" }] }
// ============================================================

export async function GET(req: NextRequest) {
  // Vérifier que c'est bien Vercel Cron qui appelle
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const insights = await runGlobalBrain()

    return NextResponse.json({
      ok: true,
      insightsGenerated: insights.length,
      sectors: Array.from(new Set(insights.map((i) => i.sector))),
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Cron Global Brain error:', msg)

    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    )
  }
}
