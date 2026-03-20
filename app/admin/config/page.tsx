'use client'

import { useState } from 'react'
import { APP_CONFIG } from '@/lib/config'
import { MOCK_BRAIN_STATUS } from '@/lib/mock-admin-data'

export default function AdminConfigPage() {
  const [monthlyPrice, setMonthlyPrice] = useState<number>(APP_CONFIG.pricing.monthly)
  const [commission, setCommission] = useState<number>(APP_CONFIG.pricing.commissionPercent)
  const [sectors, setSectors] = useState<string[]>([...MOCK_BRAIN_STATUS.sectorsMonitored])
  const [newSector, setNewSector] = useState('')
  const [saved, setSaved] = useState(false)

  function addSector() {
    const trimmed = newSector.trim()
    if (trimmed && !sectors.includes(trimmed)) {
      setSectors((prev) => [...prev, trimmed])
      setNewSector('')
    }
  }

  function removeSector(sector: string) {
    setSectors((prev) => prev.filter((s) => s !== sector))
  }

  function handleSave() {
    // In production this would call an API to persist config
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Configuration globale</h2>

      <div className="space-y-6">
        {/* Pricing */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Pricing
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Prix abonnement mensuel (€)
              </label>
              <input
                type="number"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Commission sur ventes (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={commission}
                onChange={(e) => setCommission(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-xs text-gray-600">
            <span>
              Actuel : {APP_CONFIG.pricing.monthly}€/mois — {APP_CONFIG.pricing.commissionPercent}%
              commission
            </span>
          </div>
        </div>

        {/* Sectors */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Secteurs surveillés par le Global Brain
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {sectors.map((s) => (
              <span
                key={s}
                className="flex items-center gap-1.5 text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-full"
              >
                {s}
                <button
                  onClick={() => removeSector(s)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSector}
              onChange={(e) => setNewSector(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSector()}
              placeholder="Ajouter un secteur…"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50"
            />
            <button
              onClick={addSector}
              className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              Ajouter
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Résumé des modifications
          </h3>
          <div className="text-sm text-gray-400 space-y-1">
            <p>
              Prix mensuel :{' '}
              <span className={monthlyPrice !== APP_CONFIG.pricing.monthly ? 'text-amber-400' : 'text-gray-300'}>
                {monthlyPrice}€
              </span>
              {monthlyPrice !== APP_CONFIG.pricing.monthly && (
                <span className="text-gray-600 ml-2">(était {APP_CONFIG.pricing.monthly}€)</span>
              )}
            </p>
            <p>
              Commission :{' '}
              <span className={commission !== APP_CONFIG.pricing.commissionPercent ? 'text-amber-400' : 'text-gray-300'}>
                {commission}%
              </span>
              {commission !== APP_CONFIG.pricing.commissionPercent && (
                <span className="text-gray-600 ml-2">(était {APP_CONFIG.pricing.commissionPercent}%)</span>
              )}
            </p>
            <p>
              Secteurs : <span className="text-gray-300">{sectors.length}</span>
            </p>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-red-500/15 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/25 transition-colors"
          >
            Sauvegarder la configuration
          </button>
          {saved && (
            <span className="text-sm text-green-400 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Configuration sauvegardée
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
