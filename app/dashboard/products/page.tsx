'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { MOCK_PRODUCTS } from '@/lib/mock-data'

interface Product {
  name: string
  category: string
  revenue: number
  unitsSold: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(
    MOCK_PRODUCTS.map(p => ({ name: p.name, category: p.category, revenue: p.revenue, unitsSold: p.unitsSold }))
  )
  const [isRealData, setIsRealData] = useState(false)

  const fetchProducts = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('shopify_data')
      .select('*')
      .order('synced_at', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      const row = data[0] as Record<string, unknown>
      const topProducts = row.top_products as { title: string; units_sold: number; revenue: number }[]
      if (topProducts && topProducts.length > 0) {
        setProducts(topProducts.map(p => ({
          name: p.title,
          category: 'Shopify',
          revenue: p.revenue,
          unitsSold: p.units_sold,
        })))
        setIsRealData(true)
      }
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0)
  const totalUnits = products.reduce((sum, p) => sum + p.unitsSold, 0)

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Produits</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-500">{products.length} produits</span>
            {!isRealData && (
              <span className="text-xs bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full">Données démo</span>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Revenus totaux</p>
          <p className="text-2xl font-bold mt-1">{totalRevenue.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Unités vendues</p>
          <p className="text-2xl font-bold mt-1">{totalUnits.toLocaleString('fr-FR')}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Prix moyen / unité</p>
          <p className="text-2xl font-bold mt-1">
            {totalUnits > 0 ? Math.round(totalRevenue / totalUnits).toLocaleString('fr-FR') : '—'} €
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((p, i) => {
          const revenueShare = totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0

          return (
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-white">{p.name}</h3>
                  <span className="text-xs text-gray-500">{p.category}</span>
                </div>
                <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">
                  {revenueShare}% du CA
                </span>
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

              {/* Revenue bar */}
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div
                  className="bg-violet-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${revenueShare}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
