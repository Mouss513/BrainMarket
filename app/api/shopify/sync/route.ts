import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/encryption'
import { ShopifyClient } from '@/lib/shopify/client'

// ============================================================
// POST /api/shopify/sync
// Fetch Shopify data (products + order count) and store in shopify_data
// Uses only endpoints that don't require protected customer data access
// ============================================================

export async function POST() {
  try {
    const { userId: clerkUserId } = auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const supabase = createServerClient()

    // Find user in Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const userId = (userData as { id: string }).id

    // Get active Shopify connection
    const { data: connData, error: connError } = await supabase
      .from('connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'shopify')
      .eq('status', 'active')
      .limit(1)

    if (connError) {
      return NextResponse.json({ error: 'Erreur de connexion', details: connError.message }, { status: 500 })
    }

    const connections = connData as { shop_domain: string; access_token_encrypted: string }[] | null
    if (!connections || connections.length === 0) {
      return NextResponse.json({ error: 'Aucune connexion Shopify active' }, { status: 404 })
    }

    const connection = connections[0]
    let accessToken: string
    try {
      accessToken = decrypt(connection.access_token_encrypted)
    } catch {
      return NextResponse.json({ error: 'Token invalide' }, { status: 500 })
    }

    const client = new ShopifyClient(connection.shop_domain, accessToken)

    // Fetch products (read_products scope — no protected data)
    let products: { title: string; variants: { price: string; inventory_quantity: number }[] }[] = []
    try {
      products = await client.getProducts(50)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[shopify/sync] Products fetch failed:', msg)
      return NextResponse.json({ error: 'Erreur Shopify API (products)', details: msg }, { status: 502 })
    }

    // Try to get order count (may return null if 403)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const ordersCount = await client.getOrdersCount(thirtyDaysAgo.toISOString())
    const estimated = ordersCount === null

    // Build top products from catalog data
    const topProducts = products
      .map(p => {
        const mainVariant = p.variants[0]
        const price = parseFloat(mainVariant?.price || '0')
        const stock = p.variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0)
        return {
          title: p.title,
          units_sold: estimated ? Math.max(1, Math.round(stock * 0.3)) : 0,
          revenue: estimated ? Math.round(price * Math.max(1, Math.round(stock * 0.3)) * 100) / 100 : 0,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Calculate metrics
    const finalOrdersCount = ordersCount ?? topProducts.reduce((sum, p) => sum + p.units_sold, 0)
    const revenue30d = estimated
      ? topProducts.reduce((sum, p) => sum + p.revenue, 0)
      : 0 // Real revenue requires order access
    const averageOrderValue = finalOrdersCount > 0 ? revenue30d / finalOrdersCount : 0

    // Upsert into shopify_data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (supabase.from('shopify_data') as any)
      .upsert(
        {
          user_id: userId,
          revenue_30d: Math.round(revenue30d * 100) / 100,
          orders_count: finalOrdersCount,
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

    console.log(`[shopify/sync] Synced ${products.length} products, ${finalOrdersCount} orders for user ${userId}${estimated ? ' (estimated)' : ''}`)

    return NextResponse.json({
      success: true,
      estimated,
      data: {
        revenue_30d: Math.round(revenue30d * 100) / 100,
        orders_count: finalOrdersCount,
        average_order_value: Math.round(averageOrderValue * 100) / 100,
        top_products: topProducts,
        products_count: products.length,
        synced_at: new Date().toISOString(),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[shopify/sync] Unexpected error:', message)
    return NextResponse.json({ error: 'Erreur interne', details: message }, { status: 500 })
  }
}
