'use client'

import { MOCK_CAMPAIGNS } from '@/lib/mock-data'

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
  if (status === 'active')
    return (
      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
        Active
      </span>
    )
  if (status === 'draft')
    return (
      <span className="text-xs bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full">
        Brouillon
      </span>
    )
  if (status === 'paused')
    return (
      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
        En pause
      </span>
    )
  return (
    <span className="text-xs bg-gray-700/50 text-gray-500 px-2 py-0.5 rounded-full">
      {status}
    </span>
  )
}

export default function CampaignsPage() {
  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Campagnes</h2>
        <span className="text-sm text-gray-500">
          {MOCK_CAMPAIGNS.length} campagnes
        </span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-left">
              <th className="px-5 py-3 font-medium">Campagne</th>
              <th className="px-5 py-3 font-medium">Plateforme</th>
              <th className="px-5 py-3 font-medium text-right">Budget</th>
              <th className="px-5 py-3 font-medium text-right">ROAS</th>
              <th className="px-5 py-3 font-medium text-right">CTR</th>
              <th className="px-5 py-3 font-medium text-right">CPM</th>
              <th className="px-5 py-3 font-medium text-center">Statut</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CAMPAIGNS.map((c) => (
              <tr
                key={c.id}
                className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${roasDot(c.roas)}`}
                    />
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
