export const APP_CONFIG = {
  name: 'BrainMarket',
  tagline: 'Ad intelligence, redefined.',
  description: 'SaaS d\'ad intelligence pour e-commerce.',

  // Couleurs principales
  colors: {
    primary: '#7c3aed',       // violet-600
    primaryHover: '#6d28d9',  // violet-700
    primaryLight: '#a78bfa',  // violet-400
    accent: '#6366f1',        // indigo-500
    background: '#030712',    // gray-950
    surface: '#111827',       // gray-900
    surfaceLight: '#1f2937',  // gray-800
    border: '#374151',        // gray-700
    text: '#f9fafb',          // gray-50
    textSecondary: '#9ca3af', // gray-400
    success: '#22c55e',       // green-500
    warning: '#f59e0b',       // amber-500
    danger: '#ef4444',        // red-500
  },

  // Pricing
  pricing: {
    monthly: 49,
    yearly: 39, // par mois, facturé annuellement
    currency: '€',
    trialDays: 14,
    commissionPercent: 2.5, // pourcentage sur les ventes générées
  },

  // Limites plan gratuit
  freePlan: {
    maxCampaigns: 5,
    maxProducts: 10,
    insightsVisible: 2, // nombre d'insights visibles sans abo
    brainRecommendationsPerDay: 3,
  },

  // Navigation sidebar
  nav: [
    { label: 'Overview', href: '/dashboard', icon: 'overview' },
    { label: 'Campagnes', href: '/dashboard/campaigns', icon: 'campaigns' },
    { label: 'Produits', href: '/dashboard/products', icon: 'products' },
    { label: 'Market Insights', href: '/dashboard/market-insights', icon: 'insights' },
  ],
} as const
