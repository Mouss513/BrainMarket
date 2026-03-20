import { MOCK_CAMPAIGNS, MOCK_PRODUCTS, MOCK_METRICS } from '@/lib/mock-data'
import type { ClientData } from './types'

// ============================================================
// Client Collector — Collecte les données d'un client
// Pour l'instant : données fictives Orem Studio
// TODO: brancher Shopify API + Meta Marketing API
// ============================================================

export async function collectClientData(userId: string): Promise<ClientData> {
  // TODO: fetch real data from Shopify + Meta APIs based on userId
  // For now, return mock data for Orem Studio

  const activeCampaigns = MOCK_CAMPAIGNS.filter((c) => c.status === 'active')
  const avgRoas =
    activeCampaigns.length > 0
      ? activeCampaigns.reduce((sum, c) => sum + c.roas, 0) / activeCampaigns.length
      : 0

  return {
    userId,
    brandName: 'Orem Studio',
    sector: 'Mode / Streetwear',
    campaigns: MOCK_CAMPAIGNS.map((c) => ({
      name: c.name,
      platform: c.platform,
      budget: c.budget,
      roas: c.roas,
      ctr: c.ctr,
      cpm: c.cpm,
      status: c.status,
    })),
    products: MOCK_PRODUCTS.map((p) => ({
      name: p.name,
      category: p.category,
      revenue: p.revenue,
      unitsSold: p.unitsSold,
    })),
    totalRevenue: MOCK_METRICS.revenusGeneres,
    totalBudget: MOCK_METRICS.budgetTotal,
    avgRoas,
  }
}
