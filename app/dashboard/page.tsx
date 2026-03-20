'use client'

import {
  MOCK_METRICS,
  MOCK_ROAS_HISTORY,
  MOCK_RECOMMENDATIONS,
} from '@/lib/mock-data'

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

function RecommendationCard({
  rec,
}: {
  rec: (typeof MOCK_RECOMMENDATIONS)[number]
}) {
  const pct = Math.round(rec.confidenceScore * 100)

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
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-semibold">Recommandations du Market Brain</h3>
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Actif
          </div>
        </div>
        <div className="grid gap-3">
          {MOCK_RECOMMENDATIONS.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      </div>
    </div>
  )
}
