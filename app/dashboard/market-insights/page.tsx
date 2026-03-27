'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { MOCK_MARKET_INSIGHTS } from '@/lib/mock-data'
import type { MarketInsight } from '@/types/database'

type InsightData =
  | MarketInsight
  | (typeof MOCK_MARKET_INSIGHTS)[number]

function InsightCard({ insight }: { insight: InsightData }) {
  const confidenceScore =
    'confidence_score' in insight
      ? insight.confidence_score
      : insight.confidenceScore
  const pct = Math.round(confidenceScore * 100)

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
  const [insights, setInsights] = useState<InsightData[]>(MOCK_MARKET_INSIGHTS)

  useEffect(() => {
    async function fetchInsights() {
      if (!supabase) return
      const { data, error } = await supabase
        .from('market_insights')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        setInsights(data as MarketInsight[])
      }
    }
    fetchInsights()
  }, [])

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
          {insights.length} insights
        </span>
      </div>

      <div className="grid gap-4">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  )
}
