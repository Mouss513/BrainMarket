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
  const { userId: clerkUserId } = auth()
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const supabase = createServerClient()

  // Find user in Supabase
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .single()

  const user = userData as { id: string } | null
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }

  // Get active Shopify connection
  const { data: connData } = await supabase
    .from('connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('platform', 'shopify')
    .eq('status', 'active')
    .limit(1)

  const connections = connData as { shop_domain: string; access_token_encrypted: string }[] | null
  if (!connections || connections.length === 0) {
    return NextResponse.json({ error: 'Aucune connexion Shopify active' }, { status: 404 })
  }

  const connection = connections[0]
  let accessToken: string
  try {
    accessToken = decrypt(connection.access_token_encrypted)
  } catch (err) {
    console.error('[shopify/sync] Failed to decrypt token:', err)
    return NextResponse.json({ error: 'Token de connexion invalide' }, { status: 500 })
  }

  const client = new ShopifyClient(connection.shop_domain, accessToken)

  // Fetch orders from the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  let allOrders: { total_price: string; line_items: { title: string; quantity: number; price: string }[] }[] = []
  try {
    const orders = await client.getOrders(250)
    // Filter to last 30 days
    allOrders = orders.filter(o => new Date(o.created_at) >= thirtyDaysAgo)
  } catch (err) {
    console.error('[shopify/sync] Failed to fetch orders:', err)
    return NextResponse.json({ error: 'Erreur lors de la récupération des commandes' }, { status: 502 })
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
    return NextResponse.json({ error: 'Erreur de sauvegarde' }, { status: 500 })
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
}
