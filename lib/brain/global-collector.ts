import type { GlobalCollectorData, TrendSignal, AdFormatSignal, CrossSectorSignal } from './types'

// ============================================================
// Global Collector — Collecte les données marché
// Pour l'instant : données simulées réalistes
// TODO: brancher Google Trends API, Meta Marketing API
// ============================================================

const SECTORS = [
  'Mode / Streetwear',
  'Beauté / Skincare',
  'Art / Culture',
  'Sport / Fitness',
  'Tech / Gaming',
]

function collectTrends(): TrendSignal[] {
  return [
    {
      sector: 'Mode / Streetwear',
      keyword: 'cargo pants wide leg',
      trendDirection: 'rising',
      changePercent: 47,
      source: 'Google Trends FR — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sector: 'Mode / Streetwear',
      keyword: 'oversized hoodie',
      trendDirection: 'stable',
      changePercent: 3,
      source: 'Google Trends FR — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sector: 'Mode / Streetwear',
      keyword: 'gorpcore',
      trendDirection: 'rising',
      changePercent: 62,
      source: 'Google Trends FR — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sector: 'Beauté / Skincare',
      keyword: 'skin cycling routine',
      trendDirection: 'rising',
      changePercent: 35,
      source: 'Google Trends FR — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sector: 'Beauté / Skincare',
      keyword: 'retinol serum',
      trendDirection: 'declining',
      changePercent: -12,
      source: 'Google Trends FR — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sector: 'Art / Culture',
      keyword: 'print on demand art',
      trendDirection: 'rising',
      changePercent: 28,
      source: 'Google Trends FR — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sector: 'Sport / Fitness',
      keyword: 'running shorts men',
      trendDirection: 'rising',
      changePercent: 41,
      source: 'Google Trends FR — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sector: 'Sport / Fitness',
      keyword: 'home gym equipment',
      trendDirection: 'declining',
      changePercent: -18,
      source: 'Google Trends FR — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sector: 'Tech / Gaming',
      keyword: 'gaming accessories aesthetic',
      trendDirection: 'rising',
      changePercent: 53,
      source: 'Google Trends FR — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sector: 'Tech / Gaming',
      keyword: 'custom keyboard keycaps',
      trendDirection: 'stable',
      changePercent: 5,
      source: 'Google Trends FR — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
  ]
}

function collectAdFormats(): AdFormatSignal[] {
  return [
    {
      sector: 'Mode / Streetwear',
      format: 'UGC Reels 9:16',
      avgCtr: 3.1,
      avgCpm: 5.80,
      avgRoas: 4.2,
      sampleSize: 240,
      source: 'Analyse Meta Ads streetwear FR — 240 campagnes — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sector: 'Mode / Streetwear',
      format: 'Studio product photo',
      avgCtr: 1.7,
      avgCpm: 6.40,
      avgRoas: 2.8,
      sampleSize: 240,
      source: 'Analyse Meta Ads streetwear FR — 240 campagnes — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sector: 'Mode / Streetwear',
      format: 'Behind-the-scenes video',
      avgCtr: 2.9,
      avgCpm: 4.90,
      avgRoas: 3.9,
      sampleSize: 85,
      source: 'Analyse Meta Ads streetwear FR — 85 campagnes — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sector: 'Beauté / Skincare',
      format: 'Before/After carousel',
      avgCtr: 2.4,
      avgCpm: 7.10,
      avgRoas: 3.5,
      sampleSize: 180,
      source: 'Analyse Meta Ads beauté FR — 180 campagnes — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sector: 'Beauté / Skincare',
      format: 'Influencer tutorial',
      avgCtr: 2.8,
      avgCpm: 8.30,
      avgRoas: 3.1,
      sampleSize: 120,
      source: 'Analyse Meta Ads beauté FR — 120 campagnes — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sector: 'Sport / Fitness',
      format: 'Workout demo Reels',
      avgCtr: 3.4,
      avgCpm: 4.50,
      avgRoas: 4.8,
      sampleSize: 95,
      source: 'Analyse Meta Ads sport FR — 95 campagnes — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sector: 'Tech / Gaming',
      format: 'Unboxing / Setup tour',
      avgCtr: 2.6,
      avgCpm: 6.20,
      avgRoas: 3.3,
      sampleSize: 70,
      source: 'Analyse Meta Ads tech/gaming FR — 70 campagnes — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
  ]
}

function collectCrossSectorSignals(): CrossSectorSignal[] {
  return [
    {
      sectors: ['Mode / Streetwear', 'Sport / Fitness'],
      signal: 'Convergence gorpcore/athleisure : les marques qui mixent esthétique outdoor + streetwear voient un +35% de CTR sur les 18-24 ans.',
      strength: 'strong',
      source: 'Cross-analyse 320 campagnes mode + sport FR — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sectors: ['Mode / Streetwear', 'Art / Culture'],
      signal: 'Les collaborations marque × artiste local génèrent un ROAS moyen 2.1x supérieur aux campagnes produit classiques pour les drops limités.',
      strength: 'moderate',
      source: 'Analyse 45 collaborations mode × art FR — T1 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sectors: ['Beauté / Skincare', 'Tech / Gaming'],
      signal: 'Émergence du segment "gamer skincare" : les recherches ont triplé en 3 mois. Marché quasi vierge en France.',
      strength: 'moderate',
      source: 'Google Trends + analyse sémantique Reddit/TikTok — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
    {
      sectors: ['Mode / Streetwear', 'Tech / Gaming'],
      signal: 'Les accessoires tech avec un design streetwear (coques, sacs pour laptop) surperforment de +60% en taux de conversion vs design neutre.',
      strength: 'weak',
      source: 'Échantillon 28 marques accessoires tech FR — Mars 2026',
      collectedAt: new Date().toISOString(),
    },
  ]
}

export async function collectGlobalData(): Promise<GlobalCollectorData> {
  const trends = collectTrends()
  const adFormats = collectAdFormats()
  const crossSectorSignals = collectCrossSectorSignals()

  return {
    trends,
    adFormats,
    crossSectorSignals,
    collectedAt: new Date().toISOString(),
  }
}

export { SECTORS }
