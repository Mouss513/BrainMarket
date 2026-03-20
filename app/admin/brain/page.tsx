'use client'

import { useState } from 'react'
import { MOCK_BRAIN_STATUS, MOCK_RECENT_INSIGHTS } from '@/lib/mock-admin-data'

export default function AdminBrainPage() {
  const [brain, setBrain] = useState(MOCK_BRAIN_STATUS)
  const [analyzing, setAnalyzing] = useState(false)

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function forceAnalysis() {
    setAnalyzing(true)
    setTimeout(() => {
      setBrain((prev) => ({
        ...prev,
        lastAnalysis: new Date().toISOString(),
        nextAnalysis: new Date(Date.now() + 6 * 3600_000).toISOString(),
        totalInsightsGenerated: prev.totalInsightsGenerated + 3,
      }))
      setAnalyzing(false)
    }, 2000)
  }

  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold mb-6">Monitoring Market Brain</h2>

      {/* Status cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Statut</p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                brain.active ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className={`text-lg font-bold ${brain.active ? 'text-green-400' : 'text-red-400'}`}>
              {brain.active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Dernière analyse</p>
          <p className="text-sm font-medium text-white mt-2">
            {formatDateTime(brain.lastAnalysis)}
          </p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Prochaine analyse</p>
          <p className="text-sm font-medium text-white mt-2">
            {formatDateTime(brain.nextAnalysis)}
          </p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Insights générés</p>
          <p className="text-2xl font-bold text-white mt-1">
            {brain.totalInsightsGenerated}
          </p>
        </div>
      </div>

      {/* Force analysis */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={forceAnalysis}
          disabled={analyzing}
          className="px-4 py-2 bg-red-500/15 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {analyzing ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyse en cours…
            </span>
          ) : (
            'Forcer une analyse maintenant'
          )}
        </button>
        <span className="text-xs text-gray-600">
          Secteurs surveillés : {brain.sectorsMonitored.length}
        </span>
      </div>

      {/* Sectors */}
      <div className="flex flex-wrap gap-2 mb-8">
        {brain.sectorsMonitored.map((s) => (
          <span
            key={s}
            className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full"
          >
            {s}
          </span>
        ))}
      </div>

      {/* Recent insights */}
      <h3 className="text-lg font-semibold mb-4">
        10 derniers insights générés
      </h3>
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-left">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Secteur</th>
              <th className="px-5 py-3 font-medium">Insight</th>
              <th className="px-5 py-3 font-medium text-right">Confiance</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_RECENT_INSIGHTS.map((ins) => {
              const pct = Math.round(ins.confidenceScore * 100)
              return (
                <tr
                  key={ins.id}
                  className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/20 transition-colors"
                >
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {formatDateTime(ins.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
                      {ins.sector}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-300">{ins.insight}</td>
                  <td
                    className={`px-5 py-3 text-right font-medium ${
                      pct >= 85
                        ? 'text-green-400'
                        : pct >= 75
                        ? 'text-amber-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {pct}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
