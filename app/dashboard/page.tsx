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
  suffix,
}: {
  label: string
  value: string | number
  prefix?: string
  suffix?: string
}) {
  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
      <p className="text-[11px] tracking-[0.02em] text-[#888] mb-3">{label}</p>
      <p className="text-3xl font-light text-white nums">
        {value}
        {suffix && <span className="text-base text-[#555] ml-1">{suffix}</span>}
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
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
      <h3 className="text-[11px] tracking-[0.02em] text-[#888] mb-6">
        Evolution ROAS — 30 jours
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
                    ? 'bg-[#c8a97e] group-hover:bg-[#d4b88a]'
                    : 'bg-[#2a2a2a] group-hover:bg-[#3a3a3a]'
                }`}
                style={{ height: `${height}%` }}
              />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#1e1e1e] text-[11px] text-white px-2 py-1 rounded-lg whitespace-nowrap z-10 nums">
                {d.day}: {d.roas}x
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-3 text-[11px] text-[#555]">
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
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {rec.applied && (
              <span className="text-[10px] tracking-[0.02em] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-lg">
                Appliquee
              </span>
            )}
          </div>
          <h4 className="text-[14px] font-medium text-white tracking-[0.02em]">{rec.title}</h4>
          <p className="text-[13px] text-[#888] mt-1.5 leading-[1.6]">
            {rec.description}
          </p>
        </div>
        <div className="flex-shrink-0 text-center">
          <div
            className={`text-2xl font-light nums ${
              pct >= 85
                ? 'text-green-400'
                : pct >= 70
                ? 'text-[#c8a97e]'
                : 'text-[#888]'
            }`}
          >
            {pct}%
          </div>
          <div className="text-[10px] tracking-[0.02em] text-[#555]">confiance</div>
        </div>
      </div>
    </div>
  )
}

interface ShopifyMetrics {
  revenue_30d: number
  orders_count: number
  average_order_value: number
  top_products: { title: string; units_sold: number; revenue: number }[]
  synced_at: string | null
}

export default function DashboardOverview() {
  const [metrics, setMetrics] = useState<{
    roasGlobal: number
    budgetTotal: number
    revenusGeneres: number
    cpmMoyen: number
  }>(MOCK_METRICS)
  const [shopifyData, setShopifyData] = useState<ShopifyMetrics | null>(null)
  const [recommendations, setRecommendations] = useState<RecData[]>(
    MOCK_RECOMMENDATIONS
  )
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [estimated, setEstimated] = useState(false)

  const fetchShopifyData = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('shopify_data')
      .select('*')
      .order('synced_at', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      const row = data[0] as Record<string, unknown>
      const sd: ShopifyMetrics = {
        revenue_30d: row.revenue_30d as number,
        orders_count: row.orders_count as number,
        average_order_value: row.average_order_value as number,
        top_products: row.top_products as ShopifyMetrics['top_products'],
        synced_at: row.synced_at as string,
      }
      setShopifyData(sd)
      setMetrics(prev => ({
        ...prev,
        revenusGeneres: sd.revenue_30d,
      }))
    }
  }, [])

  const fetchMetaData = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('meta_data')
      .select('*')
      .order('synced_at', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      const row = data[0] as Record<string, unknown>
      const totalSpend = row.total_spend as number
      const avgCpm = row.avg_cpm as number
      setMetrics(prev => {
        const roas = totalSpend > 0 ? Math.round((prev.revenusGeneres / totalSpend) * 100) / 100 : prev.roasGlobal
        return {
          ...prev,
          budgetTotal: totalSpend,
          cpmMoyen: avgCpm,
          roasGlobal: roas,
        }
      })
    }
  }, [])

  const fetchRecommendations = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('brain_recommendations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[fetchRecommendations] Supabase error:', error)
      return
    }
    if (data && data.length > 0) {
      setRecommendations(data)
    }
  }, [])

  useEffect(() => {
    fetchRecommendations()
    fetchShopifyData().then(() => fetchMetaData())
  }, [fetchRecommendations, fetchShopifyData, fetchMetaData])

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await fetch('/api/brain/refresh', { method: 'POST' })
      await fetchRecommendations()
    } finally {
      setRefreshing(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setSyncError(null)
    try {
      const res = await fetch('/api/shopify/sync', { method: 'POST' })
      if (res.ok) {
        const body = await res.json().catch(() => ({}))
        setEstimated(!!body.estimated)
        await fetchShopifyData()
      } else {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        setSyncError(`${body.error}${body.details ? ` — ${body.details}` : ''}`)
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setSyncing(false)
    }
  }

  const m = metrics

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[22px] font-medium tracking-[0.02em] text-white">Overview</h2>
        {shopifyData?.synced_at && (
          <div className="flex items-center gap-3">
            {estimated && (
              <span className="text-[10px] tracking-[0.02em] bg-[#c8a97e]/10 text-[#c8a97e] px-2 py-0.5 rounded-lg">Donnees estimees</span>
            )}
            <span className="text-[11px] text-[#555]">
              Synchro : {new Date(shopifyData.synced_at).toLocaleString('fr-FR')}
            </span>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Revenus 30j" value={m.revenusGeneres.toLocaleString('fr-FR')} suffix="€" />
        <MetricCard label="Budget pub 30j" value={m.budgetTotal.toLocaleString('fr-FR')} suffix="€" />
        <MetricCard label="Commandes 30j" value={shopifyData?.orders_count ?? '—'} />
        <MetricCard label="ROAS Global" value={`${m.roasGlobal}x`} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Panier moyen" value={shopifyData ? shopifyData.average_order_value.toLocaleString('fr-FR') : '—'} suffix="€" />
        <MetricCard label="CPM Moyen" value={`${m.cpmMoyen}`} suffix="€" />
      </div>

      {/* Sync button */}
      {syncError && (
        <div className="mb-4 px-4 py-3 bg-red-500/5 border border-red-500/10 rounded-xl">
          <p className="text-[13px] text-red-400 leading-[1.6]">Erreur sync : {syncError}</p>
        </div>
      )}
      <div className="mb-8">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn-glass"
        >
          {syncing ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Synchronisation Shopify…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Synchroniser Shopify
            </>
          )}
        </button>
      </div>

      {/* Top Products from Shopify */}
      {shopifyData && shopifyData.top_products.length > 0 && (
        <div className="mb-8">
          <h3 className="text-[11px] tracking-[0.02em] text-[#888] mb-4">Top 5 produits (30 jours)</h3>
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  <th className="text-left px-5 py-3 text-[11px] tracking-[0.02em] text-[#888] font-normal">Produit</th>
                  <th className="text-right px-5 py-3 text-[11px] tracking-[0.02em] text-[#888] font-normal">Ventes</th>
                  <th className="text-right px-5 py-3 text-[11px] tracking-[0.02em] text-[#888] font-normal">Revenus</th>
                </tr>
              </thead>
              <tbody>
                {shopifyData.top_products.map((p, i) => (
                  <tr key={i} className="border-b border-[#1e1e1e]/50 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-white">{p.title}</td>
                    <td className="px-5 py-3.5 text-right text-[#888] nums">{p.units_sold}</td>
                    <td className="px-5 py-3.5 text-right text-[#888] nums">{p.revenue.toLocaleString('fr-FR')} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="mb-8">
        <RoasChart />
      </div>

      {/* Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h3 className="text-[14px] font-medium tracking-[0.02em] text-white">
              Recommandations du Market Brain
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] text-green-400">Actif</span>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-primary"
          >
            {refreshing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Analyse en cours…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Rafraichir le Brain
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
