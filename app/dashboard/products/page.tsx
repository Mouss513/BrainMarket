'use client'

import { MOCK_PRODUCTS, MOCK_CAMPAIGNS } from '@/lib/mock-data'

export default function ProductsPage() {
  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Produits</h2>
        <span className="text-sm text-gray-500">
          {MOCK_PRODUCTS.length} produits
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {MOCK_PRODUCTS.map((p) => {
          const campaign = MOCK_CAMPAIGNS.find((c) => c.id === p.campaignId)

          return (
            <div
              key={p.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-white">{p.name}</h3>
                  <span className="text-xs text-gray-500">{p.category}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Revenus</p>
                  <p className="text-lg font-semibold text-white">
                    {p.revenue.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Unités vendues</p>
                  <p className="text-lg font-semibold text-white">
                    {p.unitsSold}
                  </p>
                </div>
              </div>

              {campaign ? (
                <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
                  <svg
                    className="w-3.5 h-3.5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                    />
                  </svg>
                  <span className="text-xs text-gray-400">
                    {campaign.name}
                  </span>
                  <span
                    className={`text-xs font-medium ml-auto ${
                      campaign.roas >= 3
                        ? 'text-green-400'
                        : campaign.roas >= 1
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {campaign.status === 'draft'
                      ? 'Brouillon'
                      : `${campaign.roas}x ROAS`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
                  <span className="text-xs text-gray-600">
                    Aucune campagne liée
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
