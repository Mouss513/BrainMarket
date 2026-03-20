// ============================================================
// Données fictives réalistes — Orem Studio (streetwear FR)
// ============================================================

export const MOCK_METRICS = {
  roasGlobal: 3.42,
  budgetTotal: 4_870,
  revenusGeneres: 16_655,
  cpmMoyen: 6.80,
}

// ROAS journalier sur 30 jours
export const MOCK_ROAS_HISTORY = [
  { day: '19 Fév', roas: 2.1 },
  { day: '20 Fév', roas: 2.4 },
  { day: '21 Fév', roas: 2.0 },
  { day: '22 Fév', roas: 2.8 },
  { day: '23 Fév', roas: 3.1 },
  { day: '24 Fév', roas: 2.9 },
  { day: '25 Fév', roas: 3.3 },
  { day: '26 Fév', roas: 3.5 },
  { day: '27 Fév', roas: 3.0 },
  { day: '28 Fév', roas: 2.7 },
  { day: '1 Mar', roas: 3.2 },
  { day: '2 Mar', roas: 3.6 },
  { day: '3 Mar', roas: 3.4 },
  { day: '4 Mar', roas: 3.8 },
  { day: '5 Mar', roas: 4.1 },
  { day: '6 Mar', roas: 3.7 },
  { day: '7 Mar', roas: 3.9 },
  { day: '8 Mar', roas: 3.5 },
  { day: '9 Mar', roas: 3.2 },
  { day: '10 Mar', roas: 3.0 },
  { day: '11 Mar', roas: 3.4 },
  { day: '12 Mar', roas: 3.6 },
  { day: '13 Mar', roas: 3.8 },
  { day: '14 Mar', roas: 4.0 },
  { day: '15 Mar', roas: 3.7 },
  { day: '16 Mar', roas: 3.5 },
  { day: '17 Mar', roas: 3.3 },
  { day: '18 Mar', roas: 3.6 },
  { day: '19 Mar', roas: 3.4 },
  { day: '20 Mar', roas: 3.42 },
]

export const MOCK_RECOMMENDATIONS = [
  {
    id: '1',
    title: 'Augmenter le budget sur "Cargo Drop S2"',
    description:
      'Le ROAS de cette campagne est à 5.2x, bien au-dessus de la moyenne. Augmenter le budget de 30% devrait maintenir un ROAS supérieur à 4x sur la semaine.',
    confidenceScore: 0.87,
    sector: 'streetwear',
    applied: false,
  },
  {
    id: '2',
    title: 'Couper la campagne "Retargeting Général"',
    description:
      'Le CTR est tombé à 0.6% et le ROAS est sous 1x depuis 5 jours. Le budget serait mieux alloué sur les campagnes acquisition qui performent.',
    confidenceScore: 0.92,
    sector: 'streetwear',
    applied: false,
  },
  {
    id: '3',
    title: 'Tester un creative UGC sur "Hoodie Essentials"',
    description:
      'Les marques streetwear similaires voient un +40% de CTR avec des creatives UGC vs studio. Le CPM est stable, c\'est le CTR qui bloque la perf.',
    confidenceScore: 0.74,
    sector: 'streetwear',
    applied: true,
  },
]

export const MOCK_CAMPAIGNS = [
  {
    id: '1',
    name: 'Cargo Drop S2 — Acquisition',
    platform: 'Meta Ads',
    budget: 1_500,
    roas: 5.2,
    ctr: 2.8,
    cpm: 5.40,
    status: 'active' as const,
    productId: '1',
  },
  {
    id: '2',
    name: 'Hoodie Essentials — Lookalike',
    platform: 'Meta Ads',
    budget: 1_200,
    roas: 3.1,
    ctr: 1.9,
    cpm: 7.20,
    status: 'active' as const,
    productId: '3',
  },
  {
    id: '3',
    name: 'T-shirt Oversize — Broad',
    platform: 'Meta Ads',
    budget: 800,
    roas: 2.4,
    ctr: 1.5,
    cpm: 6.90,
    status: 'active' as const,
    productId: '2',
  },
  {
    id: '4',
    name: 'Retargeting Général',
    platform: 'Meta Ads',
    budget: 600,
    roas: 0.8,
    ctr: 0.6,
    cpm: 8.50,
    status: 'active' as const,
    productId: null,
  },
  {
    id: '5',
    name: 'Collection Été — Teasing',
    platform: 'Meta Ads',
    budget: 770,
    roas: 0,
    ctr: 0,
    cpm: 0,
    status: 'draft' as const,
    productId: '5',
  },
]

export const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'Cargo Baggy "Phantom"',
    category: 'Pantalons',
    revenue: 7_800,
    unitsSold: 104,
    campaignId: '1',
  },
  {
    id: '2',
    name: 'T-shirt Oversize "Concrete"',
    category: 'T-shirts',
    revenue: 2_970,
    unitsSold: 99,
    campaignId: '3',
  },
  {
    id: '3',
    name: 'Hoodie Heavyweight "Orem Classic"',
    category: 'Hoodies',
    revenue: 3_720,
    unitsSold: 62,
    campaignId: '2',
  },
  {
    id: '4',
    name: 'Bonnet Docker "Nightshift"',
    category: 'Accessoires',
    revenue: 1_125,
    unitsSold: 75,
    campaignId: null,
  },
  {
    id: '5',
    name: 'Short Mesh "Heatwave"',
    category: 'Shorts',
    revenue: 640,
    unitsSold: 16,
    campaignId: '5',
  },
  {
    id: '6',
    name: 'Sac Banane "Stealth"',
    category: 'Accessoires',
    revenue: 400,
    unitsSold: 20,
    campaignId: null,
  },
]

export const MOCK_MARKET_INSIGHTS = [
  {
    id: '1',
    sector: 'Streetwear',
    insight:
      'Les marques streetwear qui utilisent des creatives "behind the scenes" (production, packing) voient un CTR moyen de 3.1% vs 1.7% pour les visuels produit classiques.',
    source: 'Analyse de 240 campagnes Meta Ads streetwear FR — Mars 2026',
    confidenceScore: 0.91,
    locked: false,
  },
  {
    id: '2',
    sector: 'E-commerce Mode',
    insight:
      'Le CPM moyen sur Meta Ads pour la mode en France a baissé de 12% en mars, probablement lié à la baisse de concurrence post-soldes. Fenêtre d\'opportunité pour scaler.',
    source: 'Données agrégées Meta Ads FR — T1 2026',
    confidenceScore: 0.85,
    locked: false,
  },
  {
    id: '3',
    sector: 'DTC / Marques indépendantes',
    insight:
      'Les marques DTC avec un AOV entre 50-80€ obtiennent le meilleur ROAS en ciblant les 18-24 ans avec du contenu UGC sur Instagram Reels. Le format 9:16 surperforme de 2.3x.',
    source: 'Benchmark DTC France — 847 marques analysées',
    confidenceScore: 0.78,
    locked: true,
  },
  {
    id: '4',
    sector: 'Sneakers & Footwear',
    insight:
      'Les campagnes de pre-launch avec compte à rebours sur landing page convertissent 4.7x mieux que les campagnes de lancement direct pour les drops limités.',
    source: 'Étude sneakers/streetwear EU — 120 drops analysés',
    confidenceScore: 0.82,
    locked: true,
  },
]
