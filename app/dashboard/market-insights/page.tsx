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
      <div className="relative bg-[#111] border border-[#1e1e1e] rounded-lg p-5 overflow-hidden">
        {/* Blurred content */}
        <div className="blur-sm select-none pointer-events-none">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] uppercase tracking-[0.08em] text-[#555] bg-[#1e1e1e] px-2 py-0.5 rounded">
              {insight.sector}
            </span>
            <span className="text-[11px] text-[#555]">{pct}% confiance</span>
          </div>
          <p className="text-[13px] text-[#888] leading-relaxed">
            {insight.insight}
          </p>
          <p className="text-[11px] text-[#555] mt-3">{insight.source}</p>
        </div>
        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-[#111]/60">
          <div className="text-center">
            <svg
              className="w-7 h-7 text-[#555] mx-auto mb-2"
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
            <span className="text-[13px] text-[#888]">
              Abonnement requis
            </span>
            <p className="text-[11px] text-[#555] mt-1">
              {APP_CONFIG.pricing.monthly}€/mois pour debloquer tous les
              insights
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] uppercase tracking-[0.08em] bg-[#c8a97e]/10 text-[#c8a97e] px-2 py-0.5 rounded">
          {insight.sector}
        </span>
        <span
          className={`text-[11px] ${
            pct >= 85
              ? 'text-green-400'
              : pct >= 70
              ? 'text-[#c8a97e]'
              : 'text-[#888]'
          }`}
        >
          {pct}% confiance
        </span>
      </div>
      <p className="text-[13px] text-[#ccc] leading-relaxed">{insight.insight}</p>
      <p className="text-[11px] text-[#555] mt-3">{insight.source}</p>
    </div>
  )
}

export default function MarketInsightsPage() {
  const freeCount = APP_CONFIG.freePlan.insightsVisible
  const [insights, setInsights] = useState<InsightData[]>(MOCK_MARKET_INSIGHTS)
  const [totalCount, setTotalCount] = useState(MOCK_MARKET_INSIGHTS.length)

  useEffect(() => {
    async function fetchInsights() {
      if (!supabase) return
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
    }
    fetchInsights()
  }, [freeCount])

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-white">Market Insights</h2>
          <p className="text-[13px] text-[#888] mt-2">
            Analyses cross-secteur du Global Brain
          </p>
        </div>
        <span className="text-[11px] text-[#555] bg-[#1e1e1e] px-3 py-1.5 rounded">
          {freeCount}/{totalCount} accessibles (plan gratuit)
        </span>
      </div>

      <div className="grid gap-4">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

      {/* Upgrade CTA */}
      <div className="mt-8 bg-[#111] border border-[#c8a97e]/20 rounded-lg p-8 text-center">
        <h3 className="text-lg font-light tracking-wide text-white mb-2">
          Debloquer tous les Market Insights
        </h3>
        <p className="text-[13px] text-[#888] mb-5 max-w-lg mx-auto">
          Accedez aux insights de tous les secteurs et recevez des
          recommandations personnalisees basees sur les donnees du Global Brain.
        </p>
        <button className="px-6 py-2.5 bg-[#c8a97e] hover:bg-[#b89a6f] text-black text-[13px] tracking-wide font-medium rounded-lg transition-colors">
          Passer a Pro — {APP_CONFIG.pricing.monthly}€/mois
        </button>
      </div>
    </div>
  )
}
