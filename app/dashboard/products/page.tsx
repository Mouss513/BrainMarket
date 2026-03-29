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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-[28px] text-white">Produits</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[13px] text-white/50">{products.length} produits</span>
            {!isRealData && (
              <span className="text-[10px] tracking-widest uppercase text-white/30 bg-white/[0.06] px-2.5 py-0.5 rounded-full">Donnees demo</span>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-widest text-white/40 mb-3">Revenus totaux</p>
          <p className="text-3xl font-light text-white nums">{totalRevenue.toLocaleString('fr-FR')} <span className="text-base text-white/30">€</span></p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-widest text-white/40 mb-3">Unites vendues</p>
          <p className="text-3xl font-light text-white nums">{totalUnits.toLocaleString('fr-FR')}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-widest text-white/40 mb-3">Prix moyen / unite</p>
          <p className="text-3xl font-light text-white nums">
            {totalUnits > 0 ? Math.round(totalRevenue / totalUnits).toLocaleString('fr-FR') : '—'} <span className="text-base text-white/30">€</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((p, i) => {
          const revenueShare = totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0

          return (
            <div
              key={i}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-[14px] font-medium text-white tracking-[0.02em]">{p.name}</h3>
                  <span className="text-[11px] text-white/30">{p.category}</span>
                </div>
                <span className="text-[10px] tracking-widest uppercase bg-white/[0.06] text-[#e8d5b7] px-2.5 py-0.5 rounded-full">
                  {revenueShare}% du CA
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-white/30">Revenus</p>
                  <p className="text-xl font-light text-white mt-1 nums">
                    {p.revenue.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-white/30">Unites vendues</p>
                  <p className="text-xl font-light text-white mt-1 nums">
                    {p.unitsSold}
                  </p>
                </div>
              </div>

              {/* Revenue bar */}
              <div className="w-full bg-white/[0.06] rounded-full h-1">
                <div
                  className="bg-white h-1 rounded-full transition-all duration-200"
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
