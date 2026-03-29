'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type ConnectionStatus = 'disconnected' | 'connected' | 'error'

function StatusIndicator({ status }: { status: ConnectionStatus }) {
  if (status === 'connected') {
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-green-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Connecte
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Erreur
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-white/30">
      <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
      Non connecte
    </span>
  )
}

function ShopifyCard({
  status,
  shopDomain,
  onDisconnect,
}: {
  status: ConnectionStatus
  shopDomain: string
  onDisconnect: () => void
}) {
  const [shopUrl, setShopUrl] = useState(shopDomain)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (shopDomain) setShopUrl(shopDomain)
  }, [shopDomain])

  function handleConnect() {
    if (!shopUrl.trim()) return
    setLoading(true)
    const domain = shopUrl
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
    window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(domain)}`
  }

  function handleDisconnect() {
    onDisconnect()
    setShopUrl('')
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.05]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#96bf48]/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-[#96bf48]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.34 3.38c-.09-.04-.18-.01-.24.05-.06.06-1.16 1.41-1.28 1.55-.29-.7-.8-1.35-1.7-1.35h-.08c-.25-.3-.56-.45-.84-.45-2.08 0-3.08 2.6-3.39 3.92-.81.25-1.38.43-1.45.45-.45.14-.46.15-.52.58-.05.32-1.22 9.38-1.22 9.38L12.23 19l5.42-1.17S15.44 3.46 15.43 3.42c0-.01-.04-.03-.09-.04zm-2.72 1.87c-.27.08-.57.18-.89.27 0-.06 0-.13-.01-.2-.18-.92-.64-1.37-1.13-1.53.46-.06.84.31 1.06.71.03.06.07.11.1.17-.04.19-.08.38-.13.58zm-1.71.53c-.6.18-1.25.39-1.25.39s.41-1.58 1.22-2.11c.3-.2.68-.28.92-.1-.45.4-.72 1.01-.89 1.82zm.71-2.34c.15 0 .28.05.39.14-.86.41-1.35 1.47-1.53 2.35l-1.01.31c.35-1.19 1.15-2.8 2.15-2.8z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-[14px] font-medium text-white tracking-[0.02em]">Shopify</h3>
            <p className="text-[12px] text-white/30 mt-0.5 leading-[1.6]">Synchronise tes produits et ventes</p>
          </div>
        </div>
        <StatusIndicator status={status} />
      </div>

      {status === 'connected' ? (
        <div>
          <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[13px] text-white/50">{shopUrl}</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-[12px] text-white/30 hover:text-red-400 transition-colors duration-200 active:scale-[0.98]"
          >
            Deconnecter
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="mon-shop.myshopify.com"
            value={shopUrl}
            onChange={(e) => setShopUrl(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-full text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-white/[0.2] transition-colors duration-200"
          />
          <button
            onClick={handleConnect}
            disabled={loading || !shopUrl.trim()}
            className="btn-primary whitespace-nowrap"
          >
            {loading ? 'Redirection...' : 'Connecter'}
          </button>
        </div>
      )}
    </div>
  )
}

function MetaAdsCard({
  status,
  onDisconnect,
}: {
  status: ConnectionStatus
  onDisconnect: () => void
}) {
  const [loading, setLoading] = useState(false)

  function handleConnect() {
    setLoading(true)
    window.location.href = '/api/meta/auth'
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.05]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-[14px] font-medium text-white tracking-[0.02em]">Meta Ads</h3>
            <p className="text-[12px] text-white/30 mt-0.5 leading-[1.6]">Importe tes campagnes Facebook & Instagram</p>
          </div>
        </div>
        <StatusIndicator status={status} />
      </div>

      {status === 'connected' ? (
        <div>
          <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[13px] text-white/50">Compte Meta connecte</span>
          </div>
          <button
            onClick={onDisconnect}
            className="text-[12px] text-white/30 hover:text-red-400 transition-colors duration-200 active:scale-[0.98]"
          >
            Deconnecter
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="btn-glass"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Redirection...
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
  const [metaStatus, setMetaStatus] = useState<ConnectionStatus>('disconnected')

  const fetchConnections = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('connections')
      .select('*')
      .eq('status', 'active')

    if (data) {
      const rows = data as Record<string, unknown>[]
      const shopify = rows.find(r => r.platform === 'shopify')
      if (shopify) {
        setShopifyStatus('connected')
        setShopifyDomain((shopify.shop_domain as string) || '')
      }
      const meta = rows.find(r => r.platform === 'meta')
      if (meta) {
        setMetaStatus('connected')
      }
    }
  }, [])

  useEffect(() => {
    const shopifyParam = searchParams.get('shopify')
    if (shopifyParam === 'connected') setShopifyStatus('connected')
    else if (shopifyParam === 'error') setShopifyStatus('error')

    const metaParam = searchParams.get('meta')
    if (metaParam === 'connected') setMetaStatus('connected')
    else if (metaParam === 'error') setMetaStatus('error')

    fetchConnections()
  }, [searchParams, fetchConnections])

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="font-display text-[28px] text-white">Connexions</h2>
        <p className="text-[13px] text-white/50 mt-2 leading-[1.6]">
          Connecte tes plateformes pour alimenter le Market Brain avec tes vraies donnees.
        </p>
      </div>

      {searchParams.get('shopify') === 'connected' && (
        <div className="mb-4 px-4 py-3 bg-green-500/5 border border-green-500/10 rounded-2xl">
          <p className="text-[13px] text-green-400 leading-[1.6]">
            Shopify connecte avec succes ! Tes donnees seront synchronisees automatiquement.
          </p>
        </div>
      )}

      {searchParams.get('shopify') === 'error' && (
        <div className="mb-4 px-4 py-3 bg-red-500/5 border border-red-500/10 rounded-2xl">
          <p className="text-[13px] text-red-400 leading-[1.6]">
            Erreur lors de la connexion Shopify ({searchParams.get('reason') || 'inconnue'}).
            Verifie l&apos;URL de ta boutique et reessaie.
          </p>
        </div>
      )}

      {searchParams.get('meta') === 'connected' && (
        <div className="mb-4 px-4 py-3 bg-green-500/5 border border-green-500/10 rounded-2xl">
          <p className="text-[13px] text-green-400 leading-[1.6]">
            Meta Ads connecte avec succes ! Tes campagnes seront synchronisees.
          </p>
        </div>
      )}

      {searchParams.get('meta') === 'error' && (
        <div className="mb-4 px-4 py-3 bg-red-500/5 border border-red-500/10 rounded-2xl">
          <p className="text-[13px] text-red-400 leading-[1.6]">
            Erreur lors de la connexion Meta ({searchParams.get('reason') || 'inconnue'}).
            Reessaie ou verifie les permissions.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        <ShopifyCard
          status={shopifyStatus}
          shopDomain={shopifyDomain}
          onDisconnect={() => {
            setShopifyStatus('disconnected')
            setShopifyDomain('')
          }}
        />
        <MetaAdsCard
          status={metaStatus}
          onDisconnect={() => setMetaStatus('disconnected')}
        />
      </div>

      <div className="mt-6 px-4 py-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
        <p className="text-[11px] text-white/30 leading-[1.6]">
          Tes donnees sont chiffrees et ne sont jamais partagees. Elles sont uniquement utilisees pour generer tes recommandations personnalisees.
        </p>
      </div>
    </div>
  )
}
