'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { MOCK_CAMPAIGNS } from '@/lib/mock-data'

interface MetaCampaign {
  id: string
  name: string
  status: string
  spend: number
  impressions: number
  clicks: number
  reach: number
  ctr: number
  cpm: number
  roas: number
}

interface DisplayCampaign {
  id: string
  name: string
  platform: string
  budget: number
  roas: number
  ctr: number
  cpm: number
  status: string
}

function roasColor(roas: number) {
  if (roas >= 3) return 'text-green-400'
  if (roas >= 1) return 'text-amber-400'
  return 'text-red-400'
}

function roasDot(roas: number) {
  if (roas >= 3) return 'bg-green-500'
  if (roas >= 1) return 'bg-amber-500'
  return 'bg-red-500'
}

function statusBadge(status: string) {
  const s = status.toLowerCase()
  if (s === 'active')
    return <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Active</span>
  if (s === 'paused')
    return <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">En pause</span>
  if (s === 'draft')
    return <span className="text-xs bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full">Brouillon</span>
  return <span className="text-xs bg-gray-700/50 text-gray-500 px-2 py-0.5 rounded-full">{status}</span>
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<DisplayCampaign[]>(
    MOCK_CAMPAIGNS.map(c => ({ ...c, budget: c.budget }))
  )
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncedAt, setSyncedAt] = useState<string | null>(null)
  const [isRealData, setIsRealData] = useState(false)

  const fetchMetaData = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('meta_data')
      .select('*')
      .order('synced_at', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      const row = data[0] as Record<string, unknown>
      const metaCampaigns = row.campaigns as MetaCampaign[]
      if (metaCampaigns && metaCampaigns.length > 0) {
        setCampaigns(
          metaCampaigns.map(c => ({
            id: c.id,
            name: c.name,
            platform: 'Meta Ads',
            budget: c.spend,
            roas: c.roas,
            ctr: c.ctr,
            cpm: c.cpm,
            status: c.status,
          }))
        )
        setSyncedAt(row.synced_at as string)
        setIsRealData(true)
      }
    }
  }, [])

  useEffect(() => {
    fetchMetaData()
  }, [fetchMetaData])

  async function handleSync() {
    setSyncing(true)
    setSyncError(null)
    try {
      const res = await fetch('/api/meta/sync', { method: 'POST' })
      if (res.ok) {
        await fetchMetaData()
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

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Campagnes</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-500">
              {campaigns.length} campagne{campaigns.length > 1 ? 's' : ''}
            </span>
            {!isRealData && (
              <span className="text-xs bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full">Données démo</span>
            )}
            {syncedAt && (
              <span className="text-xs text-gray-500">
                Synchro : {new Date(syncedAt).toLocaleString('fr-FR')}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {syncing ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Synchronisation…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Synchroniser Meta
            </>
          )}
        </button>
      </div>

      {syncError && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">Erreur sync : {syncError}</p>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-left">
              <th className="px-5 py-3 font-medium">Campagne</th>
              <th className="px-5 py-3 font-medium">Plateforme</th>
              <th className="px-5 py-3 font-medium text-right">Dépense</th>
              <th className="px-5 py-3 font-medium text-right">ROAS</th>
              <th className="px-5 py-3 font-medium text-right">CTR</th>
              <th className="px-5 py-3 font-medium text-right">CPM</th>
              <th className="px-5 py-3 font-medium text-center">Statut</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr
                key={c.id}
                className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${roasDot(c.roas)}`} />
                    <span className="font-medium text-white">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-400">{c.platform}</td>
                <td className="px-5 py-4 text-right text-white">
                  {c.budget.toLocaleString('fr-FR')} €
                </td>
                <td className={`px-5 py-4 text-right font-semibold ${roasColor(c.roas)}`}>
                  {c.status === 'draft' ? '—' : `${c.roas}x`}
                </td>
                <td className="px-5 py-4 text-right text-gray-300">
                  {c.status === 'draft' ? '—' : `${c.ctr}%`}
                </td>
                <td className="px-5 py-4 text-right text-gray-300">
                  {c.status === 'draft' ? '—' : `${c.cpm} €`}
                </td>
                <td className="px-5 py-4 text-center">{statusBadge(c.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          ROAS &gt; 3x
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          ROAS 1-3x
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          ROAS &lt; 1x
        </div>
      </div>
    </div>
  )
}
