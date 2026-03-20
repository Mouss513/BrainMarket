// ============================================================
// Types partagés du Market Brain
// ============================================================

export interface TrendSignal {
  sector: string
  keyword: string
  trendDirection: 'rising' | 'stable' | 'declining'
  changePercent: number
  source: string
  collectedAt: string
}

export interface AdFormatSignal {
  sector: string
  format: string
  avgCtr: number
  avgCpm: number
  avgRoas: number
  sampleSize: number
  source: string
  collectedAt: string
}

export interface CrossSectorSignal {
  sectors: string[]
  signal: string
  strength: 'strong' | 'moderate' | 'weak'
  source: string
  collectedAt: string
}

export interface GlobalCollectorData {
  trends: TrendSignal[]
  adFormats: AdFormatSignal[]
  crossSectorSignals: CrossSectorSignal[]
  collectedAt: string
}

export interface GlobalInsight {
  sector: string
  insight: string
  source: string
  confidenceScore: number
}

export interface ClientData {
  userId: string
  brandName: string
  sector: string
  campaigns: {
    name: string
    platform: string
    budget: number
    roas: number
    ctr: number
    cpm: number
    status: string
  }[]
  products: {
    name: string
    category: string
    revenue: number
    unitsSold: number
  }[]
  totalRevenue: number
  totalBudget: number
  avgRoas: number
}

export interface BrainRecommendation {
  title: string
  description: string
  action: string
  expectedResult: string
  confidenceScore: number
  source: string
  sector: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  degradedMode: boolean
  recommendations: BrainRecommendation[]
}

export interface BrainRunSummary {
  startedAt: string
  completedAt: string
  globalInsightsGenerated: number
  clientRecommendationsGenerated: number
  errors: string[]
}
