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
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.06]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] tracking-widest uppercase bg-white/[0.06] text-[#e8d5b7] px-2.5 py-0.5 rounded-full">
          {insight.sector}
        </span>
        <span
          className={`text-[11px] nums ${
            pct >= 85
              ? 'text-white'
              : pct >= 70
              ? 'text-[#e8d5b7]'
              : 'text-white/50'
          }`}
        >
          {pct}% confiance
        </span>
      </div>
      <p className="text-[13px] text-white/70 leading-[1.6]">{insight.insight}</p>
      <p className="text-[11px] text-white/30 mt-3">{insight.source}</p>
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
          <h2 className="font-display text-[28px] text-white">Market Insights</h2>
          <p className="text-[13px] text-white/50 mt-2 leading-[1.6]">
            Analyses cross-secteur du Global Brain
          </p>
        </div>
        <span className="text-[11px] text-white/30 bg-white/[0.06] px-3 py-1.5 rounded-full">
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
