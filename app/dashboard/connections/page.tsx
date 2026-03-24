'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type ConnectionStatus = 'disconnected' | 'connected' | 'error'

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const styles = {
    disconnected: 'bg-gray-700/50 text-gray-400',
    connected: 'bg-green-500/20 text-green-400',
    error: 'bg-red-500/20 text-red-400',
  }
  const labels = {
    disconnected: 'Non connecté',
    connected: 'Connecté',
    error: 'Erreur',
  }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function ShopifyCard({
  initialStatus,
  initialShopDomain,
}: {
  initialStatus: ConnectionStatus
  initialShopDomain: string
}) {
  const [status, setStatus] = useState<ConnectionStatus>(initialStatus)
  const [shopUrl, setShopUrl] = useState(initialShopDomain)
  const [loading, setLoading] = useState(false)

  function handleConnect() {
    if (!shopUrl.trim()) return
    setLoading(true)
    // Redirige vers l'API OAuth Shopify
    const domain = shopUrl
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
    window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(domain)}`
  }

  function handleDisconnect() {
    setStatus('disconnected')
    setShopUrl('')
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#96bf48]/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-[#96bf48]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.34 3.38c-.09-.04-.18-.01-.24.05-.06.06-1.16 1.41-1.28 1.55-.29-.7-.8-1.35-1.7-1.35h-.08c-.25-.3-.56-.45-.84-.45-2.08 0-3.08 2.6-3.39 3.92-.81.25-1.38.43-1.45.45-.45.14-.46.15-.52.58-.05.32-1.22 9.38-1.22 9.38L12.23 19l5.42-1.17S15.44 3.46 15.43 3.42c0-.01-.04-.03-.09-.04zm-2.72 1.87c-.27.08-.57.18-.89.27 0-.06 0-.13-.01-.2-.18-.92-.64-1.37-1.13-1.53.46-.06.84.31 1.06.71.03.06.07.11.1.17-.04.19-.08.38-.13.58zm-1.71.53c-.6.18-1.25.39-1.25.39s.41-1.58 1.22-2.11c.3-.2.68-.28.92-.1-.45.4-.72 1.01-.89 1.82zm.71-2.34c.15 0 .28.05.39.14-.86.41-1.35 1.47-1.53 2.35l-1.01.31c.35-1.19 1.15-2.8 2.15-2.8z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Shopify</h3>
            <p className="text-xs text-gray-500">Synchronise tes produits et ventes</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {status === 'connected' ? (
        <div>
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gray-800/50 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-gray-300">{shopUrl}</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-sm text-gray-500 hover:text-red-400 transition-colors"
          >
            Déconnecter
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="mon-shop.myshopify.com"
            value={shopUrl}
            onChange={(e) => setShopUrl(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
          <button
            onClick={handleConnect}
            disabled={loading || !shopUrl.trim()}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            {loading ? 'Redirection...' : 'Connecter'}
          </button>
        </div>
      )}
    </div>
  )
}

function MetaAdsCard() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [loading, setLoading] = useState(false)

  function handleConnect() {
    setLoading(true)
    // Simulation — Meta OAuth sera implémenté plus tard
    setTimeout(() => {
      setStatus('connected')
      setLoading(false)
    }, 2000)
  }

  function handleDisconnect() {
    setStatus('disconnected')
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Meta Ads</h3>
            <p className="text-xs text-gray-500">Importe tes campagnes Facebook & Instagram</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {status === 'connected' ? (
        <div>
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gray-800/50 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-gray-300">Compte Meta connecté</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-sm text-gray-500 hover:text-red-400 transition-colors"
          >
            Déconnecter
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Connexion...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              Connecter avec Facebook
            </>
          )}
        </button>
      )}
    </div>
  )
}

export default function ConnectionsPage() {
  const searchParams = useSearchParams()
  const [shopifyStatus, setShopifyStatus] = useState<ConnectionStatus>('disconnected')
  const [shopifyDomain, setShopifyDomain] = useState('')

  const fetchConnections = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('connections')
      .select('*')
      .eq('platform', 'shopify')
      .eq('status', 'active')
      .limit(1)

    if (data && data.length > 0) {
      setShopifyStatus('connected')
      setShopifyDomain((data[0] as Record<string, unknown>).shop_domain as string || '')
    }
  }, [])

  useEffect(() => {
    // Check URL params for OAuth callback result
    const shopifyParam = searchParams.get('shopify')
    if (shopifyParam === 'connected') {
      setShopifyStatus('connected')
    } else if (shopifyParam === 'error') {
      setShopifyStatus('error')
    }

    fetchConnections()
  }, [searchParams, fetchConnections])

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Connexions</h2>
        <p className="text-sm text-gray-500 mt-1">
          Connecte tes plateformes pour alimenter le Market Brain avec tes vraies données.
        </p>
      </div>

      {searchParams.get('shopify') === 'error' && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">
            Erreur lors de la connexion Shopify ({searchParams.get('reason') || 'inconnue'}).
            Vérifie l&apos;URL de ta boutique et réessaie.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        <ShopifyCard initialStatus={shopifyStatus} initialShopDomain={shopifyDomain} />
        <MetaAdsCard />
      </div>

      <div className="mt-6 px-4 py-3 bg-gray-800/30 border border-gray-800 rounded-lg">
        <p className="text-xs text-gray-500">
          Tes données sont chiffrées et ne sont jamais partagées. Elles sont uniquement utilisées pour générer tes recommandations personnalisées.
        </p>
      </div>
    </div>
  )
}
