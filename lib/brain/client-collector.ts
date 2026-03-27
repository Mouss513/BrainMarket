import { MOCK_CAMPAIGNS, MOCK_PRODUCTS, MOCK_METRICS } from '@/lib/mock-data'
import { createServerClient } from '@/lib/supabase/server'
import type { ClientData } from './types'

// ============================================================
// Client Collector — Collecte les données d'un client
// Fetch real data from shopify_data + meta_data tables
// Falls back to mock data if nothing available
// ============================================================

interface ShopifyDataRow {
  revenue_30d: number
  orders_count: number
  average_order_value: number
  top_products: { title: string; units_sold: number; revenue: number }[]
  synced_at: string
}

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

interface MetaDataRow {
  campaigns: MetaCampaignRow[]
  total_spend: number
  total_impressions: number
  total_clicks: number
  avg_ctr: number
  avg_cpm: number
  synced_at: string
}

export async function collectClientData(userId: string): Promise<ClientData & { isDemo: boolean }> {
  const supabase = createServerClient()

  // Try to find user by clerk_id or by uuid
  let supabaseUserId: string | null = null
  const { data: userById } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (userById) {
    supabaseUserId = (userById as { id: string }).id
  }

  let shopifyData: ShopifyDataRow | null = null
  let metaData: MetaDataRow | null = null

  if (supabaseUserId) {
    // Fetch Shopify data
    const { data: sdRows } = await supabase
      .from('shopify_data')
      .select('*')
      .eq('user_id', supabaseUserId)
      .order('synced_at', { ascending: false })
      .limit(1)

    if (sdRows && sdRows.length > 0) {
      shopifyData = sdRows[0] as unknown as ShopifyDataRow
    }

    // Fetch Meta data
    const { data: mdRows } = await supabase
      .from('meta_data')
      .select('*')
      .eq('user_id', supabaseUserId)
      .order('synced_at', { ascending: false })
      .limit(1)

    if (mdRows && mdRows.length > 0) {
      metaData = mdRows[0] as unknown as MetaDataRow
    }
  }

  const hasRealData = !!(shopifyData || metaData)

  // Build campaigns from Meta data or mock
  const campaigns = metaData && metaData.campaigns.length > 0
    ? metaData.campaigns.map(c => ({
        name: c.name,
        platform: 'Meta Ads',
        budget: c.spend,
        roas: c.roas,
        ctr: c.ctr,
        cpm: c.cpm,
        status: c.status,
      }))
    : MOCK_CAMPAIGNS.map(c => ({
        name: c.name,
        platform: c.platform,
        budget: c.budget,
        roas: c.roas,
        ctr: c.ctr,
        cpm: c.cpm,
        status: c.status,
      }))

  // Build products from Shopify data or mock
  const products = shopifyData && shopifyData.top_products.length > 0
    ? shopifyData.top_products.map(p => ({
        name: p.title,
        category: 'Produit Shopify',
        revenue: p.revenue,
        unitsSold: p.units_sold,
      }))
    : MOCK_PRODUCTS.map(p => ({
        name: p.name,
        category: p.category,
        revenue: p.revenue,
        unitsSold: p.unitsSold,
      }))

  // Calculate totals
  const totalRevenue = shopifyData ? shopifyData.revenue_30d : MOCK_METRICS.revenusGeneres
  const totalBudget = metaData ? metaData.total_spend : MOCK_METRICS.budgetTotal

  const activeCampaigns = campaigns.filter(c => c.status === 'active')
  const avgRoas = activeCampaigns.length > 0
    ? activeCampaigns.reduce((sum, c) => sum + c.roas, 0) / activeCampaigns.length
    : 0

  return {
    userId,
    brandName: hasRealData ? 'Mon Business' : 'Orem Studio (démo)',
    sector: 'Mode / Streetwear',
    campaigns,
    products,
    totalRevenue,
    totalBudget,
    avgRoas,
    isDemo: !hasRealData,
  }
}
