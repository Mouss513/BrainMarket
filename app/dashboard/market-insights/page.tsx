'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { MOCK_MARKET_INSIGHTS } from '@/lib/mock-data'
import { APP_CONFIG } from '@/lib/config'
import type { MarketInsight } from '@/types/database'

type InsightData =
  | (MarketInsight & { locked: boolean })
  | (typeof MOCK_MARKET_INSIGHTS)[number]

function InsightCard({ insight }: { insight: InsightData }) {
  const confidenceScore =
    'confidence_score' in insight
      ? insight.confidence_score
      : insight.confidenceScore
  const pct = Math.round(confidenceScore * 100)

  if (insight.locked) {
    return (
      <div className="relative bg-gray-900 border border-gray-800 rounded-xl p-5 overflow-hidden">
        {/* Blurred content */}
        <div className="blur-sm select-none pointer-events-none">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full">
              {insight.sector}
            </span>
            <span className="text-xs text-gray-500">{pct}% confiance</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            {insight.insight}
          </p>
          <p className="text-xs text-gray-600 mt-2">{insight.source}</p>
        </div>
        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60">
          <div className="text-center">
            <svg
              className="w-8 h-8 text-gray-500 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-300">
              Abonnement requis
            </span>
            <p className="text-xs text-gray-500 mt-1">
              {APP_CONFIG.pricing.monthly}€/mois pour débloquer tous les
              insights
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">
          {insight.sector}
        </span>
        <span
          className={`text-xs ${
            pct >= 85
              ? 'text-green-400'
              : pct >= 70
              ? 'text-amber-400'
              : 'text-gray-400'
          }`}
        >
          {pct}% confiance
        </span>
      </div>
      <p className="text-sm text-gray-200 leading-relaxed">{insight.insight}</p>
      <p className="text-xs text-gray-600 mt-3">{insight.source}</p>
    </div>
  )
}

export default function MarketInsightsPage() {
  const freeCount = APP_CONFIG.freePlan.insightsVisible
  const [insights, setInsights] = useState<InsightData[]>(MOCK_MARKET_INSIGHTS)
  const [totalCount, setTotalCount] = useState(MOCK_MARKET_INSIGHTS.length)

  useEffect(() => {
    async function fetchInsights() {
      const { data, error } = await supabase
        .from('market_insights')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        const rows = data as MarketInsight[]
        const withLock: InsightData[] = rows.map((item, idx) => ({
          id: item.id,
          sector: item.sector,
          insight: item.insight,
          source: item.source,
          confidence_score: item.confidence_score,
          created_at: item.created_at,
          locked: idx >= freeCount,
        }))
        setInsights(withLock)
        setTotalCount(data.length)
      }
      // si erreur ou table vide → on garde le fallback mock
    }
    fetchInsights()
  }, [freeCount])

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Market Insights</h2>
          <p className="text-sm text-gray-500 mt-1">
            Analyses cross-secteur du Global Brain
          </p>
        </div>
        <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
          {freeCount}/{totalCount} accessibles (plan gratuit)
        </span>
      </div>

      <div className="grid gap-4">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

      {/* Upgrade CTA */}
      <div className="mt-8 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/20 rounded-xl p-6 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">
          Débloquer tous les Market Insights
        </h3>
        <p className="text-sm text-gray-400 mb-4 max-w-lg mx-auto">
          Accédez aux insights de tous les secteurs et recevez des
          recommandations personnalisées basées sur les données du Global Brain.
        </p>
        <button className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors">
          Passer à Pro — {APP_CONFIG.pricing.monthly}€/mois
        </button>
      </div>
    </div>
  )
}
