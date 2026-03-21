'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  MOCK_METRICS,
  MOCK_ROAS_HISTORY,
  MOCK_RECOMMENDATIONS,
} from '@/lib/mock-data'
import type { BrainRecommendation } from '@/types/database'

function MetricCard({
  label,
  value,
  prefix,
  suffix,
}: {
  label: string
  value: string | number
  prefix?: string
  suffix?: string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold mt-1">
        {prefix}
        {value}
        {suffix}
      </p>
    </div>
  )
}

function RoasChart() {
  const data = MOCK_ROAS_HISTORY
  const max = Math.max(...data.map((d) => d.roas))
  const min = Math.min(...data.map((d) => d.roas))
  const range = max - min || 1

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-400 mb-4">
        Évolution ROAS — 30 jours
      </h3>
      <div className="flex items-end gap-[3px] h-40">
        {data.map((d, i) => {
          const height = ((d.roas - min + 0.3) / (range + 0.3)) * 100
          const isGood = d.roas >= 3
          return (
            <div
              key={i}
              className="group relative flex-1"
              style={{ height: '100%' }}
            >
              <div
                className={`absolute bottom-0 w-full rounded-sm transition-colors ${
                  isGood
                    ? 'bg-violet-600 group-hover:bg-violet-500'
                    : 'bg-gray-700 group-hover:bg-gray-600'
                }`}
                style={{ height: `${height}%` }}
              />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                {d.day}: {d.roas}x
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        <span>{data[0].day}</span>
        <span>{data[data.length - 1].day}</span>
      </div>
    </div>
  )
}

type RecData = BrainRecommendation | (typeof MOCK_RECOMMENDATIONS)[number]

function RecommendationCard({ rec }: { rec: RecData }) {
  const confidenceScore =
    'confidence_score' in rec ? rec.confidence_score : rec.confidenceScore
  const pct = Math.round(confidenceScore * 100)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {rec.applied && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                Appliquée
              </span>
            )}
          </div>
          <h4 className="text-sm font-medium text-white">{rec.title}</h4>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            {rec.description}
          </p>
        </div>
        <div className="flex-shrink-0 text-center">
          <div
            className={`text-lg font-bold ${
              pct >= 85
                ? 'text-green-400'
                : pct >= 70
                ? 'text-amber-400'
                : 'text-gray-400'
            }`}
          >
            {pct}%
          </div>
          <div className="text-xs text-gray-500">confiance</div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardOverview() {
  const m = MOCK_METRICS
  const [recommendations, setRecommendations] = useState<RecData[]>(
    MOCK_RECOMMENDATIONS
  )
  const [refreshing, setRefreshing] = useState(false)

  const fetchRecommendations = useCallback(async () => {
    const { data, error } = await supabase
      .from('brain_recommendations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error && data && data.length > 0) {
      setRecommendations(data)
    }
    // si erreur ou table vide → on garde les données actuelles (mock ou dernière fetch)
  }, [])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await fetch('/api/brain/refresh', { method: 'POST' })
      await fetchRecommendations()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="max-w-6xl">
      <h2 className="text-2xl font-bold mb-6">Overview</h2>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard label="ROAS Global" value={`${m.roasGlobal}x`} />
        <MetricCard
          label="Budget dépensé"
          value={m.budgetTotal.toLocaleString('fr-FR')}
          suffix=" €"
        />
        <MetricCard
          label="Revenus générés"
          value={m.revenusGeneres.toLocaleString('fr-FR')}
          suffix=" €"
        />
        <MetricCard label="CPM Moyen" value={`${m.cpmMoyen} €`} />
      </div>

      {/* Chart */}
      <div className="mb-8">
        <RoasChart />
      </div>

      {/* Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">
              Recommandations du Market Brain
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Actif
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {refreshing ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Analyse en cours…
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Rafraîchir le Brain
              </>
            )}
          </button>
        </div>
        <div className="grid gap-3">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      </div>
    </div>
  )
}
