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
  if (roas >= 3) return 'text-white'
  if (roas >= 1) return 'text-[#e8d5b7]'
  return 'text-red-400'
}

function roasDot(roas: number) {
  if (roas >= 3) return 'bg-white'
  if (roas >= 1) return 'bg-[#e8d5b7]'
  return 'bg-red-400'
}

function statusIndicator(status: string) {
  const s = status.toLowerCase()
  if (s === 'active')
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-white/50">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Active
      </span>
    )
  if (s === 'paused')
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-white/50">
        <span className="w-1.5 h-1.5 rounded-full bg-[#e8d5b7]" />
        En pause
      </span>
    )
  if (s === 'draft')
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-white/30">
        <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
        Brouillon
      </span>
    )
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-white/30">
      <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
      {status}
    </span>
  )
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-[28px] text-white">Campagnes</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[13px] text-white/50">
              {campaigns.length} campagne{campaigns.length > 1 ? 's' : ''}
            </span>
            {!isRealData && (
              <span className="text-[10px] tracking-widest uppercase text-white/30 bg-white/[0.06] px-2.5 py-0.5 rounded-full">Donnees demo</span>
            )}
            {syncedAt && (
              <span className="text-[11px] text-white/30">
                Synchro : {new Date(syncedAt).toLocaleString('fr-FR')}
              </span>
            )}
          </div>
        </div>
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
              Synchronisation…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Synchroniser Meta
            </>
          )}
        </button>
      </div>

      {syncError && (
        <div className="mb-4 px-4 py-3 bg-red-500/5 border border-red-500/10 rounded-2xl">
          <p className="text-[13px] text-red-400 leading-[1.6]">Erreur sync : {syncError}</p>
        </div>
      )}

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-sm">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3.5 text-[11px] uppercase tracking-widest text-white/40 font-normal">Campagne</th>
              <th className="text-left px-5 py-3.5 text-[11px] uppercase tracking-widest text-white/40 font-normal">Plateforme</th>
              <th className="text-right px-5 py-3.5 text-[11px] uppercase tracking-widest text-white/40 font-normal">Depense</th>
              <th className="text-right px-5 py-3.5 text-[11px] uppercase tracking-widest text-white/40 font-normal">ROAS</th>
              <th className="text-right px-5 py-3.5 text-[11px] uppercase tracking-widest text-white/40 font-normal">CTR</th>
              <th className="text-right px-5 py-3.5 text-[11px] uppercase tracking-widest text-white/40 font-normal">CPM</th>
              <th className="text-center px-5 py-3.5 text-[11px] uppercase tracking-widest text-white/40 font-normal">Statut</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => (
              <tr
                key={c.id}
                className={`border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors ${
                  i % 2 === 1 ? 'bg-white/[0.01]' : ''
                }`}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${roasDot(c.roas)}`} />
                    <span className="text-white">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-white/50">{c.platform}</td>
                <td className="px-5 py-4 text-right text-white nums">
                  {c.budget.toLocaleString('fr-FR')} €
                </td>
                <td className={`px-5 py-4 text-right font-light text-lg nums ${roasColor(c.roas)}`}>
                  {c.status === 'draft' ? '—' : `${c.roas}x`}
                </td>
                <td className="px-5 py-4 text-right text-white/50 nums">
                  {c.status === 'draft' ? '—' : `${c.ctr}%`}
                </td>
                <td className="px-5 py-4 text-right text-white/50 nums">
                  {c.status === 'draft' ? '—' : `${c.cpm} €`}
                </td>
                <td className="px-5 py-4 text-center">{statusIndicator(c.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-4 text-[11px] text-white/30">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          ROAS &gt; 3x
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e8d5b7]" />
          ROAS 1-3x
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          ROAS &lt; 1x
        </div>
      </div>
    </div>
  )
}
