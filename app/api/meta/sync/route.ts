import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/encryption'

// ============================================================
// POST /api/meta/sync
// Fetch Meta Ads campaigns and store aggregated data in meta_data
// ============================================================

interface MetaCampaignRow {
  id: string
  name: string
  status: string
  spend: number
  impressions: number
  clicks: number
  reach: number
  ctr: number
  cpm: number
  roas: number
}

export async function POST() {
  try {
    const { userId: clerkUserId } = auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const supabase = createServerClient()

    // Find user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }
    const userId = (userData as { id: string }).id

    // Get active Meta connection
    const { data: connData } = await supabase
      .from('connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'meta')
      .eq('status', 'active')
      .limit(1)

    const connections = connData as { access_token_encrypted: string }[] | null
    if (!connections || connections.length === 0) {
      return NextResponse.json({ error: 'Aucune connexion Meta active' }, { status: 404 })
    }

    let accessToken: string
    try {
      accessToken = decrypt(connections[0].access_token_encrypted)
    } catch {
      return NextResponse.json({ error: 'Token invalide' }, { status: 500 })
    }

    // Get ad accounts
    const accountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_status&access_token=${accessToken}`
    )
    if (!accountsRes.ok) {
      const body = await accountsRes.text()
      return NextResponse.json({ error: 'Erreur Meta API (accounts)', details: body }, { status: 502 })
    }

    const accountsData = await accountsRes.json()
    const accounts = accountsData.data as { id: string; name: string; account_status: number }[]
    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ error: 'Aucun compte publicitaire trouvé' }, { status: 404 })
    }

    const activeAccount = accounts.find(a => a.account_status === 1) || accounts[0]

    // Date range: last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const since = thirtyDaysAgo.toISOString().split('T')[0]
    const until = new Date().toISOString().split('T')[0]

    // Fetch campaigns with insights
    const campaignsRes = await fetch(
      `https://graph.facebook.com/v21.0/${activeAccount.id}/campaigns?` +
      `fields=id,name,status,insights.time_range({"since":"${since}","until":"${until}"})` +
      `{spend,impressions,clicks,reach,ctr,cpm,actions,action_values}` +
      `&limit=50` +
      `&access_token=${accessToken}`
    )

    if (!campaignsRes.ok) {
      const body = await campaignsRes.text()
      return NextResponse.json({ error: 'Erreur Meta API (campaigns)', details: body }, { status: 502 })
    }

    const campaignsData = await campaignsRes.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const campaigns: MetaCampaignRow[] = (campaignsData.data || []).map((c: any) => {
      const ins = c.insights?.data?.[0] || {}
      const spend = parseFloat(ins.spend || '0')

      // ROAS from action_values (purchase value / spend)
      let purchaseValue = 0
      if (ins.action_values) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pv = ins.action_values.find((a: any) =>
          a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
        )
        if (pv) purchaseValue = parseFloat(pv.value || '0')
      }
      const roas = spend > 0 ? Math.round((purchaseValue / spend) * 100) / 100 : 0

      return {
        id: c.id,
        name: c.name,
        status: c.status?.toLowerCase() || 'unknown',
        spend: Math.round(spend * 100) / 100,
        impressions: parseInt(ins.impressions || '0', 10),
        clicks: parseInt(ins.clicks || '0', 10),
        reach: parseInt(ins.reach || '0', 10),
        ctr: Math.round(parseFloat(ins.ctr || '0') * 100) / 100,
        cpm: Math.round(parseFloat(ins.cpm || '0') * 100) / 100,
        roas,
      }
    })

    // Aggregate
    const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0)
    const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0)
    const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0)
    const totalReach = campaigns.reduce((s, c) => s + c.reach, 0)
    const avgCtr = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0
    const avgCpm = totalImpressions > 0 ? Math.round((totalSpend / totalImpressions) * 100000) / 100 : 0

    // Upsert into meta_data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (supabase.from('meta_data') as any)
      .upsert(
        {
          user_id: userId,
          account_id: activeAccount.id,
          account_name: activeAccount.name,
          campaigns,
          total_spend: Math.round(totalSpend * 100) / 100,
          total_impressions: totalImpressions,
          total_clicks: totalClicks,
          avg_ctr: avgCtr,
          avg_cpm: avgCpm,
          total_reach: totalReach,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (upsertError) {
      console.error('[meta/sync] Upsert error:', upsertError)
      return NextResponse.json({ error: 'Erreur de sauvegarde', details: upsertError.message }, { status: 500 })
    }

    console.log(`[meta/sync] Synced ${campaigns.length} campaigns, ${totalSpend}€ spend for user ${userId}`)

    return NextResponse.json({
      success: true,
      data: {
        account_id: activeAccount.id,
        account_name: activeAccount.name,
        campaigns,
        summary: {
          total_spend: Math.round(totalSpend * 100) / 100,
          total_impressions: totalImpressions,
          total_clicks: totalClicks,
          avg_ctr: avgCtr,
          avg_cpm: avgCpm,
          total_reach: totalReach,
          campaigns_count: campaigns.length,
        },
        synced_at: new Date().toISOString(),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[meta/sync] Unexpected error:', message)
    return NextResponse.json({ error: 'Erreur interne', details: message }, { status: 500 })
  }
}
