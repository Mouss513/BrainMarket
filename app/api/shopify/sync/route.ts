import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/encryption'
import { ShopifyClient } from '@/lib/shopify/client'

// ============================================================
// POST /api/shopify/sync
// Fetch Shopify data for the logged-in user and store in shopify_data
// ============================================================

export async function POST() {
  try {
    const { userId: clerkUserId } = auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    console.log(`[shopify/sync] Starting sync for clerk_id ${clerkUserId}`)

    const supabase = createServerClient()

    // Find user in Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (userError) {
      console.error('[shopify/sync] User lookup error:', userError)
      return NextResponse.json({ error: 'Utilisateur non trouvé', details: userError.message }, { status: 404 })
    }

    const user = userData as { id: string } | null
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    console.log(`[shopify/sync] Found user ${user.id}`)

    // Get active Shopify connection
    const { data: connData, error: connError } = await supabase
      .from('connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'shopify')
      .eq('status', 'active')
      .limit(1)

    if (connError) {
      console.error('[shopify/sync] Connection lookup error:', connError)
      return NextResponse.json({ error: 'Erreur de connexion', details: connError.message }, { status: 500 })
    }

    const connections = connData as { shop_domain: string; access_token_encrypted: string }[] | null
    if (!connections || connections.length === 0) {
      console.log('[shopify/sync] No active Shopify connection found')
      return NextResponse.json({ error: 'Aucune connexion Shopify active' }, { status: 404 })
    }

    const connection = connections[0]
    console.log(`[shopify/sync] Found connection for shop ${connection.shop_domain}`)

    let accessToken: string
    try {
      accessToken = decrypt(connection.access_token_encrypted)
    } catch (err) {
      console.error('[shopify/sync] Failed to decrypt token:', err)
      return NextResponse.json({ error: 'Token de connexion invalide' }, { status: 500 })
    }

    const client = new ShopifyClient(connection.shop_domain, accessToken)

    // Fetch orders from the last 30 days with server-side date filter
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let allOrders: { total_price: string; line_items: { title: string; quantity: number; price: string }[] }[] = []
    try {
      console.log(`[shopify/sync] Fetching orders since ${thirtyDaysAgo.toISOString()}`)
      allOrders = await client.getOrders(250, thirtyDaysAgo.toISOString())
      console.log(`[shopify/sync] Fetched ${allOrders.length} orders`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[shopify/sync] Failed to fetch orders:', message)
      return NextResponse.json({ error: 'Erreur Shopify API', details: message }, { status: 502 })
    }

    // Calculate revenue
    const revenue30d = allOrders.reduce((sum, o) => sum + parseFloat(o.total_price || '0'), 0)
    const ordersCount = allOrders.length
    const averageOrderValue = ordersCount > 0 ? revenue30d / ordersCount : 0

    // Calculate top 5 products by units sold
    const productMap = new Map<string, { units_sold: number; revenue: number }>()
    for (const order of allOrders) {
      for (const item of order.line_items) {
        const existing = productMap.get(item.title) || { units_sold: 0, revenue: 0 }
        existing.units_sold += item.quantity
        existing.revenue += parseFloat(item.price) * item.quantity
        productMap.set(item.title, existing)
      }
    }

    const topProducts = Array.from(productMap.entries())
      .map(([title, data]) => ({ title, units_sold: data.units_sold, revenue: Math.round(data.revenue * 100) / 100 }))
      .sort((a, b) => b.units_sold - a.units_sold)
      .slice(0, 5)

    // Upsert into shopify_data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (supabase.from('shopify_data') as any)
      .upsert(
        {
          user_id: user.id,
          revenue_30d: Math.round(revenue30d * 100) / 100,
          orders_count: ordersCount,
          average_order_value: Math.round(averageOrderValue * 100) / 100,
          top_products: topProducts,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (upsertError) {
      console.error('[shopify/sync] Upsert error:', upsertError)
      return NextResponse.json({ error: 'Erreur de sauvegarde', details: upsertError.message }, { status: 500 })
    }

    console.log(`[shopify/sync] Synced ${ordersCount} orders, ${revenue30d}€ revenue for user ${user.id}`)

    return NextResponse.json({
      success: true,
      data: {
        revenue_30d: Math.round(revenue30d * 100) / 100,
        orders_count: ordersCount,
        average_order_value: Math.round(averageOrderValue * 100) / 100,
        top_products: topProducts,
        synced_at: new Date().toISOString(),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[shopify/sync] Unexpected error:', message)
    return NextResponse.json({ error: 'Erreur interne', details: message }, { status: 500 })
  }
}
