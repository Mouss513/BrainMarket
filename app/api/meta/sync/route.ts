import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/encryption'

// ============================================================
// POST /api/meta/sync
// Fetch Meta Ads campaigns data for the logged-in user
// ============================================================

interface MetaCampaign {
  id: string
  name: string
  status: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpm: number
  actions?: { action_type: string; value: string }[]
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

    // Use first active account (account_status 1 = ACTIVE)
    const activeAccount = accounts.find(a => a.account_status === 1) || accounts[0]

    // Fetch campaigns with insights (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const today = new Date()
    const since = thirtyDaysAgo.toISOString().split('T')[0]
    const until = today.toISOString().split('T')[0]

    const campaignsRes = await fetch(
      `https://graph.facebook.com/v21.0/${activeAccount.id}/campaigns?` +
      `fields=id,name,status,insights.time_range({"since":"${since}","until":"${until}"}){spend,impressions,clicks,ctr,cpm,actions}` +
      `&limit=50` +
      `&access_token=${accessToken}`
    )

    if (!campaignsRes.ok) {
      const body = await campaignsRes.text()
      return NextResponse.json({ error: 'Erreur Meta API (campaigns)', details: body }, { status: 502 })
    }

    const campaignsData = await campaignsRes.json()
    const campaigns: MetaCampaign[] = (campaignsData.data || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => {
        const insights = c.insights?.data?.[0] || {}
        return {
          id: c.id,
          name: c.name,
          status: c.status,
          spend: parseFloat(insights.spend || '0'),
          impressions: parseInt(insights.impressions || '0', 10),
          clicks: parseInt(insights.clicks || '0', 10),
          ctr: parseFloat(insights.ctr || '0'),
          cpm: parseFloat(insights.cpm || '0'),
          actions: insights.actions || [],
        }
      }
    )

    // Aggregate metrics
    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0)
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0)
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const avgCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0

    // Calculate purchases from actions
    const totalPurchases = campaigns.reduce((sum, c) => {
      const purchaseAction = c.actions?.find(
        a => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
      )
      return sum + (purchaseAction ? parseInt(purchaseAction.value, 10) : 0)
    }, 0)

    console.log(`[meta/sync] Synced ${campaigns.length} campaigns, ${totalSpend}€ spend for user ${userId}`)

    return NextResponse.json({
      success: true,
      data: {
        account_id: activeAccount.id,
        account_name: activeAccount.name,
        campaigns: campaigns.slice(0, 20),
        summary: {
          total_spend: Math.round(totalSpend * 100) / 100,
          total_impressions: totalImpressions,
          total_clicks: totalClicks,
          avg_ctr: Math.round(avgCtr * 100) / 100,
          avg_cpm: Math.round(avgCpm * 100) / 100,
          total_purchases: totalPurchases,
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
